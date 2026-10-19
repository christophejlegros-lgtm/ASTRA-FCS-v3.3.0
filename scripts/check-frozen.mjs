#!/usr/bin/env node
/**
 * ASTRA — Frozen-file gate (v3.2.0)
 * ═════════════════════════════════
 * The E1 and E2 preregistrations froze seven files and two preregistration
 * texts by SHA-256 of their LF-normalised content; the three published result
 * files (E1.json, E2.json, E2_control_poisson.json) are protected as well. If any of them changes,
 * `empirical/run_e2.py` refuses to replay E2 (or records a code drift that
 * makes the test non-conclusive). This gate fails CI before that can happen.
 *
 * Any evolution of the simulator, the export or the bench belongs in NEW
 * files (as empirical/e3_analysis.py does), never in these.
 *
 * Usage: node scripts/check-frozen.mjs
 * © 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Source of each hash, so that a reviewer can check it against the document that fixed it. */
export const FROZEN = Object.freeze({
  'empirical/PREREG-DANDI-001603.md': ['869d80ff4fcb71bee450c029377ff20a45a81528c3ace54fe5b42c572c356ce6', 'RESULTS-E1.md header'],
  'empirical/PREREG-E2-DANDI-001603.md': ['bc5a3d5c9a757afef1a8160272583e72d66a26536cb3fd296e77c47897e6bf54', 'RESULTS-E2.md header'],
  'src/engine/neuroplatform.ts': ['e529bf16221fe1d296fb097ce6b81faaeace1a4890cee87588820fa8a99ef7f1', 'PREREG-E2 §3'],
  'empirical/sim_export.ts': ['17186253ae6e1ac2d03f5b71c99599ff32c9691fc9267f7d33efafe0767c2de7', 'PREREG-E2 §3'],
  'empirical/confront.py': ['2e674ebaf34a31e56b3a0baabab3e4d5094fe6a51efb47faa8832fddb735a7ee', 'PREREG-E2 §3'],
  'empirical/run_e2.py': ['1c802ba160f407ce31d0dff4b3705f35b49d856d5872b3f3f0fbb8bde82c2e85', 'PREREG-E2 §3'],
  'empirical/e2_calibrate.py': ['9b4495443efdb3004b463f8fc0c2d4bc0072d78903e8d27136bb7af3075ca5ef', 'PREREG-E2 §3'],
  'empirical/results/E2_calibration.json': ['2d2c11bf952af6dbfb99ce3bb3a177b50fd809b3bd7e9673a7bcffd94cd9c72a', 'PREREG-E2 §3'],
  'empirical/results/E2_insample_training.json': ['f7690b62a5ada7663bd449d4ddd874ec6578825bb6acc004f6ca8c94694e2c2f', 'PREREG-E2 §3'],
  // Published results (v3.2.0, after independent review): not frozen by a preregistration,
  // but protected so that the recorded verdicts cannot drift silently (empirical/PROVENANCE.md §3).
  'empirical/results/E1.json': ['8cd6540448c44e0419608eaf62a37326d33a106631115b31525c85336ea6773c', 'PROVENANCE.md §3 (published result)'],
  'empirical/results/E2.json': ['5304ae78e3898ad6a6851baf3cbc15d0a1827a79f275b8370a81f3cc299923cd', 'PROVENANCE.md §3 (published result)'],
  'empirical/results/E2_control_poisson.json': ['480cb464bac65cd74ca4ac15b1aa3b2eea75d2a6928337fd1a29f0f8efa0272a', 'PROVENANCE.md §3 (published result)'],
});

export function lfSha256(path) {
  const buf = readFileSync(path);
  const text = buf.toString('latin1').replace(/\r\n/g, '\n');
  return createHash('sha256').update(Buffer.from(text, 'latin1')).digest('hex');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('check-frozen.mjs')) {
  let bad = 0;
  for (const [rel, [want, source]] of Object.entries(FROZEN)) {
    let got;
    try { got = lfSha256(join(ROOT, rel)); } catch (e) { got = `unreadable (${e.code})`; }
    const ok = got === want;
    if (!ok) bad++;
    console.log(`${ok ? 'OK   ' : 'DRIFT'} ${rel}  [${source}]${ok ? '' : `\n      expected ${want}\n      found    ${got}`}`);
  }
  if (bad) {
    console.error(`\n${bad} frozen file(s) changed. E2 would no longer replay from this tree. Revert them; put new work in new files.`);
    process.exit(1);
  }
  console.log('\nAll frozen and protected files are byte-identical (LF-normalised) to their recorded hashes.');
}
