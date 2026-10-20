/**
 * ASTRA — Calibrate, freeze, manipulate: the two loops under one condition (v3.3.0-rc.5)
 * ═════════════════════════════════════════════════════════════════════════════════════
 * For each condition of a condition space, on the same recorded session:
 *
 *   1. CALIBRATION block (congruent): the somatosensory comparator learns its
 *      forward model and the expected latency L̂; the interoceptive channel
 *      learns its homeostatic model.
 *   2. Both models are FROZEN, so neither can adapt to the manipulation.
 *   3. TEST block: the condition's manipulations are applied to the delivered
 *      streams, and each channel's prediction error is recorded.
 *
 * The output is the MANIPULATION CHECK of the withdrawal test: a sensorimotor
 * manipulation must raise the sensorimotor error, an interoceptive one the
 * interoceptive error — and each should leave the other channel's error where
 * it was. Without a passed check, a null dimensionality effect is uninterpretable
 * (the manipulation may simply not have reached the system).
 *
 * Works on any session — recorded or simulated — that supplies the three
 * timestamped streams. Origin is carried through, never upgraded.
 *
 * © 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
 */

import { SomatosensoryEncoder, afferentVector, type SomatosensoryReading, type SomatosensoryConfig, type Origin } from './somatosensory.js';
import { InteroceptiveChannel, type InteroceptiveReading, type InteroceptiveVariableSpec } from './interoception.js';
import { ReafferenceComparator, estimateLatency, type EfferenceCopy, type ReafferenceSample, type ComparatorConfig, type ComparatorStep } from './reafference.js';
import { manipulateSomatosensory, manipulateInteroceptive, type ConditionSpec } from './congruence.js';

export interface RecordedSession {
  efference: EfferenceCopy[];
  somatosensory: SomatosensoryReading[];
  interoceptive: InteroceptiveReading[];
  /** Declared load per interoceptive reading (a command quantity), same length; zeros if absent. */
  interoceptiveLoad?: number[];
}

export interface ConditionRun {
  conditionId: string;
  family: ConditionSpec['family'];
  level: number;
  origin: Origin | 'mixed';
  /** Mean RMS comparator error over the test block (somatosensory reafference). */
  sensorimotorError: number;
  /** Mean RMS interoceptive prediction error over the test block. */
  interoceptiveError: number;
  expectedLatencyMs: number;
  pairedTestSteps: number;
  applied: string[];
  notes: string[];
}

function toReafference(frames: Array<{ t: number; clockDomain: string; v: number[]; generatedAt?: number }>): ReafferenceSample[] {
  return frames.map((f) => ({ t: f.t, clockDomain: f.clockDomain, features: f.v, ...(f.generatedAt !== undefined ? { generatedAt: f.generatedAt } : {}) }));
}

const mean = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : NaN);

export interface ConditionTrace {
  /** Comparator steps over the test block, aligned with `pairs`. */
  steps: ComparatorStep[];
  pairs: Array<{ e: EfferenceCopy; r: ReafferenceSample }>;
  /** Interoceptive RMS prediction errors over the test block. */
  interoceptiveErrors: number[];
  /** Per delivered interoceptive reading: delivery time and per-variable normalised prediction errors. */
  interoceptiveFrames: Array<{ t: number; errors: number[] }>;
  expectedLatencyMs: number;
  applied: string[];
  notes: string[];
  origin: Origin | 'mixed';
}

function checkSession(session: RecordedSession): number[] {
  if (!session.efference.length || !session.somatosensory.length || !session.interoceptive.length) {
    throw new RangeError('a session needs efference, somatosensory and interoceptive streams');
  }
  const loads = session.interoceptiveLoad ?? session.interoceptive.map(() => 0);
  if (loads.length !== session.interoceptive.length) throw new RangeError('interoceptiveLoad must match the interoceptive stream');
  return loads;
}

/**
 * One condition on one session: everything acquired before `cut` (ms) is the
 * congruent calibration block, everything from `cut` on is the test block.
 */
export function calibrateFreezeManipulate(
  session: RecordedSession,
  cut: number,
  cond: ConditionSpec,
  specs: readonly InteroceptiveVariableSpec[],
  opts: { somatosensory?: Partial<SomatosensoryConfig>; comparator?: Partial<ComparatorConfig> } = {},
): ConditionTrace {
  const loads = checkSession(session);
  const origins = new Set([...session.somatosensory, ...session.interoceptive, ...session.efference].map((x) => x.origin));
  const origin: Origin | 'mixed' = origins.size === 1 ? [...origins][0] : 'mixed';
  const effCal = session.efference.filter((e) => e.t < cut);
  const effTest = session.efference.filter((e) => e.t >= cut);
  const somaCal = session.somatosensory.filter((r) => r.t < cut);
  const somaTest = session.somatosensory.filter((r) => r.t >= cut);
  const interoIdx = session.interoceptive.map((r, i) => ({ r, load: loads[i] }));
  const interoCal = interoIdx.filter((x) => x.r.t < cut);
  const interoTest = interoIdx.filter((x) => x.r.t >= cut);
  if (!effCal.length || !effTest.length) throw new RangeError('both a calibration block and a test block are required');

  const notes: string[] = [];
  // 1. Calibration (congruent, learning on).
  const enc = new SomatosensoryEncoder(opts.somatosensory);
  const calReaff = toReafference(somaCal.map((r) => ({ t: r.t, clockDomain: r.clockDomain, v: afferentVector(enc.encode(r)) })));
  const L = estimateLatency(effCal, calReaff);
  if (L === null) throw new RangeError('calibration block: no command received a return; latency cannot be calibrated');
  const cmp = new ReafferenceComparator({ ...opts.comparator, expectedLatencyMs: L });
  cmp.run(effCal, calReaff);
  const intero = new InteroceptiveChannel(specs);
  for (const x of interoCal) intero.encode(x.r, x.load);

  // 2. Freeze.
  cmp.setLearning(false);
  intero.setLearning(false);

  // 3. Test block under the condition's manipulations.
  const sm = manipulateSomatosensory(somaTest, cond.sensorimotor);
  const im = manipulateInteroceptive(interoTest.map((x) => x.r), cond.interoceptive, specs);
  notes.push(...sm.notes, ...im.notes);
  const testFrames = sm.delivered.map((r) => ({ t: r.t, clockDomain: r.clockDomain, v: afferentVector(enc.encode(r)), generatedAt: r.generatedAt }));
  const res = cmp.run(effTest, toReafference(testFrames));
  if (res.unpaired > 0) notes.push(`${res.unpaired} test command(s) without a return by the deadline`);
  // Loads follow the delivered interoceptive readings (a load is a command quantity: it is not delayed).
  const loadByGen = new Map(interoTest.map((x) => [x.r.t, x.load]));
  const interoceptiveErrors: number[] = [];
  const interoceptiveFrames: Array<{ t: number; errors: number[] }> = [];
  for (const r of im.delivered) {
    const fr = intero.encode(r, loadByGen.get(r.generatedAt ?? r.t) ?? 0);
    if (fr.rmsPredictionError !== null) interoceptiveErrors.push(fr.rmsPredictionError);
    if (fr.variables.every((v) => v.predictionError !== null)) {
      interoceptiveFrames.push({ t: r.t, errors: fr.variables.map((v) => v.predictionError as number) });
    }
  }
  return { steps: res.steps, pairs: res.pairs, interoceptiveErrors, interoceptiveFrames, expectedLatencyMs: L,
    applied: [...sm.applied, ...im.applied], notes, origin };
}

/**
 * Runs every condition on one session. `calibrationFraction` of the session
 * (by time) is the congruent calibration block; the rest is the test block.
 */
export function runConditions(
  session: RecordedSession,
  conditions: readonly ConditionSpec[],
  specs: readonly InteroceptiveVariableSpec[],
  opts: { calibrationFraction?: number; somatosensory?: Partial<SomatosensoryConfig>; comparator?: Partial<ComparatorConfig> } = {},
): ConditionRun[] {
  const f = opts.calibrationFraction ?? 0.5;
  if (!(f > 0.1 && f < 0.9)) throw new RangeError('calibrationFraction must lie in (0.1, 0.9)');
  checkSession(session);
  const tMin = Math.min(session.efference[0].t, session.somatosensory[0].t);
  const tMax = Math.max(session.efference[session.efference.length - 1].t, session.somatosensory[session.somatosensory.length - 1].t);
  const cut = tMin + f * (tMax - tMin);
  return conditions.map((cond) => {
    const tr = calibrateFreezeManipulate(session, cut, cond, specs, opts);
    return {
      conditionId: cond.id, family: cond.family, level: cond.level, origin: tr.origin,
      sensorimotorError: mean(tr.steps.map((s) => s.rmsError)),
      interoceptiveError: mean(tr.interoceptiveErrors),
      expectedLatencyMs: tr.expectedLatencyMs,
      pairedTestSteps: tr.steps.length,
      applied: tr.applied,
      notes: tr.notes,
    };
  });
}
