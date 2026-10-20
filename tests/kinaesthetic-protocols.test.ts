/**
 * ASTRA × FCS — The completed protocols FCS-K0 (pilot) and FCS-K1 (confirmatory),
 * and the corrections made while completing them (v3.3.0-rc.5, 20 October 2026)
 * © 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

import {
  freezeProtocol, protocolHash, analyseKinaestheticTest, protocolTemplate, synthesizeObservations,
  type KinaestheticProtocol, type KinaestheticObservation,
} from '../src/engine/fcs/kinaesthetic-withdrawal.js';
import { rdmFromSimilarityJudgements, effectiveDimensionality } from '../src/engine/dimensionality.js';
import { validateConditionSpace, manipulateInteroceptive, type ConditionSpec } from '../src/engine/congruence.js';
import { exampleRobotInteroception } from '../src/engine/interoception.js';
import { simulateProbeSession, probeObservation, K0_PROBES } from '../src/engine/body-probes.js';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const K0 = JSON.parse(read('empirical/protocols/FCS-K0.protocol.json')) as KinaestheticProtocol;
const K1 = JSON.parse(read('empirical/protocols/FCS-K1.protocol.json')) as KinaestheticProtocol;

describe('FCS-K0 — pilot protocol, complete and ready to file', () => {
  const f = freezeProtocol(K0);
  it('has no open parameter, a valid condition space, disjoint channels and a passing ethics decision', () => {
    assert.deepEqual(f.openParameters, []);
    assert.deepEqual(f.conditionProblems, []);
    assert.deepEqual(f.channelOverlap, []);
    assert.equal(f.ethics.decision, 'PASS');
    assert.equal(K0.role, 'pilot');
    assert.equal(K0.unit, 'session');
    assert.equal(K0.minUnits, 10);
  });

  it('the SHA-256 quoted in the preregistration document is the hash of the protocol file', () => {
    const md = read('empirical/PREREG-KINAESTHETIC-K0-PILOT.md');
    const quoted = /SHA-256 du contenu scientifique.*?`([0-9a-f]{64})`/.exec(md)?.[1];
    assert.equal(quoted, f.sha256);
  });

  it('mirrors the K1 sensorimotor schedule (decision of 20 October 2026)', () => {
    const sm = (p: KinaestheticProtocol) => p.conditions.filter((c) => c.family === 'sensorimotor').map((c) => [c.level, c.sensorimotor]);
    assert.deepEqual(sm(K0), sm(K1));
    assert.deepEqual(K0.conditions.filter((c) => c.family === 'interoceptive').map((c) => c.level), [1 / 3, 2 / 3, 1]);
  });
});

describe('FCS-K1 — confirmatory protocol, decisions taken, two values pending', () => {
  const f = freezeProtocol(K1);
  it('only minUnits is open, and ethics blocks until the approval reference is entered', () => {
    assert.deepEqual(f.openParameters, ['minUnits']);
    assert.equal(f.ethics.decision, 'BLOCK');
    assert.deepEqual(f.conditionProblems, []);
    assert.deepEqual(f.channelOverlap, []);
  });

  it('carries the decisions: subject unit, α 0.05, SESOI 0.25, superiority, judged similarity', () => {
    assert.equal(K1.role, 'confirmatory');
    assert.equal(K1.unit, 'subject');
    assert.equal(K1.alpha, 0.05);
    assert.equal(K1.sesoi, 0.25);
    assert.equal(K1.effectCriterion, 'superiority');
    assert.equal(K1.dissimilarity, 'judged-similarity');
    assert.deepEqual(K1.conditions.filter((c) => c.family === 'sensorimotor').map((c) => (c.sensorimotor[0] as { ms: number }).ms), [100, 200, 300, 500]);
    assert.deepEqual(K1.conditions.filter((c) => c.family === 'interoceptive').map((c) => c.interoceptive[0].kind), ['phase-shift', 'phase-shift', 'decouple']);
  });

  it('becomes ready to file once the pilot sets n and the approval reference is entered', () => {
    const done = freezeProtocol({ ...K1, minUnits: 40, ethicsReference: 'CCER 2027-00000 (example)' });
    assert.deepEqual(done.openParameters, []);
    assert.equal(done.ethics.decision, 'WARN');
  });

  it('every condition of the protocol is described in the preregistration document', () => {
    const md = read('empirical/PREREG-KINAESTHETIC-K1.md');
    for (const c of K1.conditions) assert.ok(md.includes(`\`${c.id}\``), c.id);
  });
});

describe('Preregistration check: K0 complete, K1 three values pending', () => {
  it('prereg:check counts 0 markers in K0 and exactly 3 EN ATTENTE in K1', () => {
    const r = spawnSync(process.execPath, [new URL('../scripts/prereg-check.mjs', import.meta.url).pathname, '--report'], { encoding: 'utf8' });
    assert.match(r.stdout, /PREREG-KINAESTHETIC-K0-PILOT\.md — 0 open marker\(s\), complete, unfiled/);
    assert.match(r.stdout, /PREREG-KINAESTHETIC-K1\.md — 3 open marker\(s\), unfiled draft/);
  });
});

describe('Corrections made while completing the protocols', () => {
  it('the hash excludes filing metadata: filing a protocol does not change its registered hash', () => {
    const filedK0: KinaestheticProtocol = { ...K0, status: 'filed', registry: { name: 'OSF Registries', reference: 'https://osf.io/xxxxx', filedAt: '2026-10-21T09:00:00Z' } };
    assert.equal(protocolHash(filedK0), protocolHash(K0));
    assert.notEqual(protocolHash({ ...K0, sesoi: 0.3 }), protocolHash(K0));
  });

  it('a pilot protocol never sets a withdrawal outcome, even filed and with reported data', () => {
    const p: KinaestheticProtocol = { ...protocolTemplate(), role: 'pilot', status: 'filed', unit: 'session', minUnits: 6, alpha: 0.05, sesoi: 0.15,
      effectCriterion: 'superiority', registry: { name: 'OSF', reference: 'x', filedAt: '2026-11-01T00:00:00Z' },
      sourceSignals: { somatosensory: ['a'], interoceptive: ['b'] } };
    const obs = synthesizeObservations(p, { plant: 'interoceptive-only', units: 8, items: 12, features: 20, effect: 0.9, noise: 0.3, seed: 1, collectedAt: '2026-12-01T00:00:00Z' })
      .map((o) => ({ ...o, origin: 'reported' as const }));
    const a = analyseKinaestheticTest(freezeProtocol(p), obs);
    assert.equal(a.pattern, 'interoceptive-only');
    assert.equal(a.confirmatory, false);
    assert.ok(a.confirmatoryRefusals.some((r) => /pilot protocol/.test(r)));
    assert.equal(a.withdrawalOutcome.dimensionalityFromInteroception, null);
  });

  it('a non-monotone response is not read as an absence (monotonicity guard)', () => {
    // Rectangle (±1, ±b): classical-MDS PR = (1 + b²)² / (1 + b⁴). Inverted U in the sensorimotor family.
    const rect = (b2: number) => {
      const P = [[1, Math.sqrt(b2)], [1, -Math.sqrt(b2)], [-1, Math.sqrt(b2)], [-1, -Math.sqrt(b2)]];
      return P.map((a) => P.map((c) => Math.hypot(a[0] - c[0], a[1] - c[1])));
    };
    const p: KinaestheticProtocol = { ...protocolTemplate(), conditions: K0.conditions, unit: 'session', minUnits: 6, alpha: 0.05, sesoi: 0.25,
      effectCriterion: 'superiority', dissimilarity: 'euclidean', sourceSignals: { somatosensory: ['a'], interoceptive: ['b'] } };
    const smB2: Record<string, number> = { 'sm-delay-100': 0.3, 'sm-delay-200': 0.6, 'sm-delay-300': 0.3, 'sm-delay-500': 0 };
    const obs: KinaestheticObservation[] = [];
    for (let u = 0; u < 10; u++) {
      for (const c of K0.conditions) {
        const b2 = (smB2[c.id] ?? 0) + 0.01 * ((u * 7 + c.id.length) % 5);
        obs.push({ unitId: `u${u}`, conditionId: c.id, collectedAt: '2026-12-01T00:00:00Z', origin: 'simulated', rdm: rect(b2),
          manipulationCheck: { sensorimotorError: 0.03 + (c.family === 'sensorimotor' ? 0.2 * c.level : 0) + 0.001 * u,
            interoceptiveError: 0.03 + (c.family === 'interoceptive' ? 0.2 * c.level : 0) + 0.001 * u } });
      }
    }
    assert.ok(Math.abs(effectiveDimensionality(rect(0.6)).participationRatio - 2.56 / 1.36) < 1e-9);
    const a = analyseKinaestheticTest(freezeProtocol(p), obs);
    const sm = a.families.sensorimotor;
    assert.ok(sm.effect!.lower > -0.25 && sm.effect!.upper < 0.25, 'the slope alone would read as equivalent');
    assert.equal(sm.monotonicityGuard, 'failed');
    assert.equal(sm.classification, 'inconclusive');
    assert.equal(a.families.interoceptive.monotonicityGuard, 'passed');
    assert.equal(a.pattern, 'undetermined');
    assert.ok(a.undeterminedReasons.some((r) => /non-monotone response cannot be read as an absence/.test(r)));
  });
});

describe('Judged similarity (FCS-K1) and cardio-visual phase shift', () => {
  it('builds 1 − similarity from every pair judged once, and refuses missing, repeated or out-of-range judgements', () => {
    const J = [{ i: 0, j: 1, similarity: 0.9 }, { i: 0, j: 2, similarity: 0.2 }, { i: 1, j: 2, similarity: 0.3 }];
    const D = rdmFromSimilarityJudgements(3, J);
    assert.ok(Math.abs(D[0][1] - 0.1) < 1e-12 && Math.abs(D[2][1] - 0.7) < 1e-12 && D[2][2] === 0);
    assert.throws(() => rdmFromSimilarityJudgements(3, J.slice(0, 2)), /not judged/);
    assert.throws(() => rdmFromSimilarityJudgements(3, [...J, { i: 1, j: 0, similarity: 0.5 }]), /judged twice/);
    assert.throws(() => rdmFromSimilarityJudgements(3, [{ i: 0, j: 1, similarity: 1.2 }]), RangeError);
  });

  it('a judged-similarity protocol takes matrices, not patterns', () => {
    const p: KinaestheticProtocol = { ...K1, minUnits: 2, ethicsReference: 'x' };
    const obs: KinaestheticObservation[] = K1.conditions.map((c) => ({ unitId: 'u1', conditionId: c.id, collectedAt: '2026-12-01T00:00:00Z',
      origin: 'reported', patterns: [[1, 2, 3], [3, 1, 2], [2, 3, 1]] }));
    const a = analyseKinaestheticTest(freezeProtocol(p), obs);
    assert.ok(a.families.sensorimotor.excludedUnits.some((x) => /judged-similarity protocol takes an rdm/.test(x.reason)));
  });

  it('phase shift is validated, and left to the apparatus on homeostatic streams', () => {
    const bad: ConditionSpec[] = [...K1.conditions, { id: 'cv-bad', family: 'interoceptive', level: 0.9, sensorimotor: [], interoceptive: [{ kind: 'phase-shift', fractionOfCycle: 1.2 }] }];
    assert.ok(validateConditionSpace(bad).some((m) => /fractionOfCycle/.test(m)));
    const rs = [{ t: 0, clockDomain: 'c', origin: 'simulated' as const, values: { actuatorTempC: 40 } }];
    const r = manipulateInteroceptive(rs, [{ kind: 'phase-shift', fractionOfCycle: 0.25 }], exampleRobotInteroception());
    assert.equal(r.delivered[0].values.actuatorTempC, 40);
    assert.ok(r.notes.some((n) => /executed by the stimulation apparatus/.test(n)));
  });
});

describe('K0 probe pipeline (both channels in the responses)', () => {
  const s = simulateProbeSession({ seed: 3, calibrationSteps: 600, repetitions: 1 });
  const specs = exampleRobotInteroception();
  const cond = (id: string) => K0.conditions.find((c) => c.id === id)!;
  const meta = { unitId: 's3', collectedAt: '2026-12-01T00:00:00Z' };
  const base = probeObservation(s, cond('congruent'), specs, meta);

  it('one standardised pattern per probe, with somatosensory and interoceptive features', () => {
    assert.equal(base.patterns!.length, K0_PROBES.length);
    const nf = base.patterns![0].length;
    for (let f = 0; f < nf; f++) {
      const col = base.patterns!.map((r) => r[f]);
      assert.ok(Math.abs(col.reduce((a, b) => a + b, 0) / col.length) < 1e-9, 'centred');
    }
    assert.equal(base.origin, 'simulated');
    assert.ok(base.manipulationCheck);
  });

  it('an interoceptive manipulation changes the patterns (no absence by construction)', () => {
    const dec = probeObservation(s, cond('io-decouple'), specs, meta);
    assert.notDeepEqual(dec.patterns, base.patterns);
    assert.ok(dec.manipulationCheck!.interoceptiveError > base.manipulationCheck!.interoceptiveError);
  });

  it('a sensorimotor delay changes the patterns and raises the sensorimotor error', () => {
    const d = probeObservation(s, cond('sm-delay-300'), specs, meta);
    assert.notDeepEqual(d.patterns, base.patterns);
    assert.ok(d.manipulationCheck!.sensorimotorError > base.manipulationCheck!.sensorimotorError);
  });
});
