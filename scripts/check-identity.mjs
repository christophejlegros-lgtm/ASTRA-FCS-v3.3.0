#!/usr/bin/env node
/**
 * ASTRA — Identity of the cited object (v3.2.0)
 * ═════════════════════════════════════════════
 * Programme minimal de consolidation, point 1 — « stabiliser l'objet cité » —
 * of the epistemological analysis of 9 October 2026. The archive analysed was
 * named v3.1.0 while package.json and src/version.ts declared v3.1.1. This
 * gate makes such a divergence a CI failure: every place that names the
 * current version or the MCP capability counts must agree with
 * src/version.ts (ASTRA_VERSION, EXPECTED_CAPABILITIES).
 *
 * The GitHub repository NAME (…-MCP-FCS-v3.1.0) is not a version identifier
 * and cannot be changed from the tree; it is reported as a notice, and
 * RELEASE.md recommends a version-neutral name.
 *
 * v3.3.0-rc.3 — the NAME is part of the identity too (`checkName`). The expansion,
 * minus its declared function words, must be exactly the declared initial-bearing
 * units, whose first letters spell the acronym; README.md, package.json,
 * CITATION.cff, .zenodo.json and the dashboard must carry the current name; the
 * withdrawn expansions may appear only where their withdrawal is recorded; and
 * the name, definitions and summaries must clear `lintClaim` and `lintFcs`, the
 * name containing no term of the phenomenal vocabulary (teleology
 * `PHENOMENAL_TERMS`). The test checks that it can fail: each withdrawn expansion
 * must itself be caught by that vocabulary.
 *
 * Usage: npm run check:identity   (tsx: the name test imports the TypeScript
 * linters from src/, so it needs no build; exit 1 on any mismatch)
 * © 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, sep } from 'node:path';
import { ASTRA_IDENTITY } from '../src/version.js';
import { lintClaim } from '../src/engine/tcai/phenomenal-guard.js';
import { lintFcs } from '../src/engine/fcs/negative-heuristic.js';
import { PHENOMENAL_TERMS } from '../src/engine/teleology/index.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

export function checkIdentity() {
  const problems = [];
  const notices = [];
  const vts = read('src/version.ts');
  const version = /ASTRA_VERSION\s*=\s*'([^']+)'/.exec(vts)?.[1];
  const cap = /EXPECTED_CAPABILITIES\s*=\s*Object\.freeze\(\{\s*tools:\s*(\d+),\s*resources:\s*(\d+),\s*prompts:\s*(\d+)/.exec(vts);
  if (!version || !cap) return { version: null, problems: ['src/version.ts: ASTRA_VERSION or EXPECTED_CAPABILITIES not found'], notices };
  const [tools, resources, prompts] = cap.slice(1).map(Number);
  const expect = (cond, msg) => { if (!cond) problems.push(msg); };

  const pkg = JSON.parse(read('package.json'));
  expect(pkg.version === version, `package.json version ${pkg.version} ≠ ${version}`);
  const lock = JSON.parse(read('package-lock.json'));
  expect(lock.version === version, `package-lock.json version ${lock.version} ≠ ${version}`);
  expect(lock.packages?.['']?.version === version, `package-lock.json packages[""].version ≠ ${version}`);

  const cff = read('CITATION.cff');
  expect(new RegExp(`^version:\\s*"?${version.replace(/\./g, '\\.')}"?\\s*$`, 'm').test(cff), `CITATION.cff version ≠ ${version}`);
  expect(cff.includes(`${tools} simulation and analysis tools`), `CITATION.cff abstract does not state ${tools} tools`);

  const zen = JSON.parse(read('.zenodo.json'));
  expect(zen.version === version, `.zenodo.json version ${zen.version} ≠ ${version}`);
  expect(String(zen.description).includes(`${tools} simulation and analysis tools`), `.zenodo.json description does not state ${tools} tools`);

  const summary = `ASTRA MCP Server v${version}: ${tools} tools · ${resources} resources · ${prompts} prompts`;
  expect(read('.github/workflows/ci.yml').includes(summary), `ci.yml smoke test does not assert "${summary}"`);
  expect(read('src/server.ts').includes(`${tools} Tools · ${resources} Resources · ${prompts} Prompts`), 'src/server.ts header counts are stale');

  const readme = read('README.md');
  expect(readme.includes(`## MCP Tools (${tools})`), `README: "## MCP Tools (${tools})" missing`);
  expect(readme.includes(`## MCP Resources (${resources})`), `README: "## MCP Resources (${resources})" missing`);
  expect(readme.includes(`## MCP Prompts (${prompts})`), `README: "## MCP Prompts (${prompts})" missing`);
  expect(new RegExp(`^## .*v${version.replace(/\./g, '\\.')}\\b`, 'm').test(readme), `README: no section heading for v${version}`);
  expect(readme.includes(`<!-- astra-current-version: ${version} -->`), `README: current-version marker for ${version} missing`);

  const review = read('REVIEW.md');
  expect(review.includes(`v${version}`), `REVIEW.md does not name v${version}`);
  const otherReview = [...review.matchAll(/ASTRA-FCS v(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)/g)].map((m) => m[1]).filter((v) => v !== version);
  expect(otherReview.length === 0, `REVIEW.md names other versions as current: ${otherReview.join(', ')}`);

  if (existsSync(join(ROOT, 'CHANGELOG.md'))) {
    const top = /^## \[([^\]]+)\]/m.exec(read('CHANGELOG.md'))?.[1];
    expect(top === version, `CHANGELOG.md top entry ${top} ≠ ${version}`);
  } else problems.push('CHANGELOG.md missing');

  const repo = /repository-code:\s*"([^"]+)"/.exec(cff)?.[1] ?? '';
  const repoVersion = /-v(\d+\.\d+\.\d+)$/.exec(repo)?.[1];
  if (repoVersion && repoVersion !== version) {
    notices.push(`Repository name carries "v${repoVersion}" while the tree is v${version}: the name is not a version identifier (RELEASE.md §1).`);
  }
  const name = checkName();
  problems.push(...name.problems);
  notices.push(...name.notices);
  return { version, capabilities: { tools, resources, prompts }, problems, notices };
}

/** Files scanned for withdrawn expansions (history records are exempt: they record the withdrawal). */
const SCAN_EXT = /\.(md|ts|mjs|js|json|cff|html|ya?ml|txt|py)$/;
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'validation', 'the_consciousness_ai']);
const HISTORY = (rel) => rel === 'CHANGELOG.md' || rel === 'REVIEW.md' || /^REVUE-/.test(rel) || rel === 'package-lock.json';
const WITHDRAWAL_MARK = /withdrawn|withdrawnIn|retir[ée]|former|formerly|ancien|replaced|remplac|until v|jusqu/i;

function* textFiles(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const abs = join(dir, entry);
    const st = statSync(abs);
    if (st.isDirectory()) yield* textFiles(abs);
    else if (SCAN_EXT.test(entry) && st.size < 4_000_000) yield abs;
  }
}

/** Split an expansion into words, separating a French elision (l', d') from its word. */
function words(text) {
  return text.split(/\s+/u).flatMap((w) => {
    const m = /^([ldLD])['’](.+)$/u.exec(w);
    return m ? [`${m[1].toLowerCase()}'`, m[2]] : [w];
  });
}

/**
 * The name test. `identity` defaults to src/version.ts; `files: false` limits it
 * to the checks that need no repository file (used by the tests to show that a
 * phenomenal or ill-formed expansion fails).
 */
export function checkName(identity = ASTRA_IDENTITY, { files = true } = {}) {
  const problems = [];
  const notices = [];
  const expect = (cond, msg) => { if (!cond) problems.push(`name: ${msg}`); };
  const I = identity;

  // 1. The expansion spells the acronym, under a reading that is declared.
  expect(I.id.startsWith(I.acronym), `identifier ${I.id} does not start with ${I.acronym}`);
  for (const lang of ['en', 'fr']) {
    const fw = new Set(I.functionWords[lang].map((w) => w.toLowerCase()));
    const content = words(I.name[lang]).filter((w) => !fw.has(w.toLowerCase())).join(' ');
    const units = I.initials[lang].join(' ');
    expect(content === units,
      `${lang} expansion "${I.name[lang]}" without its function words reads "${content}", not the declared units "${units}"`);
    const spelled = I.initials[lang].map((u) => u[0].toUpperCase()).join('');
    expect(spelled === I.acronym, `${lang} units spell ${spelled}, not ${I.acronym}`);
    for (const u of I.initials[lang]) {
      if (/\s/u.test(u)) notices.push(`The ${lang} acronym reads « ${u} » as one unit (declared in src/version.ts).`);
    }
  }

  // 2. Name, definitions and summaries clear both linters; the name carries no phenomenal term.
  const texts = { 'name.en': I.name.en, 'name.fr': I.name.fr, 'definition.en': I.definition.en,
    'definition.fr': I.definition.fr, 'summary.en': I.summary.en, 'summary.fr': I.summary.fr };
  for (const [k, t] of Object.entries(texts)) {
    const c = lintClaim(t), f = lintFcs(t);
    expect(c.length === 0, `${k} fails lintClaim (${c.length} pattern(s))`);
    expect(f.length === 0, `${k} fails lintFcs (${f.map((x) => x.prohibition ?? '?').join(', ')})`);
  }
  for (const lang of ['en', 'fr']) {
    expect(!PHENOMENAL_TERMS.test(I.name[lang]), `${lang} name contains a term of the phenomenal vocabulary`);
  }
  for (const w of I.withdrawn) {
    // The test must be able to fail: a withdrawn expansion is caught by the same vocabulary.
    expect(PHENOMENAL_TERMS.test(w.expansion), `withdrawn "${w.expansion}" escapes the phenomenal vocabulary: the test cannot discriminate`);
    expect(w.expansion !== I.name.en && w.expansion !== I.name.fr, `withdrawn "${w.expansion}" is the current name`);
  }
  if (!files) return { problems, notices };

  // 3. The current name is carried where the object is named.
  const head = `${I.id} — ${I.name.en}`;
  const readme = read('README.md');
  expect(readme.startsWith(`# ${I.id}`), `README.md H1 does not start with "# ${I.id}"`);
  expect(readme.includes(`**${I.acronym} — ${I.name.en}**`), 'README.md does not state the English expansion');
  expect(readme.includes(I.name.fr), 'README.md does not state the French expansion');
  expect(readme.includes(I.definition.en) && readme.includes(I.definition.fr), 'README.md does not carry both canonical definitions verbatim');
  const pkg = JSON.parse(read('package.json'));
  expect(String(pkg.description).startsWith(head), `package.json description does not start with "${head}"`);
  const cffTitle = /^title:\s*"([^"]+)"/m.exec(read('CITATION.cff'))?.[1] ?? '';
  expect(cffTitle.startsWith(head), `CITATION.cff title does not start with "${head}"`);
  const zen = JSON.parse(read('.zenodo.json'));
  expect(String(zen.title).startsWith(head), `.zenodo.json title does not start with "${head}"`);
  expect(read('dashboard/ASTRA-Dashboard.html').includes(I.name.en), 'dashboard does not carry the current expansion');

  // 4. A withdrawn expansion appears only where its withdrawal is recorded.
  for (const abs of textFiles(ROOT)) {
    const rel = relative(ROOT, abs).split(sep).join('/');
    if (HISTORY(rel)) continue;
    const lines = readFileSync(abs, 'utf8').split('\n');
    lines.forEach((line, i) => {
      for (const w of I.withdrawn) {
        if (!line.toLowerCase().includes(w.expansion.toLowerCase())) continue;
        const near = [lines[i - 1] ?? '', line, lines[i + 1] ?? ''].join(' ');
        expect(WITHDRAWAL_MARK.test(near), `${rel}:${i + 1} uses the withdrawn expansion "${w.expansion}" as a current name`);
      }
    });
  }
  return { problems, notices };
}

if (process.argv[1]?.endsWith('check-identity.mjs')) {
  const r = checkIdentity();
  for (const n of r.notices) console.log(`notice  ${n}`);
  if (r.problems.length) {
    for (const p of r.problems) console.error(`MISMATCH ${p}`);
    console.error(`\n${r.problems.length} identity mismatch(es) for v${r.version}.`);
    process.exit(1);
  }
  console.log(`Identity consistent: v${r.version} · ${r.capabilities.tools} tools · ${r.capabilities.resources} resources · ${r.capabilities.prompts} prompts.`);
  console.log(`Name consistent: ${ASTRA_IDENTITY.id} — ${ASTRA_IDENTITY.name.en} / ${ASTRA_IDENTITY.name.fr}.`);
}
