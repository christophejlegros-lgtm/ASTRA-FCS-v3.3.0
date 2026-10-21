/**
 * ASTRA — Probe movements and per-condition observations for the FCS-K0 pilot (v3.3.0-rc.5)
 * ═════════════════════════════════════════════════════════════════════════════════════════
 * FCS-K0 (empirical/PREREG-KINAESTHETIC-K0-PILOT.md) tests the INSTRUMENT on an
 * instrumented robot finger: one session = a congruent calibration block, then
 * a test block of probe movements. For each condition, the test block is
 * manipulated (congruence.ts); the frozen somatosensory comparator returns an
 * error vector per paired command and the frozen interoceptive predictor an
 * error vector per delivered reading. Each probe's response concatenates the
 * MEAN error vectors of BOTH channels over the probe (interoceptive readings
 * are assigned to the probe running when they are delivered), and each feature
 * is then standardised across probes (constant features dropped) so that
 * neither channel dominates by its units. The probes × features matrix gives
 * the dissimilarity matrix (1 − r) of that session and condition, hence one
 * `KinaestheticObservation`.
 *
 * Both channels, not the somatosensory one alone: with comparator errors only,
 * an interoceptive manipulation could not change the patterns, so an
 * interoceptive "absence" would be guaranteed by construction (found in the
 * K0 dry run of 20 October 2026).
 *
 * Probe set (decision of 20 October 2026): four amplitudes × two objects —
 * 0.3, 0.6, 0.9 and 1.2 rad, pressing on foam (low contact heat transfer) or
 * aluminium (high), both at room temperature.
 *
 * A recorded session supplies the same three streams as the simulation, with
 * each command's `commandId` mapped to its probe and the start of the test
 * block. Nothing here decides anything about the thesis: K0 is declared a
 * pilot, and `analyseKinaestheticTest` never sets an outcome for it.
 *
 * © 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
 */

import { simulateFinger, defaultCommand, type BodySimConfig, type ContactObject } from './body-sim.js';
import { calibrateFreezeManipulate, type RecordedSession } from './body-loop.js';
import { localRng, type ConditionSpec } from './congruence.js';
import type { InteroceptiveVariableSpec } from './interoception.js';
import type { SomatosensoryConfig } from './somatosensory.js';
import type { ComparatorConfig } from './reafference.js';
import type { KinaestheticObservation } from './fcs/kinaesthetic-withdrawal.js';

export interface ProbeSpec {
  id: string;
  amplitudeRad: number;
  object: ContactObject & { label: string };
}

const FOAM = { label: 'foam', contactCoefficient: 150, tempC: 22 };
const ALUMINIUM = { label: 'aluminium', contactCoefficient: 1500, tempC: 22 };

/** The eight K0 probes: four amplitudes × two objects. */
export const K0_PROBES: readonly ProbeSpec[] = Object.freeze(
  [0.3, 0.6, 0.9, 1.2].flatMap((a) => [FOAM, ALUMINIUM].map((o) => ({ id: `a${a}-${o.label}`, amplitudeRad: a, object: o }))),
);

export interface ProbeSession extends RecordedSession {
  probes: readonly ProbeSpec[];
  /** commandId → probe id, for the commands of the test block. */
  probeOfCommand: Record<string, string>;
  /** Hardware time (ms) at which the test block starts. */
  testStart: number;
}

/** Probe command: a smooth press to `amplitude` and back over `steps` control periods. */
export function probeCommand(stepInProbe: number, steps: number, amplitude: number): number {
  return amplitude * Math.sin((Math.PI * stepInProbe) / steps) ** 2;
}

/**
 * Simulated K0 session (pipeline exercise; every sample `simulated`).
 * Calibration alternates the two objects; the test block runs `repetitions`
 * passes over the probes, in an order shuffled per pass from `seed`.
 */
export function simulateProbeSession(opts: {
  seed: number;
  calibrationSteps?: number;
  stepsPerProbe?: number;
  repetitions?: number;
  probes?: readonly ProbeSpec[];
  config?: Partial<BodySimConfig>;
}): ProbeSession {
  const calibrationSteps = opts.calibrationSteps ?? 1500;
  const stepsPerProbe = opts.stepsPerProbe ?? 60;
  const repetitions = opts.repetitions ?? 3;
  const probes = opts.probes ?? K0_PROBES;
  if (!(calibrationSteps >= 200 && stepsPerProbe >= 10 && repetitions >= 1 && probes.length >= 3)) {
    throw new RangeError('need ≥ 200 calibration steps, ≥ 10 steps per probe, ≥ 1 repetition and ≥ 3 probes');
  }
  const rng = localRng(opts.seed ^ 0x9e3779b9);
  const hold = { v: 0.5, until: 0 };
  const commands: number[] = [];
  const objects: ContactObject[] = [];
  const probeAt: Array<string | null> = [];
  for (let k = 0; k < calibrationSteps; k++) {
    commands.push(defaultCommand(k, rng, hold));
    objects.push(Math.floor(k / 200) % 2 === 0 ? FOAM : ALUMINIUM);
    probeAt.push(null);
  }
  for (let r = 0; r < repetitions; r++) {
    const order = probes.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    for (const pi of order) {
      const p = probes[pi];
      for (let s = 0; s < stepsPerProbe; s++) {
        commands.push(probeCommand(s, stepsPerProbe, p.amplitudeRad));
        objects.push(p.object);
        probeAt.push(p.id);
      }
    }
  }
  const session = simulateFinger(commands.length, { ...opts.config, seed: opts.seed }, (k) => commands[k], (k) => objects[k]);
  const probeOfCommand: Record<string, string> = {};
  session.efference.forEach((e, k) => { if (probeAt[k] !== null) probeOfCommand[e.commandId ?? `k${k}`] = probeAt[k]!; });
  return { ...session, probes, probeOfCommand, testStart: session.efference[calibrationSteps].t };
}

/**
 * One observation (unit × condition) of the K0 pilot: the probes × features
 * matrix of mean comparator errors under the condition, and the manipulation
 * check (mean errors of both channels over the test block).
 */
export function probeObservation(
  session: ProbeSession,
  condition: ConditionSpec,
  specs: readonly InteroceptiveVariableSpec[],
  meta: { unitId: string; collectedAt: string },
  opts: { somatosensory?: Partial<SomatosensoryConfig>; comparator?: Partial<ComparatorConfig> } = {},
): KinaestheticObservation {
  const tr = calibrateFreezeManipulate(session, session.testStart, condition, specs, opts);
  if (tr.origin === 'mixed') throw new RangeError('a session mixes simulated and reported samples');
  const accumulate = (map: Map<string, { sum: number[]; n: number }>, probe: string, v: number[]) => {
    const acc = map.get(probe) ?? { sum: v.map(() => 0), n: 0 };
    v.forEach((x, f) => { acc.sum[f] += x; });
    acc.n++;
    map.set(probe, acc);
  };
  const soma = new Map<string, { sum: number[]; n: number }>();
  tr.steps.forEach((step, i) => {
    const probe = session.probeOfCommand[tr.pairs[i].e.commandId ?? ''];
    if (probe) accumulate(soma, probe, step.error);
  });
  // Interoceptive readings belong to the probe running when they are delivered.
  const timeline = session.efference
    .filter((e) => session.probeOfCommand[e.commandId ?? ''])
    .map((e) => ({ t: e.t, probe: session.probeOfCommand[e.commandId ?? ''] }))
    .sort((a, b) => a.t - b.t);
  const probeAt = (t: number): string | null => {
    let lo = 0, hi = timeline.length - 1, found = -1;
    while (lo <= hi) { const mid = (lo + hi) >> 1; if (timeline[mid].t <= t) { found = mid; lo = mid + 1; } else hi = mid - 1; }
    return found >= 0 ? timeline[found].probe : null;
  };
  const intero = new Map<string, { sum: number[]; n: number }>();
  for (const f of tr.interoceptiveFrames) { const probe = probeAt(f.t); if (probe) accumulate(intero, probe, f.errors); }
  const raw = session.probes.map((p) => {
    const s = soma.get(p.id), i = intero.get(p.id);
    if (!s || s.n === 0) throw new RangeError(`probe ${p.id} received no paired return under condition ${condition.id}`);
    if (!i || i.n === 0) throw new RangeError(`probe ${p.id} received no interoceptive reading under condition ${condition.id}`);
    return [...s.sum.map((v) => v / s.n), ...i.sum.map((v) => v / i.n)];
  });
  // Standardise each feature across probes; drop constant features.
  const nf = raw[0].length;
  const keep: number[] = [];
  const mu: number[] = [], sd: number[] = [];
  for (let f = 0; f < nf; f++) {
    const col = raw.map((r) => r[f]);
    const m = col.reduce((a, b) => a + b, 0) / col.length;
    const v = Math.sqrt(col.reduce((a, b) => a + (b - m) ** 2, 0) / col.length);
    mu.push(m); sd.push(v);
    if (v > 1e-12) keep.push(f);
  }
  if (keep.length < 2) throw new RangeError(`fewer than two non-constant features under condition ${condition.id}`);
  const patterns = raw.map((r) => keep.map((f) => (r[f] - mu[f]) / sd[f]));
  const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / Math.max(1, v.length);
  return {
    unitId: meta.unitId,
    conditionId: condition.id,
    collectedAt: meta.collectedAt,
    origin: tr.origin,
    patterns,
    manipulationCheck: {
      sensorimotorError: mean(tr.steps.map((s) => s.rmsError)),
      interoceptiveError: mean(tr.interoceptiveErrors),
    },
  };
}
