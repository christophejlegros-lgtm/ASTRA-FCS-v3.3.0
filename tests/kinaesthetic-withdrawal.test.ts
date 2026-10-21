/**
 * ASTRA × FCS — Efference–reafference loop, congruence manipulations and the
 * withdrawal test of the kinaesthetic thesis (v3.3.0-rc.5)
 * © 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

import {
  rdmFromPatterns, effectiveDimensionality, symmetricEigenvalues, validateRdm,
  studentTQuantile, studentTCdf, tInterval, olsSlope,
} from '../src/engine/dimensionality.js';
import {
  manipulateSomatosensory, manipulateInteroceptive, validateConditionSpace, localRng, type ConditionSpec,
} from '../src/engine/congruence.js';
import { SomatosensoryEncoder, afferentVector, type SomatosensoryReading } from '../src/engine/somatosensory.js';
import { exampleRobotInteroception } from '../src/engine/interoception.js';
import {
  ReafferenceComparator, assessClosure, pairStreams, estimateLatency, type EfferenceCopy, type ReafferenceSample,
} from '../src/engine/reafference.js';
import { simulateFinger } from '../src/engine/body-sim.js';
import { runConditions } from '../src/engine/body-loop.js';
import {
  protocolTemplate, freezeProtocol, protocolHash, analyseKinaestheticTest, synthesizeObservations, checkDeliveryEthics, classifyEffect,
  type KinaestheticProtocol, type KinaestheticObservation,
} from '../src/engine/fcs/kinaesthetic-withdrawal.js';
import { evaluateWithdrawal } from '../src/engine/fcs/withdrawal.js';
import { random, reseed } from '../src/utils/rng.js';
import { screen } from '../src/lint-guard.js';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createAstraServer } from '../src/server.js';
import { stopSimulation } from '../src/engine/simulation.js';

const kin = (e: ReturnType<typeof evaluateWithdrawal>) => e.evaluations.find((x) => x.thesis === 'kinaesthetic')!;

// ── Effective dimensionality ──────────────────────────────────────

describe('Effective dimensionality (classical MDS participation ratio)', () => {
  const dist = (P: number[][]) => P.map((a) => P.map((b) => Math.hypot(...a.map((v, k) => v - b[k]))));

  it('collinear conditions give PR = 1; a square gives 2; a regular simplex of k+1 points gives k', () => {
    assert.ok(Math.abs(effectiveDimensionality(dist([[0, 0], [1, 0], [2, 0], [5, 0]])).participationRatio - 1) < 1e-9);
    assert.ok(Math.abs(effectiveDimensionality(dist([[0, 0], [1, 0], [0, 1], [1, 1]])).participationRatio - 2) < 1e-9);
    const simplex = Array.from({ length: 5 }, (_, i) => Array.from({ length: 5 }, (_, k) => (i === k ? 1 : 0)));
    assert.ok(Math.abs(effectiveDimensionality(dist(simplex)).participationRatio - 4) < 1e-9);
  });

  it('Jacobi eigenvalues of a known symmetric matrix', () => {
    const e = symmetricEigenvalues([[2, 1, 0], [1, 2, 0], [0, 0, 5]]);
    assert.deepEqual(e.map((v) => +v.toFixed(10)), [5, 3, 1]);
  });

  it('reports the non-Euclidean share of a correlation-distance matrix instead of hiding it', () => {
    const P = [[1, 2, 3, 4], [4, 3, 2, 1], [1, 3, 2, 4], [2, 1, 4, 3], [3, 4, 1, 2]];
    const r = effectiveDimensionality(rdmFromPatterns(P, 'correlation'));
    assert.ok(r.negativeMassFraction >= 0 && r.negativeMassFraction < 1);
    assert.equal(r.method, 'classical-MDS participation ratio');
  });

  it('refuses invalid matrices and constant patterns', () => {
    assert.ok(validateRdm([[0, 1], [1, 0]]).length > 0);
    assert.ok(validateRdm([[0, 1, 2], [1, 0, 1], [2, 3, 0]]).some((p) => /symmetric/.test(p)));
    assert.throws(() => rdmFromPatterns([[1, 1, 1], [1, 2, 3], [3, 2, 1]], 'correlation'), RangeError);
    assert.throws(() => effectiveDimensionality([[0, 0, 0], [0, 0, 0], [0, 0, 0]]), RangeError);
  });
});

describe('Student t and intervals (no statistics dependency)', () => {
  it('quantiles match reference values (R: qt)', () => {
    assert.ok(Math.abs(studentTQuantile(0.975, 10) - 2.228139) < 1e-5);
    assert.ok(Math.abs(studentTQuantile(0.95, 4) - 2.131847) < 1e-5);
    assert.ok(Math.abs(studentTQuantile(0.95, 29) - 1.699127) < 1e-5);
    assert.ok(Math.abs(studentTCdf(0, 7) - 0.5) < 1e-12);
  });

  it('the (1 − 2α) interval and the OLS slope', () => {
    const ci = tInterval([1, 2, 3, 4, 5], 0.05);
    assert.equal(ci.mean, 3);
    assert.ok(Math.abs(ci.upper - ci.mean - studentTQuantile(0.95, 4) * Math.sqrt(2.5) / Math.sqrt(5)) < 1e-9);
    assert.equal(ci.level, 0.9);
    assert.equal(olsSlope([0, 1, 2], [1, 3, 5]), 2);
    assert.equal(olsSlope([1, 1], [0, 1]), null);
  });
});

// ── Congruence manipulations ──────────────────────────────────────

const reading = (t: number, angle: number, stretch = [0.1 * angle]): SomatosensoryReading => ({
  t, clockDomain: 'c', origin: 'simulated', joints: [{ id: 'j', angleRad: angle, velocityRadS: 1 }], stretch,
  taxels: { rows: 1, cols: 3, normalN: [1, 2, 3] },
});

describe('Congruence manipulations', () => {
  it('a condition belongs to one family; the space needs a baseline and both families', () => {
    const ok: ConditionSpec[] = protocolTemplate().conditions;
    assert.deepEqual(validateConditionSpace(ok), []);
    const mixed: ConditionSpec[] = [...ok, { id: 'x', family: 'sensorimotor', level: 0.5, sensorimotor: [{ kind: 'delay', ms: 10 }], interoceptive: [{ kind: 'gain', factor: 2 }] }];
    assert.ok(validateConditionSpace(mixed).some((p) => /carries no interoceptive manipulation/.test(p)));
    assert.ok(validateConditionSpace(ok.filter((c) => c.family !== 'baseline')).some((p) => /baseline/.test(p)));
    assert.ok(validateConditionSpace(ok.filter((c) => c.family !== 'interoceptive')).some((p) => /both families/.test(p)));
  });

  it('delay moves the whole reading on the hardware clock and records the acquisition time', () => {
    const { delivered } = manipulateSomatosensory([reading(0, 0), reading(10, 0.5)], [{ kind: 'delay', ms: 40 }]);
    assert.deepEqual(delivered.map((r) => [r.t, r.generatedAt]), [[40, 0], [50, 10]]);
  });

  it('gain and sign flip act on joint motion and skin stretch around the first reading, not on forces', () => {
    const src = [reading(0, 0.2), reading(10, 0.6)];
    const g = manipulateSomatosensory(src, [{ kind: 'gain', factor: 2 }]).delivered[1];
    assert.ok(Math.abs(g.joints![0].angleRad - 1.0) < 1e-12);
    assert.equal(g.joints![0].velocityRadS, 2);
    assert.ok(Math.abs(g.stretch![0] - 0.1) < 1e-12);
    assert.deepEqual(g.taxels!.normalN, [1, 2, 3]);
    const f = manipulateSomatosensory(src, [{ kind: 'sign-flip' }]);
    assert.ok(Math.abs(f.delivered[1].joints![0].angleRad - -0.2) < 1e-12);
    assert.ok(f.notes.some((n) => /not scaled/.test(n)));
    assert.equal(src[1].joints![0].angleRad, 0.6, 'the source stream is not mutated');
  });

  it('spatial remap permutes taxels; jitter is reproducible from its seed', () => {
    const r = manipulateSomatosensory([reading(0, 0)], [{ kind: 'spatial-remap', permutation: [2, 0, 1] }]).delivered[0];
    assert.deepEqual(r.taxels!.normalN, [3, 1, 2]);
    const a = manipulateSomatosensory([reading(0, 0), reading(10, 1)], [{ kind: 'jitter', sdMs: 20, seed: 9 }]).delivered.map((x) => x.t);
    const b = manipulateSomatosensory([reading(0, 0), reading(10, 1)], [{ kind: 'jitter', sdMs: 20, seed: 9 }]).delivered.map((x) => x.t);
    assert.deepEqual(a, b);
    assert.throws(() => manipulateSomatosensory([reading(0, 0)], [{ kind: 'spatial-remap', permutation: [0, 0, 1] }]), RangeError);
  });

  it('interoceptive gain acts around the setpoint; decoupling keeps the values but breaks the correspondence', () => {
    const specs = exampleRobotInteroception();
    const rs = Array.from({ length: 6 }, (_, k) => ({ t: k * 100, clockDomain: 'c', origin: 'simulated' as const, values: { actuatorTempC: 35 + k } }));
    const g = manipulateInteroceptive(rs, [{ kind: 'gain', factor: 2 }], specs).delivered;
    assert.deepEqual(g.map((r) => r.values.actuatorTempC), [35, 37, 39, 41, 43, 45]);
    const d = manipulateInteroceptive(rs, [{ kind: 'decouple', seed: 4 }], specs).delivered;
    assert.deepEqual(d.map((r) => r.values.actuatorTempC).sort((x, y) => x - y), [35, 36, 37, 38, 39, 40]);
    assert.notDeepEqual(d.map((r) => r.values.actuatorTempC), [35, 36, 37, 38, 39, 40]);
    const o = manipulateInteroceptive(rs, [{ kind: 'offset', deltas: { nope: 1 } }], specs);
    assert.ok(o.notes.some((n) => /not a declared variable/.test(n)));
  });

  it('randomised manipulations never advance the global random stream', () => {
    reseed(123); const expected = [random(), random()];
    reseed(123);
    manipulateSomatosensory([reading(0, 0), reading(10, 1)], [{ kind: 'jitter', sdMs: 5, seed: 1 }]);
    manipulateInteroceptive([{ t: 0, clockDomain: 'c', origin: 'simulated', values: { actuatorTempC: 30 } }], [{ kind: 'decouple', seed: 2 }], exampleRobotInteroception());
    simulateFinger(200, { seed: 3 });
    assert.deepEqual([random(), random()], expected);
    assert.notEqual(localRng(1)(), localRng(2)());
  });
});

// ── Comparator and closure ────────────────────────────────────────

describe('Efference–reafference comparator', () => {
  const eff = (t: number, u: number, d = 'c'): EfferenceCopy => ({ t, clockDomain: d, origin: 'simulated', command: [u] });
  const ret = (t: number, y: number, d = 'c'): ReafferenceSample => ({ t, clockDomain: d, features: [y] });

  it('pairs each command with the latest return held at t + L̂; counts cross-domain and reused returns', () => {
    const p = pairStreams([eff(0, 1), eff(10, 1), eff(20, 1)], [ret(8, 1), ret(18, 1), ret(5, 1, 'other')], 8);
    assert.equal(p.pairs.length, 3);
    assert.deepEqual(p.pairs.map((x) => x.r.t), [8, 18, 18]);
    assert.equal(p.reused, 1);
    assert.equal(p.crossDomain, 1);
    assert.equal(estimateLatency([eff(0, 1), eff(10, 1)], [ret(8, 1), ret(18, 1)]), 8);
  });

  it('refuses to compare across clock domains', () => {
    assert.throws(() => new ReafferenceComparator().step(eff(0, 1), ret(5, 1, 'other')), RangeError);
  });

  const session = simulateFinger(1500, { seed: 7 });
  const enc = new SomatosensoryEncoder();
  const reaf = session.somatosensory.map((r) => ({ t: r.t, clockDomain: r.clockDomain, features: afferentVector(enc.encode(r)) }));

  it('the simulated finger closes the loop operationally (M3, distinctions a–b)', () => {
    const a = assessClosure(session.efference, reaf);
    assert.equal(a.closed, true, a.failures.join('; '));
    assert.ok(a.commandInformativeness! > a.surrogateInformativeness! + 0.05);
    assert.equal(a.medianLatencyMs, 8);
    assert.match(a.scopeNote, /establishes nothing about distinction \(c\)/);
  });

  it('with commands decorrelated from the returns, the loop is not closed', () => {
    const shuffled = session.efference.map((e, i) => ({ ...e, command: session.efference[(i * 7919) % session.efference.length].command }));
    const a = assessClosure(shuffled, reaf);
    assert.equal(a.closed, false);
    assert.ok(a.failures.some((f) => /does not depend on the command/.test(f)));
  });

  it('with the latency calibrated and the model frozen, a reafference delay raises the comparator error', () => {
    const half = Math.floor(reaf.length / 2);
    const calE = session.efference.slice(0, half), testE = session.efference.slice(half);
    const run = (delay: number) => {
      const cmp = new ReafferenceComparator({ expectedLatencyMs: estimateLatency(calE, reaf.slice(0, half))! });
      cmp.run(calE, reaf.slice(0, half));
      cmp.setLearning(false);
      const delayed = reaf.slice(half).map((r) => ({ ...r, t: r.t + delay, generatedAt: r.t }));
      const steps = cmp.run(testE, delayed).steps;
      return steps.reduce((s, x) => s + x.rmsError, 0) / steps.length;
    };
    const e0 = run(0), e1 = run(100);
    assert.ok(e1 > e0 * 1.03, `${e0} → ${e1}`);
  });
});

// ── Manipulation check on the simulated body ──────────────────────

describe('Manipulation check (calibrate, freeze, manipulate) on the simulated finger', () => {
  const s = simulateFinger(1500, { seed: 11 });
  const specs = exampleRobotInteroception();
  const conds: ConditionSpec[] = [
    { id: 'base', family: 'baseline', level: 0, sensorimotor: [], interoceptive: [] },
    { id: 'sm50', family: 'sensorimotor', level: 0.5, sensorimotor: [{ kind: 'delay', ms: 50 }], interoceptive: [] },
    { id: 'sm200', family: 'sensorimotor', level: 1, sensorimotor: [{ kind: 'delay', ms: 200 }], interoceptive: [] },
    { id: 'ioGain', family: 'interoceptive', level: 0.5, sensorimotor: [], interoceptive: [{ kind: 'gain', factor: 3 }] },
    { id: 'ioDec', family: 'interoceptive', level: 1, sensorimotor: [], interoceptive: [{ kind: 'decouple', seed: 3 }] },
    { id: 'ioDelay', family: 'interoceptive', level: 1, sensorimotor: [], interoceptive: [{ kind: 'delay', ms: 1000 }] },
  ];
  const runs = Object.fromEntries(runConditions(s, conds, specs).map((r) => [r.conditionId, r]));

  it('sensorimotor delays raise the sensorimotor error, graded, and leave the interoceptive error unchanged', () => {
    assert.ok(runs.sm50.sensorimotorError > runs.base.sensorimotorError);
    assert.ok(runs.sm200.sensorimotorError > runs.sm50.sensorimotorError);
    assert.ok(Math.abs(runs.sm200.interoceptiveError - runs.base.interoceptiveError) < 1e-12);
  });

  it('interoceptive gain and decoupling raise the interoceptive error and leave the sensorimotor error unchanged', () => {
    for (const k of ['ioGain', 'ioDec']) {
      assert.ok(runs[k].interoceptiveError > 2 * runs.base.interoceptiveError, k);
      assert.ok(Math.abs(runs[k].sensorimotorError - runs.base.sensorimotorError) < 1e-12, k);
    }
  });

  it('a pure interoceptive DELAY is nearly invisible to a homeostatic predictor (no discrete command): the check exposes it', () => {
    // Document II §4.2: autonomous regulation has "ni commande discrète ni réafférence spécifique".
    // A delayed but self-consistent interoceptive series is still predictable from its own past.
    assert.ok(runs.ioDelay.interoceptiveError < 1.5 * runs.base.interoceptiveError,
      `${runs.base.interoceptiveError} vs ${runs.ioDelay.interoceptiveError}`);
  });

  it('carries the origin through and never upgrades it', () => {
    assert.ok(Object.values(runs).every((r) => r.origin === 'simulated'));
  });
});

// ── Protocol and analysis ─────────────────────────────────────────

const filed = (over: Partial<KinaestheticProtocol> = {}): KinaestheticProtocol => ({
  ...protocolTemplate(), status: 'filed', registry: { name: 'OSF Registries', reference: 'osf.io/example', filedAt: '2026-11-01T00:00:00Z' },
  unit: 'organoid', minUnits: 6, alpha: 0.05, sesoi: 0.15, effectCriterion: 'superiority',
  sourceSignals: { somatosensory: ['encoder'], interoceptive: ['thermistor'] }, ...over,
});
const synth = (p: KinaestheticProtocol, plant: Parameters<typeof synthesizeObservations>[1]['plant'], extra: Partial<Parameters<typeof synthesizeObservations>[1]> = {}) =>
  synthesizeObservations(p, { plant, units: 8, items: 12, features: 20, effect: plant === 'neither' ? 0 : 0.9, noise: 0.3, seed: 1, collectedAt: '2026-12-01T00:00:00Z', ...extra });
const asReported = (o: KinaestheticObservation[]) => o.map((x) => ({ ...x, origin: 'reported' as const }));

describe('Protocol: freeze before the data', () => {
  it('the template leaves every author decision open and is not ready to file', () => {
    const f = freezeProtocol(protocolTemplate());
    assert.deepEqual(f.openParameters, ['unit', 'minUnits', 'alpha', 'sesoi', 'effectCriterion']);
    assert.equal(f.sha256.length, 64);
  });

  it('the hash is canonical (key order does not matter) and changes with any parameter', () => {
    const p = filed();
    const reordered = Object.fromEntries(Object.entries(p).reverse()) as unknown as KinaestheticProtocol;
    assert.equal(protocolHash(p), protocolHash(reordered));
    assert.notEqual(protocolHash(p), protocolHash({ ...p, sesoi: 0.2 }));
  });

  it('ethics: living cultures and human subjects need an approval reference', () => {
    assert.equal(checkDeliveryEthics({ deliveryTarget: 'silicon', ethicsReference: null }).decision, 'PASS');
    assert.equal(checkDeliveryEthics({ deliveryTarget: 'living-culture', ethicsReference: null }).decision, 'BLOCK');
    const w = checkDeliveryEthics({ deliveryTarget: 'living-culture', ethicsReference: 'CER-GE 2026-123' });
    assert.equal(w.decision, 'WARN');
    assert.ok(w.reasons.some((r) => /welfare thresholds/.test(r)));
  });
});

describe('Analysis: synthetic controls recover what was planted', () => {
  for (const plant of ['interoceptive-only', 'sensorimotor-only', 'both', 'neither'] as const) {
    it(`planted ${plant} → recovered ${plant}`, () => {
      for (const seed of [1, 2, 3]) {
        const a = analyseKinaestheticTest(freezeProtocol(filed()), synth(filed(), plant, { seed }));
        assert.equal(a.pattern, plant, `seed ${seed}: ${a.undeterminedReasons.join('; ')}`);
      }
    });
  }

  it('a failed manipulation check leaves the verdict undetermined', () => {
    const a = analyseKinaestheticTest(freezeProtocol(filed()), asReported(synth(filed(), 'interoceptive-only', { failCheck: 'sensorimotor' })));
    assert.equal(a.pattern, 'undetermined');
    assert.ok(a.undeterminedReasons.some((r) => /manipulation check failed/.test(r)));
    assert.equal(a.withdrawalOutcome.dimensionalityFromInteroception, null);
  });

  it('without a SESOI, absence cannot be shown and nothing is decided (regression: a negligible effect once read as "both")', () => {
    const p = filed({ sesoi: null });
    for (const seed of [1, 2, 3]) {
      const a = analyseKinaestheticTest(freezeProtocol(p), asReported(synth(p, 'interoceptive-only', { seed })));
      assert.equal(a.pattern, 'undetermined', `seed ${seed}`);
      assert.ok(a.undeterminedReasons.some((r) => /no SESOI/.test(r)));
      assert.equal(a.withdrawalOutcome.dimensionalityFromInteroception, null);
    }
  });

  it('effect criterion: equivalence first, then superiority (> 0) or minimum effect (> SESOI)', () => {
    const ci = (lower: number, upper: number) => ({ n: 8, mean: (lower + upper) / 2, sd: 1, lower, upper, level: 0.9 });
    assert.equal(classifyEffect(ci(0.01, 0.1), 0.15, 'superiority'), 'equivalent');
    assert.equal(classifyEffect(ci(0.05, 0.4), 0.15, 'superiority'), 'increase');
    assert.equal(classifyEffect(ci(0.05, 0.4), 0.15, 'minimum-effect'), 'inconclusive');
    assert.equal(classifyEffect(ci(0.2, 0.4), 0.15, 'minimum-effect'), 'increase');
    assert.equal(classifyEffect(ci(-0.4, -0.05), 0.15, 'superiority'), 'decrease');
    assert.equal(classifyEffect(ci(-0.1, 0.3), 0.15, 'superiority'), 'inconclusive');
  });

  it('too few units is reported, not analysed', () => {
    const a = analyseKinaestheticTest(freezeProtocol(filed({ minUnits: 20 })), asReported(synth(filed(), 'both')));
    assert.equal(a.families.sensorimotor.classification, 'insufficient-units');
    assert.equal(a.pattern, 'undetermined');
  });

  it('a decrease of dimensionality is an anomaly sent to rank 1, not a verdict', () => {
    // Swap the congruent data with the strongest sensorimotor rupture: dimensionality now falls with the level.
    const obs = asReported(synth(filed(), 'sensorimotor-only')).map((o) =>
      o.conditionId === 'congruent' ? { ...o, conditionId: 'sm-delay-3' } : o.conditionId === 'sm-delay-3' ? { ...o, conditionId: 'congruent' } : o);
    const a = analyseKinaestheticTest(freezeProtocol(filed()), obs);
    assert.equal(a.families.sensorimotor.classification, 'decrease');
    assert.equal(a.pattern, 'undetermined');
    assert.ok(a.undeterminedReasons.some((r) => /rank 1/.test(r)));
    assert.equal(a.withdrawalOutcome.dimensionalityFromInteroception, null);
  });
});

describe('Analysis: confirmatory gates', () => {
  it('simulated observations never set a withdrawal outcome, even under a filed protocol', () => {
    const a = analyseKinaestheticTest(freezeProtocol(filed()), synth(filed(), 'interoceptive-only'));
    assert.equal(a.pattern, 'interoceptive-only');
    assert.equal(a.confirmatory, false);
    assert.ok(a.confirmatoryRefusals.some((r) => /test the pipeline, not the thesis/.test(r)));
    assert.equal(a.withdrawalOutcome.dimensionalityFromInteroception, null);
    assert.equal(a.kinaestheticStanding.standing, 'undetermined');
  });

  it('reported observations under a filed, complete, unchanged protocol set the outcome', () => {
    const a = analyseKinaestheticTest(freezeProtocol(filed()), asReported(synth(filed(), 'interoceptive-only')));
    assert.equal(a.confirmatory, true, a.confirmatoryRefusals.join('; '));
    assert.deepEqual(a.withdrawalOutcome, { dimensionalityFromInteroception: true, kinaestheticPattern: 'interoceptive-only' });
    assert.equal(a.kinaestheticStanding.standing, 'withdrawn');
    const b = analyseKinaestheticTest(freezeProtocol(filed()), asReported(synth(filed(), 'sensorimotor-only')));
    assert.equal(b.kinaestheticStanding.standing, 'standing');
    assert.match(b.kinaestheticStanding.reasonEn, /first closure stays kinaesthetic/);
  });

  it('refuses a draft, a modified protocol, data collected before filing, overlapping channels and a blocking ethics declaration', () => {
    const obs = asReported(synth(filed(), 'interoceptive-only'));
    const draft = analyseKinaestheticTest(freezeProtocol({ ...filed(), status: 'draft' }), obs);
    assert.ok(draft.confirmatoryRefusals.some((r) => /not filed/.test(r)));
    const fz = freezeProtocol(filed());
    fz.protocol = { ...fz.protocol, sesoi: 0.5 };
    assert.ok(analyseKinaestheticTest(fz, obs).confirmatoryRefusals.some((r) => /hash mismatch/.test(r)));
    const early = analyseKinaestheticTest(freezeProtocol(filed()), obs.map((o) => ({ ...o, collectedAt: '2026-10-01T00:00:00Z' })));
    assert.ok(early.confirmatoryRefusals.some((r) => /before or at filing/.test(r)));
    const overlap = analyseKinaestheticTest(freezeProtocol(filed({ sourceSignals: { somatosensory: ['motor-current'], interoceptive: ['motor-current'] } })), obs);
    assert.ok(overlap.confirmatoryRefusals.some((r) => /claimed by both channels/.test(r)));
    const blocked = analyseKinaestheticTest(freezeProtocol(filed({ deliveryTarget: 'living-culture', ethicsReference: null })), obs);
    assert.ok(blocked.confirmatoryRefusals.some((r) => /ethics/.test(r)));
    for (const a of [draft, early, overlap, blocked]) assert.equal(a.withdrawalOutcome.dimensionalityFromInteroception, null);
  });

  it('every emitted analysis clears both linters', () => {
    for (const plant of ['interoceptive-only', 'neither'] as const) {
      const a = analyseKinaestheticTest(freezeProtocol(filed()), asReported(synth(filed(), plant)));
      const v = screen(JSON.stringify(a));
      assert.equal(v.admissible, true, JSON.stringify(v));
    }
    assert.equal(screen(JSON.stringify(freezeProtocol(protocolTemplate()))).admissible, true);
  });
});

describe('withdrawal.ts reads the pattern (backward compatible)', () => {
  it('the four patterns and their standings', () => {
    assert.equal(kin(evaluateWithdrawal({ kinaestheticPattern: 'interoceptive-only' })).standing, 'withdrawn');
    for (const p of ['sensorimotor-only', 'both', 'neither'] as const) assert.equal(kin(evaluateWithdrawal({ kinaestheticPattern: p })).standing, 'standing');
    assert.match(kin(evaluateWithdrawal({ kinaestheticPattern: 'neither' })).reasonEn, /rank 1/);
    assert.match(kin(evaluateWithdrawal({ kinaestheticPattern: 'both' })).reasonEn, /does not discriminate/);
  });

  it('inconsistent inputs are not used', () => {
    const k = kin(evaluateWithdrawal({ kinaestheticPattern: 'interoceptive-only', dimensionalityFromInteroception: false }));
    assert.equal(k.standing, 'undetermined');
    assert.match(k.reasonEn, /Inconsistent/);
  });

  it('the boolean alone behaves as before', () => {
    assert.equal(kin(evaluateWithdrawal({ dimensionalityFromInteroception: true })).standing, 'withdrawn');
    assert.equal(kin(evaluateWithdrawal({ dimensionalityFromInteroception: false })).standing, 'standing');
    assert.equal(kin(evaluateWithdrawal({})).standing, 'undetermined');
  });
});

// ── MCP surface ───────────────────────────────────────────────────

describe('MCP tools of the body channels and the withdrawal test', () => {
  let client: Client;
  before(async () => {
    const server = createAstraServer();
    client = new Client({ name: 'kin-test', version: '1.0.0' });
    const [a, b] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(b), client.connect(a)]);
  });
  after(() => stopSimulation());

  const call = async (name: string, args: Record<string, unknown> = {}) => {
    const r = await client.callTool({ name, arguments: args }) as { isError?: boolean; content: Array<{ text: string }> };
    assert.ok(!r.isError, `${name}: ${r.content?.[0]?.text}`);
    assert.ok(!/LINT_FAILED/.test(r.content[0].text), `${name} was withheld by the claim guard`);
    return JSON.parse(r.content[0].text);
  };

  it('soma_encode and intero_encode', async () => {
    const s = await call('soma_encode', { reading: { t: 10, clockDomain: 'm', taxels: { rows: 1, cols: 2, normalN: [1, 2] }, joints: [{ id: 'a', angleRad: 0.3 }] },
      previous: { t: 0, clockDomain: 'm', taxels: { rows: 1, cols: 2, normalN: [1, 1] }, joints: [{ id: 'a', angleRad: 0.2 }] } });
    assert.equal(s.origin, 'reported');
    assert.equal(s.classes.FA1[1], 1);
    const i = await call('intero_encode', { preset: 'example-robot', readings: [
      { t: 0, clockDomain: 'm', values: { actuatorTempC: 40 } }, { t: 100, clockDomain: 'm', values: { actuatorTempC: 39 } }] });
    assert.equal(i.presetIsIllustrative, true);
  });

  it('kin_closure, kin_manipulation_check, kin_protocol, kin_validate', async () => {
    const c = await call('kin_closure', { source: 'simulate', simulate: { steps: 1200, seed: 5 } });
    assert.equal(c.closed, true);
    const m = await call('kin_manipulation_check', { source: 'simulate', simulate: { steps: 1200, seed: 5 } });
    assert.equal(m.runs.length, protocolTemplate().conditions.length);
    const p = await call('kin_protocol');
    assert.equal(p.isTemplate, true);
    assert.equal(p.readyToFile, false);
    const v = await call('kin_validate', { plant: 'sensorimotor-only' });
    assert.equal(v.recovered, true);
    assert.equal(v.withdrawalOutcome.dimensionalityFromInteroception, null);
  });

  it('kin_analyse sets the outcome only under the confirmatory conditions; fcs_withdrawal accepts the pattern', async () => {
    const p = filed();
    const obs = asReported(synth(p, 'interoceptive-only'));
    const frozen = await call('kin_protocol', { protocol: p });
    const a = await call('kin_analyse', { protocol: p, sha256: frozen.sha256, observations: obs });
    assert.equal(a.confirmatory, true);
    const w = await call('fcs_withdrawal', a.withdrawalOutcome);
    assert.equal(w.report.evaluations.find((e: { thesis: string }) => e.thesis === 'kinaesthetic').standing, 'withdrawn');
    const tampered = await call('kin_analyse', { protocol: { ...p, alpha: 0.1 }, sha256: frozen.sha256, observations: obs });
    assert.equal(tampered.confirmatory, false);
  });

  it('the tools leave the global random stream where it was', async () => {
    reseed(77); const expected = [random(), random(), random()];
    reseed(77);
    await call('kin_validate', { seed: 4 });
    await call('kin_closure', { simulate: { steps: 300, seed: 2 } });
    assert.deepEqual([random(), random(), random()], expected);
  });

  it('invalid input is an error, not an encoding', async () => {
    const r = await client.callTool({ name: 'soma_encode', arguments: { reading: { t: 0, clockDomain: 'm', taxels: { rows: 2, cols: 2, normalN: [1] } } } }) as { isError?: boolean };
    assert.equal(r.isError, true);
  });
});
