/**
 * ASTRA — Interoceptive channel, kept separate (v3.3.0-rc.5)
 * ══════════════════════════════════════════════════════════
 * The kinaesthetic thesis has a declared rival: interoceptive closure (Damasio
 * & Carvalho 2013; Seth 2013). Document II §4.2 makes the choice reversible —
 * if the dimensionality effects of §6.3 appear under manipulation of
 * INTEROCEPTIVE and not of sensorimotor congruence, the first closure is
 * interoceptive and level II is redefined (withdrawal.ts, `kinaesthetic`).
 *
 * That test is only possible if the two channels can be manipulated
 * independently. Hence three structural choices:
 *
 *   1. Separate type. An `InteroceptiveFrame` is `channel: 'interoceptive'` and
 *      is never a `ModalityEmbedding`: the exteroceptive attention fusion
 *      (multimodal-sensors.ts) refuses it at run time as well.
 *   2. Separate variables. A physical signal belongs to ONE channel. Motor
 *      current used as effort (somatosensory TENDON) cannot also be the energy
 *      draw here: `checkChannelSeparation` lists overlaps, and the withdrawal
 *      analysis refuses a confirmatory run while any remains.
 *   3. Separate prediction. Interoception has no discrete command (document II
 *      §4.2: "ni commande discrète ni réafférence spécifique"); its prediction
 *      is homeostatic — relaxation toward a setpoint plus an optional declared
 *      load — so that an interoceptive manipulation shows up as an
 *      interoceptive prediction error, not as a sensorimotor one.
 *
 * Variables are declared with a setpoint and a viable range. For a robot they
 * come from the device's ratings; for a living culture (organoid on MEA) the
 * medium's temperature, pH, dissolved O₂ and glucose are literally the
 * substrate's interoceptive variables, and their viable ranges are the
 * laboratory's to declare — this module supplies no culture defaults.
 *
 * © 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
 */

import type { Origin } from './somatosensory.js';

export interface InteroceptiveVariableSpec {
  id: string;
  unit: string;
  setpoint: number;
  viableMin: number;
  viableMax: number;
  substrate: 'robot' | 'culture' | 'other';
}

export interface InteroceptiveReading {
  t: number;
  clockDomain: string;
  origin: Origin;
  values: Record<string, number>;
  /** Identifiers of the physical sensors behind this reading (channel-separation check). */
  sourceSignals?: string[];
  /** Set by a manipulation: the acquisition time before an imposed delay. */
  generatedAt?: number;
}

export interface InteroceptiveVariableState {
  id: string;
  unit: string;
  value: number;
  setpoint: number;
  /** (value − setpoint) / half viable range: 0 at setpoint, ±1 at the nearest bound's distance. */
  homeostaticError: number;
  /** Distance to the nearest viable bound / half range: 1 at the centre, 0 at a bound, < 0 outside. */
  viabilityMargin: number;
  /** Homeostatic prediction made at the previous step for this one; null on the first. */
  predicted: number | null;
  /** (value − predicted) / half viable range; null on the first step. */
  predictionError: number | null;
}

export interface InteroceptiveFrame {
  channel: 'interoceptive';
  t: number;
  clockDomain: string;
  origin: Origin;
  variables: InteroceptiveVariableState[];
  /** max |homeostaticError|, clipped to [0, 1] — a drive for a setpoint controller, nothing more. */
  homeostaticDrive: number;
  /** RMS of the normalised prediction errors; null on the first step. */
  rmsPredictionError: number | null;
  outsideViable: string[];
  notes: string[];
}

/** Validates a set of variable specifications; empty array = admissible. */
export function validateInteroceptiveSpecs(specs: readonly InteroceptiveVariableSpec[]): string[] {
  const p: string[] = [];
  if (!Array.isArray(specs) || specs.length === 0) return ['at least one interoceptive variable must be declared'];
  const ids = new Set<string>();
  for (const s of specs) {
    if (!s.id) p.push('variable id is required');
    else if (ids.has(s.id)) p.push(`variable "${s.id}" is declared twice`);
    else ids.add(s.id);
    for (const k of ['setpoint', 'viableMin', 'viableMax'] as const) {
      if (typeof s[k] !== 'number' || !Number.isFinite(s[k])) p.push(`${s.id}: ${k} must be finite`);
    }
    if (Number.isFinite(s.viableMin) && Number.isFinite(s.viableMax) && !(s.viableMin < s.viableMax)) p.push(`${s.id}: viableMin must be < viableMax`);
    if (Number.isFinite(s.setpoint) && !(s.setpoint > s.viableMin && s.setpoint < s.viableMax)) p.push(`${s.id}: setpoint must lie strictly inside the viable range`);
  }
  return p;
}

/**
 * Illustrative robot variables, for simulation and tests only. The numbers are
 * placeholders of plausible order, not ratings of any device: replace them with
 * the datasheet values of the actual actuator, battery and board.
 */
export function exampleRobotInteroception(): InteroceptiveVariableSpec[] {
  return [
    { id: 'actuatorTempC', unit: '°C', setpoint: 35, viableMin: 0, viableMax: 70, substrate: 'robot' },
    { id: 'stateOfCharge', unit: 'fraction', setpoint: 0.8, viableMin: 0.1, viableMax: 1, substrate: 'robot' },
    { id: 'boardTempC', unit: '°C', setpoint: 40, viableMin: 0, viableMax: 85, substrate: 'robot' },
  ];
}

/**
 * Culture variables with the laboratory's declared viable ranges. Setpoints
 * default to the usual 37 °C and pH 7.4 of mammalian cell culture; every range
 * must be supplied, because it depends on the preparation.
 */
export function cultureInteroception(ranges: {
  mediumTempC: [number, number];
  mediumPH: [number, number];
  dissolvedO2?: { setpoint: number; range: [number, number]; unit: string };
  glucose?: { setpoint: number; range: [number, number]; unit: string };
}, setpoints: { mediumTempC?: number; mediumPH?: number } = {}): InteroceptiveVariableSpec[] {
  const specs: InteroceptiveVariableSpec[] = [
    { id: 'mediumTempC', unit: '°C', setpoint: setpoints.mediumTempC ?? 37, viableMin: ranges.mediumTempC[0], viableMax: ranges.mediumTempC[1], substrate: 'culture' },
    { id: 'mediumPH', unit: 'pH', setpoint: setpoints.mediumPH ?? 7.4, viableMin: ranges.mediumPH[0], viableMax: ranges.mediumPH[1], substrate: 'culture' },
  ];
  if (ranges.dissolvedO2) specs.push({ id: 'dissolvedO2', unit: ranges.dissolvedO2.unit, setpoint: ranges.dissolvedO2.setpoint, viableMin: ranges.dissolvedO2.range[0], viableMax: ranges.dissolvedO2.range[1], substrate: 'culture' });
  if (ranges.glucose) specs.push({ id: 'glucose', unit: ranges.glucose.unit, setpoint: ranges.glucose.setpoint, viableMin: ranges.glucose.range[0], viableMax: ranges.glucose.range[1], substrate: 'culture' });
  const problems = validateInteroceptiveSpecs(specs);
  if (problems.length) throw new RangeError(`cultureInteroception: ${problems.join('; ')}`);
  return specs;
}

/** Problems found in a reading against the declared variables; empty array = admissible. */
export function validateInteroceptiveReading(r: InteroceptiveReading, specs: readonly InteroceptiveVariableSpec[]): string[] {
  const p: string[] = [];
  if (!r || typeof r !== 'object') return ['reading is not an object'];
  if (typeof r.t !== 'number' || !Number.isFinite(r.t)) p.push('t must be a finite timestamp (ms)');
  if (typeof r.clockDomain !== 'string' || !r.clockDomain.trim()) p.push('clockDomain is required');
  if (r.origin !== 'simulated' && r.origin !== 'reported') p.push("origin must be 'simulated' or 'reported'");
  if (!r.values || typeof r.values !== 'object') return [...p, 'values are required'];
  const declared = new Set(specs.map((s) => s.id));
  for (const [k, v] of Object.entries(r.values)) {
    if (!declared.has(k)) p.push(`"${k}" is not a declared interoceptive variable`);
    else if (typeof v !== 'number' || !Number.isFinite(v)) p.push(`${k} must be finite`);
  }
  return p;
}

interface HomeostaticModel { a: number; b: number }

/**
 * Interoceptive channel: homeostatic errors, viability margins and a
 * homeostatic prediction learned online per variable,
 *   x̂_{t+1} = x_t + a·(setpoint − x_t) + b·load_t      (NLMS on [setpoint − x_t, load_t]).
 * `load` is an optional declared driver (e.g. mean actuator demand). It may be a
 * COMMAND quantity, never a sensed somatosensory signal, so that the channels
 * stay separable.
 */
export class InteroceptiveChannel {
  readonly specs: readonly InteroceptiveVariableSpec[];
  private models = new Map<string, HomeostaticModel>();
  private last: { t: number; values: Record<string, number>; load: number } | null = null;
  private pending = new Map<string, number>();
  private learning = true;
  private clock: string | null = null;

  constructor(specs: readonly InteroceptiveVariableSpec[], private readonly learningRate = 0.3) {
    const problems = validateInteroceptiveSpecs(specs);
    if (problems.length) throw new RangeError(`InteroceptiveChannel: ${problems.join('; ')}`);
    if (!(learningRate > 0 && learningRate < 2)) throw new RangeError('learningRate must lie in (0, 2)');
    this.specs = specs.map((s) => ({ ...s }));
    for (const s of specs) this.models.set(s.id, { a: 0.1, b: 0 });
  }

  /** Freeze (false) or resume (true) learning — frozen during test blocks. */
  setLearning(on: boolean): void { this.learning = on; }

  reset(): void {
    this.last = null; this.pending.clear(); this.clock = null; this.learning = true;
    for (const s of this.specs) this.models.set(s.id, { a: 0.1, b: 0 });
  }

  encode(r: InteroceptiveReading, load = 0): InteroceptiveFrame {
    const problems = validateInteroceptiveReading(r, this.specs);
    if (problems.length) throw new RangeError(`Invalid interoceptive reading: ${problems.join('; ')}`);
    if (!Number.isFinite(load)) throw new RangeError('load must be finite');
    if (this.clock !== null && this.clock !== r.clockDomain) throw new RangeError(`channel bound to clock domain ${this.clock}`);
    this.clock = r.clockDomain;
    const notes: string[] = [];
    const variables: InteroceptiveVariableState[] = [];
    const outsideViable: string[] = [];
    const errs: number[] = [];

    for (const s of this.specs) {
      const value = r.values[s.id];
      if (value === undefined) { notes.push(`${s.id} not reported in this reading`); continue; }
      const half = (s.viableMax - s.viableMin) / 2;
      const homeostaticError = (value - s.setpoint) / half;
      const viabilityMargin = Math.min(value - s.viableMin, s.viableMax - value) / half;
      if (viabilityMargin < 0) outsideViable.push(s.id);
      const predicted = this.pending.get(s.id) ?? null;
      const predictionError = predicted === null ? null : (value - predicted) / half;
      if (predictionError !== null) errs.push(predictionError);

      const m = this.models.get(s.id)!;
      const prevV = this.last?.values[s.id];
      if (this.learning && prevV !== undefined && this.last) {
        // Learn from the transition last → now.
        const x1 = s.setpoint - prevV, x2 = this.last.load;
        const yHat = prevV + m.a * x1 + m.b * x2;
        const e = value - yHat;
        const norm = 1e-9 + x1 * x1 + x2 * x2;
        m.a += (this.learningRate * e * x1) / norm;
        m.b += (this.learningRate * e * x2) / norm;
      }
      this.pending.set(s.id, value + m.a * (s.setpoint - value) + m.b * load);
      variables.push({ id: s.id, unit: s.unit, value, setpoint: s.setpoint, homeostaticError, viabilityMargin, predicted, predictionError });
    }

    this.last = { t: r.t, values: { ...r.values }, load };
    const homeostaticDrive = Math.min(1, Math.max(0, ...variables.map((v) => Math.abs(v.homeostaticError))));
    const rmsPredictionError = errs.length ? Math.sqrt(errs.reduce((a, e) => a + e * e, 0) / errs.length) : null;
    return { channel: 'interoceptive', t: r.t, clockDomain: r.clockDomain, origin: r.origin, variables, homeostaticDrive, rmsPredictionError, outsideViable, notes };
  }
}

/** Flattened homeostatic errors (input to RDMs and to the manipulation check). */
export function interoceptiveVector(frame: InteroceptiveFrame): number[] {
  return frame.variables.map((v) => v.homeostaticError);
}

/**
 * Physical signals claimed by both channels. A non-empty list means a
 * manipulation of one channel leaks into the other, and the kinaesthetic
 * withdrawal test cannot attribute an effect to either.
 */
export function checkChannelSeparation(somatosensorySources: readonly string[], interoceptiveSources: readonly string[]): string[] {
  const soma = new Set(somatosensorySources);
  return [...new Set(interoceptiveSources)].filter((s) => soma.has(s)).sort();
}
