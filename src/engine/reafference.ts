/**
 * ASTRA — Efference copy, forward model and comparator (v3.3.0-rc.5)
 * ═══════════════════════════════════════════════════════════════════
 * Document I §3.2 states the functional constraint of level II: co-availability
 * of efference and reafference — "le corps est le seul objet dont le système
 * possède simultanément la commande et le retour". Document I §5.2: the system
 * predicts the reafference of a command, compares it with the effective
 * reafference, and the residual separates self-produced from imposed change
 * (the reafference principle of von Holst & Mittelstaedt, 1950; forward models
 * in Wolpert, Ghahramani & Jordan, 1995).
 *
 * This module implements that comparator for any reafferent vector (the
 * somatosensory channel's `afferentVector`, or raw signals), and an
 * OPERATIONAL closure check in the sense of criterion M3 (distinctions (a) and
 * (b) of level II). It establishes nothing about distinction (c).
 *
 *   forward model   ŷ_t = W · [1, u_t, y_{t−1}]   (normalised LMS, persistence prior)
 *   comparator      e_t = y_t − ŷ_t ; rms(e_t) ; match = exp(−(rms/σ)²)
 *   residual        e_t is the exafference estimate: change the command does not predict
 *
 * PAIRING. A command issued at t_e is compared with the return the system holds
 * at t_e + L̂, where L̂ is the command→return latency the system expects — the
 * latest sample delivered by that deadline. L̂ is calibrated on a CONGRUENT
 * block and then frozen: estimating it on a delayed stream would absorb the
 * very delay under test. (Pairing each command with "the next sample" would
 * do the same: a uniform delay would only lengthen the latency and leave the
 * content aligned, so the comparator would never see it.)
 *
 * The comparator statistic is a property of a predictor; it is not a sense of
 * agency, and nothing here quantifies one (FCS prohibition 1).
 *
 * © 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
 */

import type { Origin } from './somatosensory.js';

export interface EfferenceCopy {
  /** Time the command was issued (ms), on `clockDomain`. */
  t: number;
  clockDomain: string;
  origin: Origin;
  /** Command vector (e.g. joint targets or torques), in the units the bridge declares. */
  command: number[];
  commandId?: string;
}

export interface ReafferenceSample {
  /** Delivery time (ms) on `clockDomain`: acquisition time plus any imposed delay. */
  t: number;
  clockDomain: string;
  /** Reafferent features (e.g. `afferentVector(frame)`). */
  features: number[];
  /** Acquisition time before an imposed delay, when a manipulation set one. */
  generatedAt?: number;
}

export interface ComparatorConfig {
  /** NLMS step size in (0, 2). */
  learningRate: number;
  /** Tolerance σ of the match statistic, in feature units (activations ∈ [0, 1]). */
  tolerance: number;
  /** A return older than this at the deadline is not paired (ms). */
  pairingWindowMs: number;
  /**
   * Expected command→return latency L̂ (ms), calibrated on a congruent block.
   * null = estimate it from the stream itself (only for congruent streams;
   * reported as `latencySource: 'self-estimated'`).
   */
  expectedLatencyMs: number | null;
}

export const DEFAULT_COMPARATOR_CONFIG: ComparatorConfig = Object.freeze({
  learningRate: 0.5,
  tolerance: 0.05,
  pairingWindowMs: 250,
  expectedLatencyMs: null,
});

export interface ComparatorStep {
  t: number;
  /** Delivery time of the paired return minus command time (ms). */
  latencyMs: number;
  /** Acquisition time of the paired return minus command time (ms), when known. */
  generationLagMs: number | null;
  predicted: number[];
  actual: number[];
  error: number[];
  /** Root-mean-square prediction error over features. */
  rmsError: number;
  /** RMS error of the persistence baseline ŷ = y_{t−1}. */
  persistenceRmsError: number;
  /** exp(−(rms/σ)²) ∈ (0, 1]: agreement between predicted and delivered return. */
  comparatorMatch: number;
}

const rms = (v: readonly number[]) => Math.sqrt(v.reduce((s, x) => s + x * x, 0) / Math.max(1, v.length));

function assertFiniteVector(v: unknown, what: string): asserts v is number[] {
  if (!Array.isArray(v) || v.some((x) => typeof x !== 'number' || !Number.isFinite(x))) {
    throw new RangeError(`${what} must be an array of finite numbers`);
  }
}

const median = (v: number[]) => {
  if (!v.length) return null;
  const s = [...v].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : 0.5 * (s[m - 1] + s[m]);
};

/** Normalised-LMS linear forward model with a persistence prior (W starts as "return = previous return"). */
export class ForwardModel {
  private W: number[][];
  constructor(readonly commandDim: number, readonly featureDim: number) {
    if (!(commandDim >= 1 && featureDim >= 1)) throw new RangeError('ForwardModel: dimensions must be ≥ 1');
    const inDim = 1 + commandDim + featureDim;
    this.W = Array.from({ length: featureDim }, (_, i) => {
      const row = new Array<number>(inDim).fill(0);
      row[1 + commandDim + i] = 1;
      return row;
    });
  }

  private phi(u: readonly number[], yPrev: readonly number[]): number[] {
    return [1, ...u, ...yPrev];
  }

  predict(u: readonly number[], yPrev: readonly number[]): number[] {
    const x = this.phi(u, yPrev);
    return this.W.map((row) => row.reduce((s, w, k) => s + w * x[k], 0));
  }

  /** One NLMS update toward the delivered return; returns the a-priori error. */
  update(u: readonly number[], yPrev: readonly number[], y: readonly number[], mu: number): number[] {
    const x = this.phi(u, yPrev);
    const yHat = this.predict(u, yPrev);
    const e = y.map((v, i) => v - yHat[i]);
    const norm = 1e-6 + x.reduce((s, v) => s + v * v, 0);
    for (let i = 0; i < this.W.length; i++) {
      const g = (mu * e[i]) / norm;
      for (let k = 0; k < x.length; k++) this.W[i][k] += g * x[k];
    }
    return e;
  }

  weights(): number[][] { return this.W.map((r) => r.slice()); }
}

function groupByDomain(reafference: readonly ReafferenceSample[]): Map<string, ReafferenceSample[]> {
  const byDomain = new Map<string, ReafferenceSample[]>();
  for (const r of reafference) {
    if (!byDomain.has(r.clockDomain)) byDomain.set(r.clockDomain, []);
    byDomain.get(r.clockDomain)!.push(r);
  }
  for (const list of byDomain.values()) list.sort((a, b) => a.t - b.t);
  return byDomain;
}

/**
 * Command→return latency of a CONGRUENT stream: median, over commands, of the
 * delay to the first same-domain return delivered at or after the command.
 */
export function estimateLatency(efference: readonly EfferenceCopy[], reafference: readonly ReafferenceSample[]): number | null {
  const byDomain = groupByDomain(reafference);
  const lags: number[] = [];
  for (const e of efference) {
    const R = byDomain.get(e.clockDomain) ?? [];
    const r = R.find((x) => x.t >= e.t);
    if (r) lags.push(r.t - e.t);
  }
  return median(lags);
}

export interface PairingResult {
  pairs: Array<{ e: EfferenceCopy; r: ReafferenceSample }>;
  unpaired: number;
  /** Return samples on a clock domain no command uses. */
  crossDomain: number;
  /** Pairs whose return had already been used by an earlier command (no newer sample had arrived). */
  reused: number;
}

/**
 * Pairs each command with the latest same-domain return delivered by
 * t_e + expectedLatencyMs and not older than the pairing window.
 */
export function pairStreams(
  efference: readonly EfferenceCopy[],
  reafference: readonly ReafferenceSample[],
  expectedLatencyMs: number,
  pairingWindowMs = DEFAULT_COMPARATOR_CONFIG.pairingWindowMs,
): PairingResult {
  if (!(Number.isFinite(expectedLatencyMs) && expectedLatencyMs >= 0)) throw new RangeError('expectedLatencyMs must be finite and ≥ 0');
  const commandDomains = new Set(efference.map((e) => e.clockDomain));
  const crossDomain = reafference.filter((r) => !commandDomains.has(r.clockDomain)).length;
  const byDomain = groupByDomain(reafference);
  const used = new Set<ReafferenceSample>();
  const pairs: Array<{ e: EfferenceCopy; r: ReafferenceSample }> = [];
  let unpaired = 0, reused = 0;
  for (const e of [...efference].sort((a, b) => a.t - b.t)) {
    const R = byDomain.get(e.clockDomain) ?? [];
    const deadline = e.t + expectedLatencyMs;
    let best: ReafferenceSample | null = null;
    for (const r of R) { if (r.t <= deadline) best = r; else break; }
    if (best && deadline - best.t <= pairingWindowMs) {
      if (used.has(best)) reused++;
      used.add(best);
      pairs.push({ e, r: best });
    } else unpaired++;
  }
  return { pairs, unpaired, crossDomain, reused };
}

/** Efference–reafference comparator over a stream of paired samples. */
export class ReafferenceComparator {
  readonly config: ComparatorConfig;
  private model: ForwardModel | null = null;
  private yPrev: number[] | null = null;
  private learning = true;
  private clock: string | null = null;

  constructor(config: Partial<ComparatorConfig> = {}) {
    this.config = { ...DEFAULT_COMPARATOR_CONFIG, ...config };
    if (!(this.config.learningRate > 0 && this.config.learningRate < 2)) throw new RangeError('learningRate must lie in (0, 2)');
    if (!(this.config.tolerance > 0)) throw new RangeError('tolerance must be > 0');
    if (this.config.expectedLatencyMs !== null && !(this.config.expectedLatencyMs >= 0)) throw new RangeError('expectedLatencyMs must be ≥ 0');
  }

  /** Freeze (false) or resume (true) learning — frozen during test blocks, so the model cannot adapt to a manipulation. */
  setLearning(on: boolean): void { this.learning = on; }
  isLearning(): boolean { return this.learning; }

  /** Fix the expected latency L̂ (after a congruent calibration block). */
  setExpectedLatency(ms: number): void {
    if (!(Number.isFinite(ms) && ms >= 0)) throw new RangeError('expected latency must be finite and ≥ 0');
    this.config.expectedLatencyMs = ms;
  }

  reset(): void { this.model = null; this.yPrev = null; this.clock = null; this.learning = true; }

  step(e: EfferenceCopy, r: ReafferenceSample): ComparatorStep {
    assertFiniteVector(e.command, 'efference.command');
    assertFiniteVector(r.features, 'reafference.features');
    if (e.clockDomain !== r.clockDomain) throw new RangeError(`clock domains differ (${e.clockDomain} ≠ ${r.clockDomain}): latency is undefined`);
    if (this.clock !== null && this.clock !== e.clockDomain) throw new RangeError(`comparator bound to clock domain ${this.clock}`);
    const latencyMs = r.t - e.t;
    if (Math.abs(latencyMs) > this.config.pairingWindowMs) throw new RangeError(`return outside the pairing window (${latencyMs} ms)`);
    if (!this.model) {
      this.model = new ForwardModel(e.command.length, r.features.length);
      this.clock = e.clockDomain;
    }
    if (e.command.length !== this.model.commandDim || r.features.length !== this.model.featureDim) {
      throw new RangeError('command or feature dimension changed within a stream');
    }
    const yPrev = this.yPrev ?? r.features.slice();
    const predicted = this.model.predict(e.command, yPrev);
    const error = r.features.map((v, i) => v - predicted[i]);
    if (this.learning) this.model.update(e.command, yPrev, r.features, this.config.learningRate);
    const persistenceRmsError = rms(r.features.map((v, i) => v - yPrev[i]));
    this.yPrev = r.features.slice();
    const rmsError = rms(error);
    return {
      t: r.t, latencyMs, generationLagMs: r.generatedAt !== undefined ? r.generatedAt - e.t : null,
      predicted, actual: r.features.slice(), error, rmsError, persistenceRmsError,
      comparatorMatch: Math.exp(-((rmsError / this.config.tolerance) ** 2)),
    };
  }

  /** Runs a whole stream; returns the steps and the pairing bookkeeping. */
  run(efference: readonly EfferenceCopy[], reafference: readonly ReafferenceSample[]):
    PairingResult & { steps: ComparatorStep[]; expectedLatencyMs: number | null; latencySource: 'calibrated' | 'self-estimated' } {
    const calibrated = this.config.expectedLatencyMs !== null;
    const L = calibrated ? this.config.expectedLatencyMs : estimateLatency(efference, reafference);
    if (L === null) {
      return { pairs: [], unpaired: efference.length, crossDomain: reafference.length, reused: 0, steps: [], expectedLatencyMs: null, latencySource: 'self-estimated' };
    }
    const pairing = pairStreams(efference, reafference, L, this.config.pairingWindowMs);
    const steps = pairing.pairs.map(({ e, r }) => this.step(e, r));
    return { ...pairing, steps, expectedLatencyMs: L, latencySource: calibrated ? 'calibrated' : 'self-estimated' };
  }
}

export interface ClosureCriteria {
  /** Minimum share of commands that receive a return. */
  minPairedFraction: number;
  /** Maximum median command→return latency (ms). */
  maxMedianLatencyMs: number;
  /**
   * Minimum gain of command informativeness over the surrogate in which the
   * same commands are circularly shifted by half the stream (autocorrelation
   * kept, correspondence with the returns destroyed). Below it the return does
   * not depend on THIS command, and the system does not hold command and return
   * of the same variable.
   */
  minInformativenessGain: number;
}

/** Design defaults of the check, declared; a preregistration may set others. */
export const DEFAULT_CLOSURE_CRITERIA: ClosureCriteria = Object.freeze({
  minPairedFraction: 0.9,
  maxMedianLatencyMs: 100,
  minInformativenessGain: 0.05,
});

export interface ClosureAssessment {
  closed: boolean;
  criterion: 'M3 operational closure (level II, distinctions a–b)';
  pairedFraction: number;
  crossDomainSamples: number;
  reusedReturns: number;
  medianLatencyMs: number | null;
  /** 1 − mse(model)/mse(persistence) over the second half of the stream (after learning). */
  commandInformativeness: number | null;
  /** The same statistic with circularly shifted commands (surrogate control). */
  surrogateInformativeness: number | null;
  failures: string[];
  criteria: ClosureCriteria;
  scopeNote: string;
}

function informativeness(steps: ComparatorStep[]): number | null {
  const late = steps.slice(Math.floor(steps.length / 2));
  if (late.length < 3) return null;
  const mse = late.reduce((s, x) => s + x.rmsError ** 2, 0);
  const mseP = late.reduce((s, x) => s + x.persistenceRmsError ** 2, 0);
  return mseP > 0 ? 1 - mse / mseP : null;
}

/**
 * Operational closure check (criterion M3, distinctions (a) and (b) of level II)
 * on a congruent stream. Runs FRESH comparators, so the caller's is untouched.
 */
export function assessClosure(
  efference: readonly EfferenceCopy[],
  reafference: readonly ReafferenceSample[],
  criteria: Partial<ClosureCriteria> = {},
  comparatorConfig: Partial<ComparatorConfig> = {},
): ClosureAssessment {
  const c = { ...DEFAULT_CLOSURE_CRITERIA, ...criteria };
  const { steps, unpaired, crossDomain, reused } = new ReafferenceComparator(comparatorConfig).run(efference, reafference);
  const sorted = [...efference].sort((a, b) => a.t - b.t);
  const half = Math.floor(sorted.length / 2);
  const surrogate = sorted.map((e, i) => ({ ...e, command: sorted[(i + half) % sorted.length].command }));
  const surrogateSteps = new ReafferenceComparator(comparatorConfig).run(surrogate, reafference).steps;
  const total = steps.length + unpaired;
  const pairedFraction = total ? steps.length / total : 0;
  const medianLatencyMs = median(steps.map((s) => s.latencyMs));
  const commandInformativeness = informativeness(steps);
  const surrogateInformativeness = informativeness(surrogateSteps);
  const failures: string[] = [];
  if (!steps.length) failures.push('no command received a return within the pairing window');
  if (pairedFraction < c.minPairedFraction) failures.push(`paired fraction ${pairedFraction.toFixed(3)} < ${c.minPairedFraction}`);
  if (crossDomain > 0) failures.push(`${crossDomain} return sample(s) on a clock domain no command uses`);
  if (medianLatencyMs !== null && medianLatencyMs > c.maxMedianLatencyMs) failures.push(`median latency ${medianLatencyMs} ms > ${c.maxMedianLatencyMs} ms`);
  if (commandInformativeness === null || surrogateInformativeness === null) {
    failures.push('too few paired steps to assess whether the return depends on the command');
  } else if (commandInformativeness - surrogateInformativeness < c.minInformativenessGain) {
    failures.push(`informativeness ${commandInformativeness.toFixed(3)} vs surrogate ${surrogateInformativeness.toFixed(3)}: ` +
      `gain < ${c.minInformativenessGain}, the return does not depend on the command`);
  }
  return {
    closed: failures.length === 0,
    criterion: 'M3 operational closure (level II, distinctions a–b)',
    pairedFraction, crossDomainSamples: crossDomain, reusedReturns: reused, medianLatencyMs,
    commandInformativeness, surrogateInformativeness, failures, criteria: c,
    scopeNote: 'Operational closure of a command–return loop: a boundary, not a magnitude. It bears on distinctions (a) and (b) ' +
      'of level II and establishes nothing about distinction (c).',
  };
}
