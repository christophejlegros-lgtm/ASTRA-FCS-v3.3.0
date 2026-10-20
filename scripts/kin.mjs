#!/usr/bin/env node
/**
 * ASTRA — Kinaesthetic withdrawal test: command line (v3.3.0-rc.5)
 * ═════════════════════════════════════════════════════════════════
 * Run through tsx (it imports the analysis from src/, no build needed):
 *
 *   npm run kin:protocol -- empirical/protocols/FCS-K1.protocol.json [--strict]
 *       SHA-256 of the scientific content (status and registry excluded), open
 *       parameters, condition-space problems, channel overlap, ethics decision.
 *       --strict: exit 1 unless the protocol is ready to file.
 *
 *   npm run kin:k0:dryrun -- [--sessions 10]
 *       FCS-K0 pipeline on SIMULATED sessions: probe session → observations →
 *       analysis. Tests the chain; by declaration and by origin it never sets
 *       a withdrawal outcome.
 *
 *   npm run kin:k0:observe -- <protocol.json> <session.json>… --out <observations.json>
 *       Recorded FCS-K0 sessions → one observation per session and condition.
 *       A session file holds: unitId, collectedAt, interoceptiveSpecs, efference,
 *       somatosensory, interoceptive, [interoceptiveLoad], probes, probeOfCommand,
 *       testStart (see src/engine/body-probes.ts). Origins are carried through.
 *
 *   npm run kin:analyse -- <protocol.json> <observations.json> [--sha256 <hash>]
 *       Analysis of recorded observations under a protocol. Pass the hash
 *       quoted on the registry with --sha256: a protocol changed since then is
 *       refused for confirmatory use.
 *
 * © 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { freezeProtocol, analyseKinaestheticTest } from '../src/engine/fcs/kinaesthetic-withdrawal.js';
import { simulateProbeSession, probeObservation } from '../src/engine/body-probes.js';
import { exampleRobotInteroception } from '../src/engine/interoception.js';

const [cmd, ...rest] = process.argv.slice(2);
const flag = (name) => { const i = rest.indexOf(name); return i >= 0 ? rest[i + 1] : undefined; };
const positional = rest.filter((a, i) => !a.startsWith('--') && !(i > 0 && rest[i - 1].startsWith('--') && rest[i - 1] !== '--strict'));
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const r3 = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 1000) / 1000 : v);

function report(frozen) {
  const ready = frozen.openParameters.length === 0 && frozen.conditionProblems.length === 0 &&
    frozen.channelOverlap.length === 0 && frozen.ethics.decision !== 'BLOCK';
  console.log(`${frozen.protocol.id} (${frozen.protocol.role}, ${frozen.protocol.status})`);
  console.log(`  SHA-256 (scientific content): ${frozen.sha256}`);
  console.log(`  open parameters:   ${frozen.openParameters.join(', ') || 'none'}`);
  console.log(`  condition space:   ${frozen.conditionProblems.join('; ') || 'valid'}`);
  console.log(`  channel overlap:   ${frozen.channelOverlap.join(', ') || 'none'}`);
  console.log(`  ethics:            ${frozen.ethics.decision} — ${frozen.ethics.reasons.join(' ')}`);
  console.log(`  ready to file:     ${ready ? 'yes' : 'NO'}`);
  return ready;
}

function summary(a) {
  console.log(`\npattern: ${a.pattern}   confirmatory: ${a.confirmatory}`);
  for (const fam of ['sensorimotor', 'interoceptive']) {
    const f = a.families[fam];
    const e = f.effect ? `slope ${r3(f.effect.mean)} [${r3(f.effect.lower)}, ${r3(f.effect.upper)}]` : 'no estimate';
    console.log(`  ${fam.padEnd(13)} ${String(f.classification).padEnd(18)} ${e}  check: ${f.manipulationCheck.status}  monotonicity: ${f.monotonicityGuard}`);
  }
  for (const r of a.undeterminedReasons) console.log(`  · ${r}`);
  for (const r of a.confirmatoryRefusals) console.log(`  ✗ ${r}`);
  console.log(`withdrawal outcome: ${JSON.stringify(a.withdrawalOutcome)} → kinaesthetic thesis ${a.kinaestheticStanding.standing}`);
}

if (cmd === 'hash') {
  if (!positional[0]) { console.error('usage: kin.mjs hash <protocol.json> [--strict]'); process.exit(2); }
  const ready = report(freezeProtocol(readJson(positional[0])));
  if (rest.includes('--strict') && !ready) process.exit(1);
} else if (cmd === 'dryrun-k0') {
  const protocol = readJson(new URL('../empirical/protocols/FCS-K0.protocol.json', import.meta.url));
  const frozen = freezeProtocol(protocol);
  report(frozen);
  const sessions = Number(flag('--sessions') ?? protocol.minUnits ?? 10);
  const obs = [];
  for (let u = 1; u <= sessions; u++) {
    const s = simulateProbeSession({ seed: u });
    for (const c of protocol.conditions) {
      obs.push(probeObservation(s, c, exampleRobotInteroception(), { unitId: `sim-session-${u}`, collectedAt: new Date().toISOString() }));
    }
  }
  console.log(`\n${obs.length} simulated observations (${sessions} sessions × ${protocol.conditions.length} conditions)`);
  summary(analyseKinaestheticTest(frozen, obs));
} else if (cmd === 'k0-observe') {
  const out = flag('--out');
  const files = positional.filter((p) => p !== out);
  if (files.length < 2 || !out) { console.error('usage: kin.mjs k0-observe <protocol.json> <session.json>… --out <observations.json>'); process.exit(2); }
  const protocol = readJson(files[0]);
  const obs = [];
  for (const f of files.slice(1)) {
    const s = readJson(f);
    for (const k of ['unitId', 'collectedAt', 'interoceptiveSpecs', 'efference', 'somatosensory', 'interoceptive', 'probes', 'probeOfCommand', 'testStart']) {
      if (s[k] === undefined) { console.error(`${f}: missing field "${k}"`); process.exit(2); }
    }
    for (const c of protocol.conditions) {
      obs.push(probeObservation(s, c, s.interoceptiveSpecs, { unitId: s.unitId, collectedAt: s.collectedAt }));
    }
  }
  writeFileSync(out, JSON.stringify(obs, null, 1) + '\n');
  console.log(`${obs.length} observations written to ${out} (${files.length - 1} session(s) × ${protocol.conditions.length} conditions)`);
} else if (cmd === 'analyse') {
  if (positional.length < 2) { console.error('usage: kin.mjs analyse <protocol.json> <observations.json> [--sha256 <hash>]'); process.exit(2); }
  const frozen = freezeProtocol(readJson(positional[0]));
  const quoted = flag('--sha256');
  if (quoted) frozen.sha256 = quoted;
  report(frozen);
  summary(analyseKinaestheticTest(frozen, readJson(positional[1])));
} else {
  console.error('usage: kin.mjs hash|dryrun-k0|k0-observe|analyse …');
  process.exit(2);
}
