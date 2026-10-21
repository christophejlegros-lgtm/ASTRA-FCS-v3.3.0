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
 *   node --import tsx scripts/kin.mjs file <protocol.json> --reference <DOI or https URL>
 *        --filed-at <registration date> [--registry "OSF Registries"] [--doc <prereg.md>] [--dry-run]
 *       Records a filing once the registry has accepted it: sets "status": "filed"
 *       and the registry record in the JSON, and replaces the status line of the
 *       preregistration document with « DÉPOSÉ LE … / FILED ON … ». Refuses a
 *       protocol that is not ready to file or already filed, a document that does
 *       not quote the hash, and a date in the future; checks that the hash is
 *       unchanged. Only the two filing fields of the JSON are rewritten.
 *       (`node --import tsx` rather than `npm run … --`: PowerShell can swallow the
 *       `--` that npm needs to pass arguments on.)
 *
 * © 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { freezeProtocol, analyseKinaestheticTest } from '../src/engine/fcs/kinaesthetic-withdrawal.js';
import { simulateProbeSession, probeObservation } from '../src/engine/body-probes.js';
import { exampleRobotInteroception } from '../src/engine/interoception.js';

const [cmd, ...rest] = process.argv.slice(2);
const BOOLEAN_FLAGS = new Set(['--strict', '--dry-run']);
const flag = (name) => { const i = rest.indexOf(name); return i >= 0 ? rest[i + 1] : undefined; };
const positional = rest.filter((a, i) => !a.startsWith('--') && !(i > 0 && rest[i - 1].startsWith('--') && !BOOLEAN_FLAGS.has(rest[i - 1])));
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const fail = (message, code = 1) => { console.error(message); process.exit(code); };
/** Status line of a preregistration document (first bold segment of its line). */
const STATUS_LINE = /^\*\*Statut \/ Status :[^*\n]*\*\*/m;
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
} else if (cmd === 'file') {
  const protoPath = positional[0];
  const reference = flag('--reference');
  const filedAtArg = flag('--filed-at');
  const registryName = flag('--registry') ?? 'OSF Registries';
  if (!protoPath || !reference || !filedAtArg) {
    fail('usage: kin.mjs file <protocol.json> --reference <DOI or https URL> --filed-at <registration date> [--registry "OSF Registries"] [--doc <prereg.md>] [--dry-run]', 2);
  }
  const text = readFileSync(protoPath, 'utf8');
  const p = JSON.parse(text);
  if (p.status === 'filed') {
    fail(`${p.id} is already recorded as filed (${p.registry?.name}, ${p.registry?.reference}, ${p.registry?.filedAt}); a filing record is never overwritten. Nothing written.`);
  }
  const before = freezeProtocol(p);
  if (!report(before)) fail(`\n${p.id} is not ready to file. Nothing written.`);

  const t = Date.parse(filedAtArg);
  if (!Number.isFinite(t)) fail(`--filed-at: "${filedAtArg}" is not a date. Give the registration date shown by the registry, e.g. 2026-10-23 or 2026-10-23T14:05:00+02:00. Nothing written.`);
  if (t > Date.now() + 60 * 60 * 1000) fail(`--filed-at: ${filedAtArg} is in the future. Nothing written.`);
  const ref = /^10\.\d{4,9}\/\S+$/i.test(reference) ? `https://doi.org/${reference}` : reference;
  if (!/^https:\/\/\S+$/.test(ref)) fail('--reference: give the registration DOI (e.g. 10.17605/OSF.IO/ABCDE) or its https URL. Nothing written.');
  if (/XXXX/i.test(ref)) fail(`--reference: "${reference}" still holds the placeholder; give the DOI shown by the registry. Nothing written.`);
  const registry = { name: registryName, reference: ref, filedAt: new Date(t).toISOString() };
  const filed = { ...p, status: 'filed', registry };
  const after = freezeProtocol(filed);
  if (after.sha256 !== before.sha256) fail('internal error: recording the filing changed the hash. Nothing written.');
  if (after.openParameters.length) fail(`incomplete registry record: ${after.openParameters.join(', ')}. Nothing written.`);

  // Rewrite only the two filing fields, so that the rest of the file stays byte-identical.
  const indentTail = (s, pad) => s.split('\n').map((l, i) => (i === 0 ? l : pad + l)).join('\n');
  let newText = text
    .replace(/"status":\s*"draft"/, '"status": "filed"')
    .replace(/"registry":\s*null/, () => `"registry": ${indentTail(JSON.stringify(registry, null, 2), '  ')}`);
  let parsed;
  try { parsed = JSON.parse(newText); } catch { parsed = null; }
  if (!parsed || parsed.status !== 'filed' || JSON.stringify(parsed.registry) !== JSON.stringify(registry) ||
      freezeProtocol(parsed).sha256 !== before.sha256) {
    newText = JSON.stringify(filed, null, 2) + '\n';
  }

  // The preregistration document: given, or the one document beside the protocols folder that links this file.
  let docPath = flag('--doc');
  if (!docPath) {
    const dir = dirname(dirname(resolve(protoPath)));
    const link = `protocols/${basename(protoPath)}`;
    const candidates = readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => join(dir, f))
      .filter((f) => { const d = readFileSync(f, 'utf8'); return d.includes(link) && STATUS_LINE.test(d); });
    if (candidates.length !== 1) fail(`cannot tell which document registers ${link} (${candidates.length} candidates): pass --doc. Nothing written.`, 2);
    docPath = candidates[0];
  }
  const doc = readFileSync(docPath, 'utf8');
  if (!doc.includes(before.sha256)) fail(`${docPath} does not quote the SHA-256 ${before.sha256}; the registered document must quote it. Nothing written.`);
  if (!STATUS_LINE.test(doc)) fail(`${docPath}: no status line « **Statut / Status : …** ». Nothing written.`);
  // The day as the registry shows it: taken literally when given as YYYY-MM-DD…, else in UTC.
  const day = /^\d{4}-\d{2}-\d{2}/.test(filedAtArg) ? filedAtArg.slice(0, 10) : registry.filedAt.slice(0, 10);
  const frDay = new Intl.DateTimeFormat('fr-CH', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${day}T12:00:00Z`));
  const statusLine = `**Statut / Status : DÉPOSÉ LE ${frDay} sur ${registryName} (${ref}) / FILED ON ${day} (${registryName}, ${ref}).**`;
  const newDoc = doc.replace(STATUS_LINE, () => statusLine);

  const rel = (f) => relative(process.cwd(), resolve(f)).split('\\').join('/');
  console.log(`\n${p.id} — filing record`);
  console.log(`  registry:  ${registryName}`);
  console.log(`  reference: ${ref}`);
  console.log(`  filedAt:   ${registry.filedAt}`);
  console.log(`  SHA-256 unchanged: ${after.sha256}`);
  console.log(`  status line of ${rel(docPath)}:\n    ${statusLine}`);
  if (rest.includes('--dry-run')) {
    console.log('\n--dry-run: nothing written.');
  } else {
    writeFileSync(protoPath, newText);
    writeFileSync(docPath, newDoc);
    console.log(`\nwritten: ${rel(protoPath)}, ${rel(docPath)}`);
    console.log('next:');
    console.log(`  git add ${rel(protoPath)} ${rel(docPath)}`);
    console.log(`  git commit -m "${p.id} filed on ${registryName} (${ref})"`);
    console.log('  git push');
  }
} else {
  console.error('usage: kin.mjs hash|dryrun-k0|k0-observe|analyse|file …');
  process.exit(2);
}
