/**
 * ASTRA — Functional teleology: synthetic example (v3.3.0-rc.2)
 *   node examples/teleology/replay.mjs           regenerate comparison-output.json
 *   node examples/teleology/replay.mjs --check   exit 1 if the stored report is stale (CI)
 * Requires a build (npm run build). The figures are synthetic; no observation was made.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { compare } from '../../dist/engine/teleology/index.js';

const OUT = new URL('./comparison-output.json', import.meta.url);
const input = JSON.parse(readFileSync(new URL('./comparison-input.json', import.meta.url), 'utf8'));
const text = JSON.stringify(compare(input), null, 2) + '\n';

if (process.argv.includes('--check')) {
  const stored = readFileSync(OUT, 'utf8').replace(/\r\n/g, '\n');
  if (stored !== text) {
    console.error('examples/teleology/comparison-output.json is stale: run node examples/teleology/replay.mjs');
    process.exit(1);
  }
  console.log('Synthetic comparison current (recomputed by the compiled module).');
} else {
  writeFileSync(OUT, text);
  console.log('Synthetic comparison regenerated. No empirical observation was made.');
}
