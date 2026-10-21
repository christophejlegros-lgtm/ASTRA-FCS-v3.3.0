/**
 * ASTRA — Congruence manipulations for the two channels (v3.3.0-rc.5)
 * ═══════════════════════════════════════════════════════════════════
 * Document II §6.2 builds the condition space "en faisant varier de manière
 * graduée la congruence sensorimotrice : délais de réafférence, gains
 * visuo-moteurs, congruence spatiale et temporelle des stimulations", and §4.2
 * opposes it to manipulations of INTEROCEPTIVE congruence. This module
 * implements both families as pure transformations of timestamped streams.
 *
 * Two rules, enforced rather than recommended:
 *
 *   · A condition belongs to ONE family. A sensorimotor condition carries no
 *     interoceptive manipulation and conversely (`validateConditionSpace`);
 *     otherwise an effect could not be attributed.
 *   · Timing manipulations act on HARDWARE timestamps. A delay is added to the
 *     acquisition time `t`, not to the server's clock: an MCP round trip has a
 *     variable latency of its own and cannot sit inside a graded-delay loop.
 *     For live experiments the same delay line belongs in the acquisition
 *     firmware; this implementation is the reference and the offline path.
 *
 * Randomised manipulations (jitter, decoupling) draw from a LOCAL mulberry32
 * stream seeded by the condition, so they never advance ASTRA's global stream.
 *
 * © 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
 */

import type { SomatosensoryReading } from './somatosensory.js';
import type { InteroceptiveReading, InteroceptiveVariableSpec } from './interoception.js';

export type SensorimotorManipulation =
  | { kind: 'delay'; ms: number }
  | { kind: 'gain'; factor: number }
  | { kind: 'sign-flip' }
  | { kind: 'spatial-remap'; permutation: number[] }
  | { kind: 'jitter'; sdMs: number; seed: number };

export type InteroceptiveManipulation =
  | { kind: 'delay'; ms: number }
  | { kind: 'gain'; factor: number }
  | { kind: 'offset'; deltas: Record<string, number> }
  | { kind: 'decouple'; seed: number }
  /**
   * Phase shift of a CYCLIC interoceptive signal fed back by the apparatus, as a
   * fraction of the cycle (e.g. cardio-visual feedback shifted by 25 % of the
   * R–R interval; FCS-K1). Executed by the stimulation apparatus; it has no
   * meaning for a homeostatic stream, which `manipulateInteroceptive` leaves unchanged.
   */
  | { kind: 'phase-shift'; fractionOfCycle: number };

export type ConditionFamily = 'baseline' | 'sensorimotor' | 'interoceptive';

export interface ConditionSpec {
  id: string;
  family: ConditionFamily;
  /** Graded level within the family's schedule, in [0, 1]; 0 = congruent. */
  level: number;
  sensorimotor: SensorimotorManipulation[];
  interoceptive: InteroceptiveManipulation[];
}

/** Local mulberry32 stream — never touches the global generator in utils/rng.ts. */
export function localRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rng: () => number): number {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const isPermutation = (p: readonly number[]) =>
  Array.isArray(p) && p.length > 0 && p.every((x) => Number.isInteger(x)) && new Set(p).size === p.length &&
  p.every((x) => x >= 0 && x < p.length);

function validateSensorimotor(m: SensorimotorManipulation): string | null {
  switch (m.kind) {
    case 'delay': return Number.isFinite(m.ms) && m.ms >= 0 ? null : 'delay.ms must be finite and ≥ 0';
    case 'gain': return Number.isFinite(m.factor) && m.factor > 0 ? null : 'gain.factor must be finite and > 0';
    case 'sign-flip': return null;
    case 'spatial-remap': return isPermutation(m.permutation) ? null : 'spatial-remap.permutation must be a permutation of 0…n−1';
    case 'jitter': return Number.isFinite(m.sdMs) && m.sdMs >= 0 && Number.isInteger(m.seed) ? null : 'jitter needs sdMs ≥ 0 and an integer seed';
    default: return `unknown sensorimotor manipulation ${(m as { kind: string }).kind}`;
  }
}

function validateInteroceptive(m: InteroceptiveManipulation): string | null {
  switch (m.kind) {
    case 'delay': return Number.isFinite(m.ms) && m.ms >= 0 ? null : 'delay.ms must be finite and ≥ 0';
    case 'gain': return Number.isFinite(m.factor) && m.factor > 0 ? null : 'gain.factor must be finite and > 0';
    case 'offset': return m.deltas && Object.values(m.deltas).every(Number.isFinite) ? null : 'offset.deltas must be finite';
    case 'decouple': return Number.isInteger(m.seed) ? null : 'decouple needs an integer seed';
    case 'phase-shift': return Number.isFinite(m.fractionOfCycle) && m.fractionOfCycle > 0 && m.fractionOfCycle < 1
      ? null : 'phase-shift.fractionOfCycle must lie in (0, 1)';
    default: return `unknown interoceptive manipulation ${(m as { kind: string }).kind}`;
  }
}

/**
 * Checks a condition space: one family per condition, a congruent baseline,
 * graded levels in [0, 1] strictly increasing within each family, unique ids.
 */
export function validateConditionSpace(conditions: readonly ConditionSpec[]): string[] {
  const p: string[] = [];
  const ids = new Set<string>();
  for (const c of conditions) {
    if (!c.id) p.push('condition id is required');
    else if (ids.has(c.id)) p.push(`condition id "${c.id}" is duplicated`);
    else ids.add(c.id);
    if (!(Number.isFinite(c.level) && c.level >= 0 && c.level <= 1)) p.push(`${c.id}: level must lie in [0, 1]`);
    for (const m of c.sensorimotor ?? []) { const e = validateSensorimotor(m); if (e) p.push(`${c.id}: ${e}`); }
    for (const m of c.interoceptive ?? []) { const e = validateInteroceptive(m); if (e) p.push(`${c.id}: ${e}`); }
    if (c.family === 'baseline') {
      if (c.level !== 0 || c.sensorimotor.length || c.interoceptive.length) p.push(`${c.id}: the baseline is level 0 with no manipulation`);
    } else if (c.family === 'sensorimotor') {
      if (c.interoceptive.length) p.push(`${c.id}: a sensorimotor condition carries no interoceptive manipulation`);
      if (c.level > 0 && !c.sensorimotor.length) p.push(`${c.id}: level > 0 without a manipulation`);
    } else if (c.family === 'interoceptive') {
      if (c.sensorimotor.length) p.push(`${c.id}: an interoceptive condition carries no sensorimotor manipulation`);
      if (c.level > 0 && !c.interoceptive.length) p.push(`${c.id}: level > 0 without a manipulation`);
    } else p.push(`${c.id}: unknown family`);
  }
  if (!conditions.some((c) => c.family === 'baseline')) p.push('a congruent baseline condition is required');
  for (const fam of ['sensorimotor', 'interoceptive'] as const) {
    const levels = conditions.filter((c) => c.family === fam).map((c) => c.level).sort((a, b) => a - b);
    if (levels.length === 0) p.push(`no ${fam} condition: the test needs both families`);
    for (let i = 1; i < levels.length; i++) if (levels[i] === levels[i - 1]) p.push(`${fam}: level ${levels[i]} appears twice`);
  }
  return p;
}

export interface ManipulationReport<T> {
  delivered: T[];
  applied: string[];
  /** What the manipulation did not reach, stated (e.g. contact forces under a gain). */
  notes: string[];
}

/**
 * Applies sensorimotor manipulations to a somatosensory stream. Gains and sign
 * flips act on movement signals (joint angle and velocity, skin stretch) around
 * the first reading's values; delay and jitter move the whole reading, so every
 * reafferent field is displaced together and none stays congruent beside it.
 */
export function manipulateSomatosensory(
  readings: readonly SomatosensoryReading[],
  manipulations: readonly SensorimotorManipulation[],
): ManipulationReport<SomatosensoryReading> {
  for (const m of manipulations) { const e = validateSensorimotor(m); if (e) throw new RangeError(e); }
  const applied: string[] = [];
  const notes: string[] = [];
  const ref = readings[0];
  const refAngle = new Map((ref?.joints ?? []).map((j) => [j.id, j.angleRad]));
  const refStretch = ref?.stretch ?? [];
  let out = readings.map((r) => structuredClone(r) as SomatosensoryReading);

  for (const m of manipulations) {
    if (m.kind === 'delay') {
      out = out.map((r) => ({ ...r, generatedAt: r.generatedAt ?? r.t, t: r.t + m.ms }));
      applied.push(`delay ${m.ms} ms (all fields)`);
    } else if (m.kind === 'jitter') {
      const rng = localRng(m.seed);
      out = out.map((r) => ({ ...r, generatedAt: r.generatedAt ?? r.t, t: r.t + Math.abs(gaussian(rng)) * m.sdMs }));
      applied.push(`jitter |N(0, ${m.sdMs})| ms, seed ${m.seed}`);
    } else if (m.kind === 'gain' || m.kind === 'sign-flip') {
      const g = m.kind === 'gain' ? m.factor : -1;
      for (const r of out) {
        for (const j of r.joints ?? []) {
          const a0 = refAngle.get(j.id) ?? j.angleRad;
          j.angleRad = a0 + g * (j.angleRad - a0);
          if (j.velocityRadS != null) j.velocityRadS *= g;
        }
        if (r.stretch) r.stretch = r.stretch.map((s, i) => (refStretch[i] ?? s) + g * (s - (refStretch[i] ?? s)));
      }
      applied.push(m.kind === 'gain' ? `gain ×${m.factor} on joint motion and skin stretch` : 'sign flip of joint motion and skin stretch');
      notes.push('Contact forces, vibration and temperature are not scaled by a gain or a sign flip.');
    } else if (m.kind === 'spatial-remap') {
      const P = m.permutation;
      let hit = false;
      for (const r of out) {
        if (r.taxels && r.taxels.normalN.length === P.length) {
          const remap = (a: number[]) => P.map((k) => a[k]);
          r.taxels.normalN = remap(r.taxels.normalN);
          if (r.taxels.shearXN) r.taxels.shearXN = remap(r.taxels.shearXN);
          if (r.taxels.shearYN) r.taxels.shearYN = remap(r.taxels.shearYN);
          hit = true;
        }
        if (r.stretch && r.stretch.length === P.length) { r.stretch = P.map((k) => r.stretch![k]); hit = true; }
      }
      applied.push(`spatial remap over ${P.length} units`);
      if (!hit) notes.push('spatial-remap: no taxel or stretch array of matching length — nothing was remapped.');
    }
  }
  out.sort((a, b) => a.t - b.t);
  return { delivered: out, applied, notes };
}

/**
 * Applies interoceptive manipulations. Gain acts around each variable's
 * setpoint; offset adds raw deltas; decoupling replays the stream's own values
 * in a shuffled order, so the delivered state keeps its distribution but no
 * longer corresponds to the actual state at that time.
 */
export function manipulateInteroceptive(
  readings: readonly InteroceptiveReading[],
  manipulations: readonly InteroceptiveManipulation[],
  specs: readonly InteroceptiveVariableSpec[],
): ManipulationReport<InteroceptiveReading> {
  for (const m of manipulations) { const e = validateInteroceptive(m); if (e) throw new RangeError(e); }
  const setpoint = new Map(specs.map((s) => [s.id, s.setpoint]));
  const applied: string[] = [];
  const notes: string[] = [];
  let out = readings.map((r) => ({ ...r, values: { ...r.values } }));
  for (const m of manipulations) {
    if (m.kind === 'delay') {
      out = out.map((r) => ({ ...r, generatedAt: r.generatedAt ?? r.t, t: r.t + m.ms }));
      applied.push(`delay ${m.ms} ms`);
    } else if (m.kind === 'gain') {
      for (const r of out) for (const k of Object.keys(r.values)) {
        const s = setpoint.get(k);
        if (s !== undefined) r.values[k] = s + m.factor * (r.values[k] - s);
      }
      applied.push(`gain ×${m.factor} around setpoints`);
    } else if (m.kind === 'offset') {
      for (const [k, d] of Object.entries(m.deltas)) {
        if (!setpoint.has(k)) { notes.push(`offset: "${k}" is not a declared variable and was ignored`); continue; }
        for (const r of out) if (r.values[k] !== undefined) r.values[k] += d;
      }
      applied.push(`offset on ${Object.keys(m.deltas).join(', ')}`);
    } else if (m.kind === 'decouple') {
      const rng = localRng(m.seed);
      const vals = out.map((r) => r.values);
      for (let i = vals.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [vals[i], vals[j]] = [vals[j], vals[i]];
      }
      out = out.map((r, i) => ({ ...r, values: vals[i] }));
      applied.push(`decoupling by shuffled replay, seed ${m.seed}`);
    } else if (m.kind === 'phase-shift') {
      notes.push(`phase-shift ${m.fractionOfCycle} of the cycle is executed by the stimulation apparatus on a cyclic signal; the homeostatic stream is unchanged`);
    }
  }
  out.sort((a, b) => a.t - b.t);
  return { delivered: out, applied, notes };
}
