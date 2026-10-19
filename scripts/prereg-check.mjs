#!/usr/bin/env node
/**
 * ASTRA — Preregistration readiness check (v3.2.0)
 * ════════════════════════════════════════════════
 * Programme minimal de consolidation, points 2 and 4: a preregistration may be
 * filed on a time-stamped registry only once every parameter is fixed. This
 * script lists what is still open in each draft — « À FIXER », « TO BE SET »
 * and « PROPOSITION » markers — and refuses (exit 1) while any remains.
 *
 *   node scripts/prereg-check.mjs            exit 1 if a draft is not ready
 *   node scripts/prereg-check.mjs --report   always exit 0 (CI information step)
 *
 * What is counted (refined after independent review): markers in the body of
 * the drafts. NOT counted: fenced code blocks, blockquotes (status notes), and
 * any line carrying the comment `<!-- prereg-check: ignore -->` (legends and
 * instructions that name the markers). The count can therefore reach zero
 * without deleting the instructions.
 *
 * The drafts are the author's; this script fixes nothing, it only counts.
 * © 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DRAFTS = ['PREREGISTRATION.md', 'empirical/PREREG-E3-DRAFT.md'];
const MARKERS = [/À FIXER/g, /TO BE SET/g, /PROPOSITION/g];

let open = 0;
for (const rel of DRAFTS) {
  const p = join(ROOT, rel);
  if (!existsSync(p)) { console.log(`${rel}: absent`); continue; }
  const lines = readFileSync(p, 'utf8').split('\n');
  const hits = [];
  let fenced = false;
  lines.forEach((line, i) => {
    if (/^\s*```/.test(line)) { fenced = !fenced; return; }
    if (fenced || /^\s*>/.test(line) || line.includes('<!-- prereg-check: ignore -->')) return;
    const n = MARKERS.reduce((s, re) => s + (line.match(re)?.length ?? 0), 0);
    if (n > 0) hits.push({ line: i + 1, n, text: line.trim().slice(0, 110) });
  });
  const total = hits.reduce((s, h) => s + h.n, 0);
  open += total;
  const status = /BROUILLON NON DÉPOSÉ|UNFILED DRAFT/.test(lines.slice(0, 12).join('\n')) ? 'unfiled draft' : 'status line not found';
  console.log(`\n${rel} — ${total} open marker(s), ${status}`);
  for (const h of hits) console.log(`  l.${String(h.line).padStart(4)}  ×${h.n}  ${h.text}`);
}
console.log(open === 0
  ? '\nNo open marker: the drafts may be completed and filed (time-stamped registry), then their status line changed.'
  : `\n${open} open marker(s): NOT READY TO FILE. Each one is a decision for the author, before any data.`);
if (open > 0 && !process.argv.includes('--report')) process.exit(1);
