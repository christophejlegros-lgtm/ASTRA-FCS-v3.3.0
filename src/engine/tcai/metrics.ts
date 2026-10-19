/**
 * ASTRA × the_consciousness_ai — Consciousness Metrics Suite
 * ═══════════════════════════════════════════════════════════
 * TypeScript port of:
 *   models/evaluation/gnw_metrics.py            → GNWMetrics
 *   models/evaluation/effective_information.py  → computeEffectiveInformation
 *   models/evaluation/phi_riiu.py               → RIIUPhi (covariance surrogate)
 *
 * ⚠ DISCLAIMER — Φ̃-RIIU here replaces the upstream learned low-rank
 *   surrogate (AutoPhiSurrogate, PyTorch) with an analytical covariance
 *   ratio over a sliding latent buffer. Effective Information is estimated
 *   from an OBSERVATIONAL transition matrix of a discretised trajectory, in
 *   the spirit of Hoel, Albantakis & Tononi (2013), doi:10.1073/pnas.1314922110
 *   — without interventions, and over the observed states only.
 *   All values are research proxies, not measurements of consciousness.
 *
 * v3.2.0 (consolidation, point 3). The legacy number-returning functions are
 * kept bit-identical; each now has an `evaluate…`/`estimate…` companion that
 * returns a MEASUREMENT STATUS, so that a null result, an absence of
 * measurement and an insufficient sample are no longer all reported as 0.
 * Construct, exact formula, invariances and domain of use of each proxy are
 * in ../proxy-cards.ts; the controls that check them are in
 * ../proxy-validation.ts.
 *
 * © 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
 * Upstream Python: © tlcdv/the_consciousness_ai (vendored in /python)
 */

import { type GNWMetricsReport } from './types.js';

// ── Measurement status (v3.2.0) ───────────────────────────────────

/**
 * What a proxy call actually returned. The five statuses are mutually
 * exclusive and are never collapsed into one another:
 *
 *  'value'               computed on an adequate sample;
 *  'null-result'         computed on an adequate sample AND indistinguishable
 *                        from the witness (null) control at the same sample
 *                        size — only assigned when a witness band is supplied;
 *  'not-measured'        the input channel carries no data at all;
 *  'insufficient-sample' too few samples or transitions for the estimate;
 *  'degenerate'          the formula is undefined or saturated on these
 *                        inputs (zero variance, single state, clamped value).
 */
export type MeasurementStatus = 'value' | 'null-result' | 'not-measured' | 'insufficient-sample' | 'degenerate';

export interface ProxyOutcome {
  proxyId: string;
  status: MeasurementStatus;
  /** Interpretable value; null unless status is 'value' or 'null-result'. */
  value: number | null;
  /** What the legacy API returns for the same input (0 when not computable). */
  legacy: number;
  n: number;
  nRequired: number;
  noteEn: string;
  noteFr: string;
}

/** Downgrade 'value' to 'null-result' when it lies inside a witness band [lo, hi]. */
export function classifyAgainstWitness(o: ProxyOutcome, band: { lo: number; hi: number } | null): ProxyOutcome {
  if (!band || o.status !== 'value' || o.value === null) return o;
  if (o.value >= band.lo && o.value <= band.hi) {
    return {
      ...o, status: 'null-result',
      noteEn: `${o.noteEn} Inside the witness band [${band.lo.toFixed(3)}, ${band.hi.toFixed(3)}] obtained on independent signals at the same sample size.`,
      noteFr: `${o.noteFr} Dans la bande témoin [${band.lo.toFixed(3)} ; ${band.hi.toFixed(3)}] obtenue sur des signaux indépendants à effectif égal.`,
    };
  }
  return o;
}

// ── GNW Metrics (gnw_metrics.py) ──────────────────────────────────

export class GNWMetrics {
  private ignitionEvents = 0;
  private ignitionSum = 0;
  private broadcastSteps = 0;
  private reuseEvents = 0;
  private steps = 0;
  private threshold: number;

  constructor(ignitionThreshold = 0.5) { this.threshold = ignitionThreshold; }

  /** Port of update_workspace_status(): one call per workspace step. */
  update(ignition: number, broadcastActive: boolean): void {
    this.steps++;
    this.ignitionSum += ignition;
    if (ignition >= this.threshold) this.ignitionEvents++;
    if (broadcastActive) this.broadcastSteps++;
  }

  /** Port of log_event_reuse(): broadcast content reused by another module. */
  logReuse(): void { this.reuseEvents++; }

  report(): GNWMetricsReport {
    return {
      ignitionEvents: this.ignitionEvents,
      ignitionRate: this.steps ? this.ignitionEvents / this.steps : 0,
      meanIgnition: this.steps ? this.ignitionSum / this.steps : 0,
      broadcastAvailability: this.steps ? this.broadcastSteps / this.steps : 0,
      reuseEvents: this.reuseEvents,
      steps: this.steps,
    };
  }

  reset(): void {
    this.ignitionEvents = 0; this.ignitionSum = 0;
    this.broadcastSteps = 0; this.reuseEvents = 0; this.steps = 0;
  }
}

// ── Effective Information (effective_information.py) ──────────────

/** Port of discretize_continuous(): scalar trajectory → state indices. */
export function discretizeContinuous(values: number[], numStates = 8): number[] {
  if (values.length === 0) return [];
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  return values.map((v) => Math.min(numStates - 1, Math.floor(((v - lo) / span) * numStates)));
}

function entropyRow(row: number[]): number {
  let h = 0;
  for (const p of row) if (p > 1e-12) h -= p * Math.log2(p);
  return h;
}

/**
 * Port of compute_effective_information():
 *   EI = H(⟨row⟩) − ⟨H(row)⟩  over the transition probability matrix
 * built from discretized state trajectories (Hoel-style determinism −
 * degeneracy balance). Returns bits ∈ [0, log2(numStates)].
 */
export function computeEffectiveInformation(stateTrajectory: number[], numStates = 8): number {
  if (stateTrajectory.length < 3) return 0;
  // _build_tpm
  const tpm: number[][] = Array.from({ length: numStates }, () => new Array(numStates).fill(0));
  for (let t = 0; t + 1 < stateTrajectory.length; t++) {
    const s = stateTrajectory[t], sn = stateTrajectory[t + 1];
    if (s >= 0 && s < numStates && sn >= 0 && sn < numStates) tpm[s][sn] += 1;
  }
  const validRows: number[][] = [];
  for (const row of tpm) {
    const total = row.reduce((a, v) => a + v, 0);
    if (total > 0) validRows.push(row.map((v) => v / total));
  }
  if (validRows.length === 0) return 0;

  const avgRow = new Array<number>(numStates).fill(0);
  for (const row of validRows) for (let j = 0; j < numStates; j++) avgRow[j] += row[j] / validRows.length;

  const hAvg = entropyRow(avgRow);
  const avgH = validRows.reduce((a, row) => a + entropyRow(row), 0) / validRows.length;
  return Math.max(0, hAvg - avgH);
}

export interface EIEstimate extends ProxyOutcome {
  /** Transitions counted (trajectory length − 1, in-range only). */
  transitions: number;
  /** States with at least one outgoing transition — the rows actually averaged. */
  observedStates: number;
  numStates: number;
  /** observedStates / numStates. Below 1, the estimand is restricted to the observed states. */
  coverage: number;
  /** Smallest outgoing-transition count among observed states. */
  minRowCount: number;
}

/**
 * Status-bearing companion of `computeEffectiveInformation` (v3.2.0).
 *
 * WHAT IS ESTIMATED. The transition matrix is built from an observed
 * trajectory, not from interventions; the average row is taken over the
 * OBSERVED states only, so a state never visited drops out of the estimand.
 * The result characterises this estimate of the observed transitions; it is
 * not an identification of the system's causal structure. The plug-in
 * entropy estimate is biased upward on short trajectories (an i.i.d. uniform
 * sequence returns EI > 0) — see the witness control in proxy-validation.ts.
 *
 * Status rules: fewer than 3 points → insufficient-sample; one observed state
 * → degenerate; any observed state with fewer than `minTransitionsPerState`
 * outgoing transitions → insufficient-sample (value withheld, legacy kept).
 */
export function estimateEffectiveInformation(
  stateTrajectory: number[],
  numStates = 8,
  minTransitionsPerState = 5,
): EIEstimate {
  const legacy = computeEffectiveInformation(stateTrajectory, numStates);
  const counts = new Array<number>(numStates).fill(0);
  let transitions = 0;
  for (let t = 0; t + 1 < stateTrajectory.length; t++) {
    const s = stateTrajectory[t], sn = stateTrajectory[t + 1];
    if (s >= 0 && s < numStates && sn >= 0 && sn < numStates) { counts[s]++; transitions++; }
  }
  const observed = counts.filter((c) => c > 0);
  const observedStates = observed.length;
  const minRowCount = observedStates > 0 ? Math.min(...observed) : 0;
  const base = {
    proxyId: 'tcai.effectiveInformation', legacy, n: transitions,
    nRequired: Math.max(2, minTransitionsPerState * Math.max(1, observedStates)),
    transitions, observedStates, numStates, coverage: observedStates / numStates, minRowCount,
  };
  if (stateTrajectory.length < 3) {
    return { ...base, status: 'insufficient-sample', value: null,
      noteEn: 'Fewer than three points: no transition matrix can be estimated.',
      noteFr: 'Moins de trois points : aucune matrice de transition n\'est estimable.' };
  }
  if (observedStates <= 1) {
    return { ...base, status: 'degenerate', value: null,
      noteEn: 'A single observed state: the estimate is trivially 0 and says nothing about transitions.',
      noteFr: 'Un seul état observé : l\'estimation vaut trivialement 0 et ne dit rien des transitions.' };
  }
  if (minRowCount < minTransitionsPerState) {
    return { ...base, status: 'insufficient-sample', value: null,
      noteEn: `An observed state has only ${minRowCount} outgoing transition(s) (< ${minTransitionsPerState}); its row is not estimated.`,
      noteFr: `Un état observé ne compte que ${minRowCount} transition(s) sortante(s) (< ${minTransitionsPerState}) ; sa ligne n'est pas estimée.` };
  }
  const restricted = observedStates < numStates;
  return { ...base, status: 'value', value: legacy,
    noteEn: restricted
      ? `Observational estimate over ${observedStates}/${numStates} observed states; unobserved states are omitted from the estimand.`
      : 'Observational estimate over all states; no intervention distribution is applied.',
    noteFr: restricted
      ? `Estimation observationnelle sur ${observedStates}/${numStates} états observés ; les états non observés sont omis de l'objet estimé.`
      : 'Estimation observationnelle sur tous les états ; aucune distribution d\'intervention n\'est appliquée.' };
}

// ── Φ̃-RIIU Surrogate (phi_riiu.py) ───────────────────────────────

export interface RIIUConfig {
  bufferSize: number;     // sliding window of latent vectors, default 64
  warmup: number;         // min samples before compute, default 8
}

export class RIIUPhi {
  readonly config: RIIUConfig;
  private buffer: number[][] = [];

  constructor(config?: Partial<RIIUConfig>) {
    this.config = { bufferSize: 64, warmup: 8, ...config };
  }

  /** Port of push(): append a latent vector z to the sliding buffer. */
  push(z: number[]): void {
    this.buffer.push([...z]);
    if (this.buffer.length > this.config.bufferSize) this.buffer.shift();
  }

  isWarm(): boolean { return this.buffer.length >= this.config.warmup; }
  size(): number { return this.buffer.length; }
  reset(): void { this.buffer = []; }

  /**
   * Port of compute_value(): an off-diagonal share of the latent covariance.
   *
   * EXACT FORMULA (v3.2.0 — the earlier comment spoke of covariance "energy",
   * but no square is taken). With C the population covariance (divisor n) of
   * the buffered latent vectors:
   *
   *     Φ̃ = Σ_{a≠b} |C_ab| / ( Σ_a |C_aa| + Σ_{a≠b} |C_ab| )
   *
   * an L1 share of absolute covariances, each off-diagonal term counted twice
   * (symmetrically). It describes statistical dependence among the latent
   * coordinates. It is NOT invariant to a rescaling of one coordinate (C_ab
   * scales with s_a·s_b, C_aa with s_a²), it rises under a pure common source
   * with no interaction among coordinates, and it is not an approximation of
   * any IIT quantity with a controlled error. Scale-invariant and
   * common-source-adjusted variants: `riiuCorrelationShare`, `riiuResidualShare`.
   * Returns ∈ [0, 1]; 0 when not warm or when total variance vanishes — use
   * `evaluate()` to tell those cases apart from a computed value.
   */
  computeValue(): number {
    if (!this.isWarm()) return 0;
    return riiuL1Share(this.buffer) ?? 0;
  }

  /** Status-bearing evaluation (v3.2.0): value, scale-invariant variant, and why a value is missing. */
  evaluate(witnessBand: { lo: number; hi: number } | null = null): ProxyOutcome & {
    correlationShare: number | null;
    residualShare: number | null;
    dims: number;
    zeroVarianceDims: number;
  } {
    const n = this.buffer.length;
    const dims = n > 0 ? this.buffer[0].length : 0;
    const legacy = this.computeValue();
    const common = { proxyId: 'tcai.phiRIIU', legacy, n, nRequired: this.config.warmup, dims };
    if (n === 0) {
      return { ...common, status: 'not-measured', value: null, correlationShare: null, residualShare: null, zeroVarianceDims: 0,
        noteEn: 'No latent vector has been pushed: nothing was measured.',
        noteFr: 'Aucun vecteur latent n\'a été fourni : rien n\'a été mesuré.' };
    }
    const zeroVarianceDims = covarianceMatrix(this.buffer).filter((row, a) => !(row[a] > 1e-12)).length;
    if (!this.isWarm()) {
      return { ...common, status: 'insufficient-sample', value: null, correlationShare: null, residualShare: null, zeroVarianceDims,
        noteEn: `${n} of ${this.config.warmup} samples required; the legacy value 0 is not a result.`,
        noteFr: `${n} échantillons sur les ${this.config.warmup} requis ; la valeur héritée 0 n'est pas un résultat.` };
    }
    const value = riiuL1Share(this.buffer);
    if (value === null || dims < 2) {
      return { ...common, status: 'degenerate', value: null, correlationShare: null, residualShare: null, zeroVarianceDims,
        noteEn: 'Total latent variance vanishes (or fewer than two coordinates): the ratio is undefined.',
        noteFr: 'La variance latente totale s\'annule (ou moins de deux coordonnées) : le rapport est indéfini.' };
    }
    const out = {
      ...common, status: 'value' as MeasurementStatus, value,
      correlationShare: riiuCorrelationShare(this.buffer),
      residualShare: riiuResidualShare(this.buffer),
      zeroVarianceDims,
      noteEn: 'L1 share of absolute covariances: statistical dependence among latent coordinates, scale-dependent.',
      noteFr: 'Part L1 des covariances absolues : dépendance statistique entre coordonnées latentes, sensible à l\'échelle.',
    };
    return { ...out, ...classifyAgainstWitness(out, witnessBand) };
  }

  /** Copy of the buffered latent vectors (for validation controls). */
  snapshot(): number[][] { return this.buffer.map((z) => [...z]); }
}

// ── Φ̃-RIIU formulae, exposed for validation (v3.2.0) ──────────────

/** Population covariance matrix (divisor n) of row vectors. */
export function covarianceMatrix(rows: readonly number[][]): number[][] {
  const n = rows.length;
  const d = n > 0 ? rows[0].length : 0;
  const mean = new Array<number>(d).fill(0);
  for (const z of rows) for (let j = 0; j < d; j++) mean[j] += z[j] / n;
  const c: number[][] = Array.from({ length: d }, () => new Array<number>(d).fill(0));
  for (let a = 0; a < d; a++) {
    for (let b = a; b < d; b++) {
      let s = 0;
      for (const z of rows) s += (z[a] - mean[a]) * (z[b] - mean[b]);
      s /= n;
      c[a][b] = s; c[b][a] = s;
    }
  }
  return c;
}

/**
 * The legacy Φ̃-RIIU formula: Σ_{a≠b}|C_ab| / (Σ_a|C_aa| + Σ_{a≠b}|C_ab|).
 * Accumulates in the same order as the v3.1.1 loop, so results are bit-identical.
 * Null when the total vanishes.
 */
export function riiuL1Share(rows: readonly number[][]): number | null {
  if (rows.length === 0) return null;
  const c = covarianceMatrix(rows);
  const d = c.length;
  let diag = 0, off = 0;
  for (let a = 0; a < d; a++) {
    for (let b = a; b < d; b++) {
      if (a === b) diag += Math.abs(c[a][b]);
      else off += 2 * Math.abs(c[a][b]);
    }
  }
  const total = diag + off;
  return total > 1e-12 ? off / total : null;
}

/**
 * Scale-invariant variant: the same share computed on the CORRELATION matrix
 * of the coordinates with non-zero variance, Σ_{a≠b}|r_ab| / (k + Σ_{a≠b}|r_ab|).
 * Invariant to any non-zero rescaling, translation and permutation of the
 * coordinates. Null when fewer than two coordinates vary.
 */
export function riiuCorrelationShare(rows: readonly number[][]): number | null {
  if (rows.length < 2) return null;
  const c = covarianceMatrix(rows);
  const keep = c.map((_row, a) => a).filter((a) => c[a][a] > 1e-12);
  const k = keep.length;
  if (k < 2) return null;
  let off = 0;
  for (const a of keep) for (const b of keep) if (a !== b) off += Math.abs(c[a][b]) / Math.sqrt(c[a][a] * c[b][b]);
  return off / (k + off);
}

/**
 * Common-source control: the correlation share after projecting out the
 * leading principal component of the correlation matrix. Under a single
 * shared driver with no interaction among coordinates, the residual share
 * falls back TOWARDS — not exactly to — the witness level: the projection
 * itself induces small negative correlations, so the right reference is the
 * single-source residual band at the same n and d (proxy_validate, R3/R4),
 * not the raw witness band. Dependence that one common factor does not
 * explain survives (R4). A residual inside the single-source band is
 * compatible with one common source; it does not show that none acted.
 */
export function riiuResidualShare(rows: readonly number[][]): number | null {
  const n = rows.length;
  if (n < 3) return null;
  const c = covarianceMatrix(rows);
  const keep = c.map((_row, a) => a).filter((a) => c[a][a] > 1e-12);
  const k = keep.length;
  if (k < 3) return null;
  const d = rows[0].length;
  const mean = new Array<number>(d).fill(0);
  for (const z of rows) for (let j = 0; j < d; j++) mean[j] += z[j] / n;
  const sd = keep.map((a) => Math.sqrt(c[a][a]));
  const std = rows.map((z) => keep.map((a, i) => (z[a] - mean[a]) / sd[i]));
  const r = covarianceMatrix(std);
  // Leading eigenvector by power iteration from a deterministic start.
  let v = new Array<number>(k).fill(1 / Math.sqrt(k));
  for (let it = 0; it < 200; it++) {
    const w = r.map((row) => row.reduce((s, x, j) => s + x * v[j], 0));
    const norm = Math.sqrt(w.reduce((s, x) => s + x * x, 0));
    if (norm < 1e-15) return null;
    v = w.map((x) => x / norm);
  }
  const residual = std.map((z) => {
    const score = z.reduce((s, x, j) => s + x * v[j], 0);
    return z.map((x, j) => x - score * v[j]);
  });
  return riiuCorrelationShare(residual);
}
