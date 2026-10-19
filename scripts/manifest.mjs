#!/usr/bin/env node
/**
 * ASTRA — Release manifest (v3.2.0)
 * ═════════════════════════════════
 * Programme minimal de consolidation, point 1: hashes must allow independent
 * inspection, not merely be declared. `MANIFEST.sha256` lists the SHA-256 of
 * every file of the release tree, so that anyone holding the archive, a clone
 * or a Zenodo deposit can check that it is the object cited.
 *
 * Text files (no NUL byte) are hashed after CRLF → LF normalisation, so that a
 * Windows checkout with autocrlf verifies; binary files are hashed raw. The
 * format is that of `sha256sum` with a `*` marker for binary files, preceded
 * by comment lines.
 *
 *   node scripts/manifest.mjs           write MANIFEST.sha256
 *   node scripts/manifest.mjs --check   verify the tree against it (exit 1 on mismatch)
 *
 * Which files. In a git work tree: the files git tracks or would track
 * (`git ls-files --cached --others --exclude-standard`), so that anything
 * .gitignore excludes (.env, logs/, dist/…) can never enter the manifest. In an
 * archive without .git: a walk of the tree minus the same exclusions
 * (.git/, node_modules/, dist/, coverage/, __pycache__/, logs/, *.pyc, *.log,
 * *.tmp, .env*, *.pem, *.key, empirical/results/**\/*.sim.json, *.nwb).
 * MANIFEST.sha256 itself is never listed.
 *
 * © 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, sep } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'MANIFEST.sha256');
const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'coverage', '__pycache__', '.venv', 'venv', 'logs', '.cache', '.nyc_output', '.idea', '.vscode']);
const skipFile = (rel) => {
  const base = rel.split('/').pop();
  return rel === 'MANIFEST.sha256' || /\.(pyc|nwb|log|tmp|pem|key|tsbuildinfo|swp)$/.test(rel) ||
    base === '.env' || base.startsWith('.env.') || base === '.DS_Store' || base === 'Thumbs.db' ||
    (rel.startsWith('empirical/results/') && rel.endsWith('.sim.json'));
};

function listFiles() {
  if (existsSync(join(ROOT, '.git'))) {
    try {
      const out = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: ROOT });
      return { source: 'git ls-files', files: out.toString('utf8').split('\0').filter((f) => f && !skipFile(f) && existsSync(join(ROOT, f))).sort() };
    } catch { /* fall through to the walk */ }
  }
  return { source: 'tree walk', files: walk(ROOT) };
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir).sort()) {
    const abs = join(dir, name);
    const st = statSync(abs);
    if (st.isDirectory()) { if (!SKIP_DIRS.has(name)) walk(abs, out); }
    else {
      const rel = relative(ROOT, abs).split(sep).join('/');
      if (!skipFile(rel)) out.push(rel);
    }
  }
  return out;
}

function hashFile(rel) {
  const buf = readFileSync(join(ROOT, rel));
  const binary = buf.includes(0);
  const data = binary ? buf : Buffer.from(buf.toString('latin1').replace(/\r\n/g, '\n'), 'latin1');
  return { hash: createHash('sha256').update(data).digest('hex'), binary };
}

const version = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;
const { source, files } = listFiles();

if (process.argv.includes('--check')) {
  if (!existsSync(OUT)) { console.error('MANIFEST.sha256 not found — run `npm run manifest` first.'); process.exit(1); }
  const listed = new Map();
  for (const line of readFileSync(OUT, 'utf8').split('\n')) {
    const m = /^([0-9a-f]{64}) ([ *])(.+)$/.exec(line);
    if (m) listed.set(m[3], m[1]);
  }
  const problems = [];
  for (const rel of files) {
    if (!listed.has(rel)) { problems.push(`UNLISTED  ${rel}`); continue; }
    if (listed.get(rel) !== hashFile(rel).hash) problems.push(`CHANGED   ${rel}`);
    listed.delete(rel);
  }
  for (const rel of listed.keys()) problems.push(`MISSING   ${rel}`);
  if (problems.length) { console.error(problems.join('\n')); console.error(`\n${problems.length} discrepancy(ies) against MANIFEST.sha256.`); process.exit(1); }
  console.log(`MANIFEST.sha256 verified: ${files.length} files (${source}), v${version}.`);
} else {
  const lines = [
    `# ASTRA ${version} — release manifest (SHA-256).`,
    '# Text files hashed after CRLF→LF normalisation; binary files (marked *) hashed raw.',
    '# Verify: node scripts/manifest.mjs --check   ·   regenerate: node scripts/manifest.mjs',
    ...files.map((rel) => { const { hash, binary } = hashFile(rel); return `${hash} ${binary ? '*' : ' '}${rel}`; }),
  ];
  writeFileSync(OUT, lines.join('\n') + '\n');
  console.log(`MANIFEST.sha256 written: ${files.length} files (${source}), v${version}.`);
}
