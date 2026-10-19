/**
 * ASTRA ACM — Artificial Consciousness Module
 * © 2026 Christophe Jean Legros — Geneva
 *
 * Composite engineering index: ACM = α·Φ̃ + β·GW̃ + γ·PAD̃
 *
 * ⚠ v3.1.1 — NO CONSCIOUSNESS SCALE. Versions ≤ 3.1.0 binned the composite
 * into six labels ABSENT / MINIMAL / PARTIAL / MODERATE / HIGH / FULL. That
 * scale quantified a degree of consciousness (FCS prohibition 1) by binning a
 * weighted sum of heterogeneous proxies (prohibition 4). It is withdrawn: no
 * class, label or level is computed. The composite survives only as a
 * declared engineering index of the simulation, with conventional weights and
 * no common scale between its three terms; it orders nothing about experience
 * and must not be compared across systems.
 *
 * ⚠ IMPORTANT: The metrics computed here are computational PROXIES
 * inspired by the following frameworks, NOT faithful implementations:
 *
 *   - IIT (Tononi): Φ̃ is an integration proxy based on network statistics.
 *     True IIT Φ requires exponential-time partition search (NP-hard).
 *   - GWT (Baars): GW̃ is a synchrony proxy based on cross-layer
 *     firing rate variance. True GWT involves competitive coalition
 *     dynamics and ignition thresholds not modelled here.
 *   - PAD (Mehrabian): Only the Arousal dimension is approximated
 *     via excitation metrics. Pleasure and Dominance are not computed.
 *
 * These proxies serve as exploratory heuristics for the ASTRA research
 * pipeline. They should not be cited as measurements of consciousness.
 *
 * v3.2.0 (consolidation, point 3). Every component now carries a measurement
 * status, its raw (pre-clamp) value, a saturation flag and the provenance of
 * each input; the proxies read the SNN the server actually steps; GW̃ reads
 * the layer rates of that SNN instead of a state field nothing wrote.
 * Construct cards: ./proxy-cards.ts · controls: ./proxy-validation.ts.
 */

import { state } from './state.js';
import { snnEngine, type SNNEngine } from './snn.js';
import type { MeasurementStatus } from './tcai/metrics.js';
import type { Provenance } from './tcai/phenomenal-guard.js';

// ── Types ─────────────────────────────────────────────────────────

export interface ACMWeights {
  alpha: number;  // integration proxy weight
  beta: number;   // broadcast proxy weight
  gamma: number;  // arousal proxy weight
}

/** One input of a proxy, with where it comes from (v3.2.0). */
export interface ProxyInput {
  name: string;
  value: number | null;
  provenance: Provenance;
  noteEn: string;
}

export interface ACMComponent {
  value: number;
  weight: number;
  basis: string;
  /** v3.2.0 — what the value is: a computed value, an absence of measurement, or a degenerate (clamped) output. */
  status: MeasurementStatus;
  /** Value before clamping to [0, 1]. */
  raw: number;
  /** True when the clamp is active: the reported value then carries no information about further change. */
  saturated: boolean;
  inputs: ProxyInput[];
}

export interface ACMResult {
  compositeScore: number;
  components: {
    integrationProxy: ACMComponent;
    broadcastProxy:   ACMComponent;
    arousalProxy:     ACMComponent;
  };
  confidence: number;
  totalCycles: number;
  formula: string;
  /** Declared status of `compositeScore` — carried in every payload. */
  aggregationStatus: string;
  /** v3.2.0 — status of the composite, inherited from its components. */
  compositeStatus: MeasurementStatus;
  measurementNoteEn: string;
  /** v3.2.0 — `confidence` is an inter-proxy agreement heuristic, not a statistical confidence. */
  confidenceStatus: string;
}

/** Status line attached to every composite, so the caveat travels with the number. */
export const ACM_AGGREGATION_STATUS =
  'Engineering index of the simulation: a conventionally weighted sum of three heterogeneous proxies ' +
  'lacking a common scale. Not a degree of consciousness (FCS prohibition 1), not admissible as a ranking ' +
  'across systems (prohibition 4); no class or label is derived from it.';

export const ACM_CONFIDENCE_STATUS =
  'Heuristic, not a statistical confidence: 0.7 × (1 − 2·SD of the three proxies) + 0.3 × (share of proxies ' +
  'above 0.01). It rewards agreement between quantities that share no scale, so it carries no coverage or ' +
  'error-rate interpretation.';

// ── Default Weights ───────────────────────────────────────────────

const DEFAULT_WEIGHTS: ACMWeights = {
  alpha: 0.40,
  beta: 0.35,
  gamma: 0.25,
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

// ── Pure proxy functions (v3.2.0) ─────────────────────────────────
//
// Up to v3.1.1 the three proxies read two different networks: Φ̃ read the
// module-level singleton SNN, which the `snn_step` tool never advanced (the
// server stepped its own instance), and GW̃ read `state.loihi.ly`, which no
// engine code ever wrote — so GW̃ was 0 in every session, an absence of
// measurement reported as a value. The functions below take the engine they
// read as an argument, and the server now steps that same engine.

/**
 * Φ̃ (ACM) — formula unchanged since v2:
 *   raw = 0.5·activeFraction + 2.0·meanRate[Hz] + 0.3·weightCV,  value = clamp(raw, 0, 1).
 * KNOWN DEFECT, measured by proxy_validate: the second term adds a rate in Hz
 * to dimensionless terms, and weightCV is the coefficient of variation of
 * sign-mixed weights whose mean is near zero. The clamp is active in the
 * default configuration, where the value is reported as 'degenerate'.
 */
export function integrationProxyOf(engine: SNNEngine): Omit<ACMComponent, 'weight' | 'basis'> {
  const stats = engine.stats();
  const { active, mean } = stats.firingRateStats;
  const wsArr = engine.getWeightStats();
  const activeFraction = active / stats.neurons;
  const avgStd = wsArr.length > 0 ? wsArr.reduce((s, w) => s + w.std, 0) / wsArr.length : 0;
  const avgMean = wsArr.length > 0 ? wsArr.reduce((s, w) => s + w.mean, 0) / wsArr.length : 0.001;
  const weightComplexity = avgStd / (avgMean + 0.001);
  const raw = activeFraction * 0.5 + mean * 2.0 + weightComplexity * 0.3;
  const value = clamp01(raw);
  const saturated = raw > 1 || raw < 0;
  const stepped = engine.time > 0;
  return {
    value, raw, saturated,
    status: !stepped ? 'not-measured' : saturated ? 'degenerate' : 'value',
    inputs: [
      { name: 'activeFraction', value: activeFraction, provenance: 'endogenous', noteEn: 'Share of neurons with rate > 0.1 Hz in the stepped SNN.' },
      { name: 'meanRateHz', value: mean, provenance: 'endogenous', noteEn: 'Mean EMA firing rate, Hz — enters the sum without normalisation (unit defect).' },
      { name: 'weightCV', value: weightComplexity, provenance: 'endogenous', noteEn: 'Mean per-layer SD / (mean + 0.001) of synaptic weights; unbounded when the mean is near 0.' },
    ],
  };
}

/**
 * GW̃ (ACM): value = max(0, 1 − 0.5·CV(layer rates)) · min(1, mean layer rate / 50 Hz).
 * Uniformity of mean firing rate across layers. Independent, noise-driven
 * neurons satisfy it as well as broadcasting ones (see the connectivity-
 * ablation control): it is not a model of competition, ignition or broadcast.
 */
export function broadcastProxyOf(engine: SNNEngine): Omit<ACMComponent, 'weight' | 'basis'> {
  const byLayer = engine.layerRates();
  const rates = Object.values(byLayer);
  const stepped = engine.time > 0;
  const inputs: ProxyInput[] = Object.entries(byLayer).map(([name, v]) => ({
    name: `layerRateHz.${name}`, value: v, provenance: 'endogenous' as Provenance,
    noteEn: 'Mean EMA firing rate of the layer in the stepped SNN.' }));
  const mean = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
  if (!stepped) return { value: 0, raw: 0, saturated: false, status: 'not-measured', inputs };
  if (mean < 0.01) return { value: 0, raw: 0, saturated: false, status: 'value', inputs };
  const variance = rates.reduce((s, v) => s + (v - mean) ** 2, 0) / rates.length;
  const cv = Math.sqrt(variance) / mean;
  const raw = Math.max(0, 1 - cv * 0.5) * Math.min(1, mean / 50);
  return { value: clamp01(raw), raw, saturated: raw > 1, status: 'value', inputs };
}

/**
 * PAD̃ (ACM), arousal only: 0.5·min(1, spk/2000) + 0.3·min(1, bio/100) + 0.2·min(1, nrg/5).
 * `loihi.spk` is written by no engine (it is unavailable unless an operator
 * sets it); `loihi.bio` and `loihi.nrg` are synthetic drifts of the
 * background loop (simulation.ts). None of the three is a measurement.
 */
export function arousalProxyOf(): Omit<ACMComponent, 'weight' | 'basis'> {
  const s = state.snapshot;
  const prov = (v: number, ifSet: Provenance): Provenance => (v > 0 ? ifSet : 'unavailable');
  const inputs: ProxyInput[] = [
    { name: 'loihi.spk', value: s.loihi.spk || null, provenance: prov(s.loihi.spk, 'prior'),
      noteEn: 'Written by no engine code; non-zero only when set by an operator (set_parameter) — a configured value, not an estimate.' },
    { name: 'loihi.bio', value: s.loihi.bio || null, provenance: prov(s.loihi.bio, 'endogenous'),
      noteEn: 'Synthetic bio-coupling drift generated by the background simulation loop.' },
    { name: 'loihi.nrg', value: s.loihi.nrg || null, provenance: prov(s.loihi.nrg, 'endogenous'),
      noteEn: 'Synthetic energy drift generated by the background simulation loop.' },
  ];
  const spikeNorm = Math.min(1, s.loihi.spk / 2000);
  const bioNorm = Math.min(1, s.loihi.bio / 100);
  const nrgNorm = Math.min(1, s.loihi.nrg / 5);
  const raw = spikeNorm * 0.5 + bioNorm * 0.3 + nrgNorm * 0.2;
  const allUnavailable = inputs.every((i) => i.provenance === 'unavailable');
  return { value: clamp01(raw), raw, saturated: raw > 1, status: allUnavailable ? 'not-measured' : 'value', inputs };
}

/**
 * Publish the stepped SNN's per-layer rates to `loihi.ly` for telemetry
 * (get_metrics, export_snapshot). Output only: no proxy reads it back.
 */
export function publishSnnTelemetry(engine: SNNEngine): void {
  const rates = Object.values(engine.layerRates());
  if (rates.length === 0) return;
  const r = (x: number | undefined) => +(x ?? 0).toFixed(3);
  state.set('loihi.ly', { i: r(rates[0]), h1: r(rates[1]), h2: r(rates[rates.length - 2]), o: r(rates[rates.length - 1]) });
}

// ── ACM Engine ────────────────────────────────────────────────────

export class ACMModule {
  private weights: ACMWeights;
  private cycles: number = 0;
  private readonly engineSource: () => SNNEngine;

  /**
   * @param engineSource the SNN the proxies read. Defaults to the shared
   *        production engine (`snnEngine.engine`), which the MCP server's
   *        `snn_step`, the background loop and the TCAI production loop all
   *        advance since v3.2.0.
   */
  constructor(weights?: Partial<ACMWeights>, engineSource: () => SNNEngine = () => snnEngine.engine) {
    this.weights = { ...DEFAULT_WEIGHTS, ...weights };
    this.engineSource = engineSource;
  }

  /** Φ̃ (ACM) value — see `integrationProxyOf` for the formula and its known defect. NOT IIT Φ. */
  computeIntegrationProxy(): number { return integrationProxyOf(this.engineSource()).value; }

  /** GW̃ (ACM) value — uniformity of layer rates; NOT a GWT implementation. */
  computeBroadcastProxy(): number { return broadcastProxyOf(this.engineSource()).value; }

  /** PAD̃ (ACM) value — arousal only; Pleasure and Dominance are not computed. */
  computeArousalProxy(): number { return arousalProxyOf().value; }

  /**
   * Run a full ACM assessment cycle.
   */
  assess(customWeights?: Partial<ACMWeights>): ACMResult {
    const w = { ...this.weights, ...customWeights };
    this.cycles++;

    const engine = this.engineSource();
    publishSnnTelemetry(engine);
    const integ = integrationProxyOf(engine);
    const bcast = broadcastProxyOf(engine);
    const arous = arousalProxyOf();
    const integration = integ.value;
    const broadcast = bcast.value;
    const arousal = arous.value;

    const score = w.alpha * integration + w.beta * broadcast + w.gamma * arousal;
    const confidence = this.computeConfidence(integration, broadcast, arousal);

    // Update state store
    state.set('acm.integrationProxy', +integration.toFixed(4));
    state.set('acm.broadcastProxy', +broadcast.toFixed(4));
    state.set('acm.arousalProxy', +arousal.toFixed(4));
    state.set('acm.compositeScore', +score.toFixed(4));
    state.set('acm.confidence', +confidence.toFixed(3));
    state.set('acm.cycles', this.cycles);

    const statuses = [integ.status, bcast.status, arous.status];
    const flawed = statuses.filter((x) => x === 'not-measured' || x === 'degenerate').length;
    const compositeStatus: MeasurementStatus =
      statuses.every((x) => x === 'not-measured') ? 'not-measured' : flawed > 0 ? 'degenerate' : 'value';
    const round = (c: Omit<ACMComponent, 'weight' | 'basis'>) => ({ ...c, value: +c.value.toFixed(4), raw: +c.raw.toFixed(4) });

    return {
      compositeScore: +score.toFixed(4),
      components: {
        integrationProxy: {
          ...round(integ),
          weight: w.alpha,
          basis: 'Active fraction + mean firing rate + synaptic heterogeneity (IIT-inspired proxy, NOT Φ)',
        },
        broadcastProxy: {
          ...round(bcast),
          weight: w.beta,
          basis: 'Cross-layer firing rate uniformity (GWT-inspired proxy, NOT ignition model)',
        },
        arousalProxy: {
          ...round(arous),
          weight: w.gamma,
          basis: 'Spike rate + bio coupling + energy (Arousal only, Pleasure/Dominance omitted)',
        },
      },
      confidence: +(confidence * 100).toFixed(1),
      totalCycles: this.cycles,
      formula: `${w.alpha}×Φ̃ + ${w.beta}×GW̃ + ${w.gamma}×PAD̃ = ${score.toFixed(4)}`,
      aggregationStatus: ACM_AGGREGATION_STATUS,
      compositeStatus,
      measurementNoteEn: flawed > 0
        ? `${flawed} of 3 components are not measured or degenerate (statuses: ${statuses.join(', ')}); the composite inherits it. ` +
          'Construct, formula and controls: astra://proxies/cards and the proxy_validate tool.'
        : 'All three components computed. Construct, formula and controls: astra://proxies/cards and the proxy_validate tool.',
      confidenceStatus: ACM_CONFIDENCE_STATUS,
    };
  }

  // ── Confidence ──────────────────────────────────────────────────

  /** Inter-proxy agreement heuristic — see ACM_CONFIDENCE_STATUS. Not a statistical confidence. */
  private computeConfidence(phi: number, gw: number, pad: number): number {
    const mean = (phi + gw + pad) / 3;
    const variance = ((phi - mean) ** 2 + (gw - mean) ** 2 + (pad - mean) ** 2) / 3;
    const coherence = Math.max(0, 1 - Math.sqrt(variance) * 2);

    const dataAvail = [phi, gw, pad].filter(v => v > 0.01).length / 3;

    return coherence * 0.7 + dataAvail * 0.3;
  }

  /** Update default weights */
  setWeights(w: Partial<ACMWeights>): void {
    Object.assign(this.weights, w);
  }

  /** Current cycle count */
  get totalCycles(): number { return this.cycles; }
}

/** Singleton ACM instance */
export const acmModule = new ACMModule();

// ── Adapter methods for server.ts compatibility ──

const _acmAdapter = {
  _lastResult: null as ACMResult | null,

  /** server.ts calls acm.update(snn) */
  update(_snn?: unknown): ACMResult {
    _acmAdapter._lastResult = acmModule.assess();
    return _acmAdapter._lastResult;
  },

  /** server.ts calls acm.getState() */
  getState(): ACMResult {
    return acmModule.assess();
  },

  /** server.ts calls acm.getMetrics() */
  getMetrics(): Record<string, number> {
    const r = _acmAdapter._lastResult ?? acmModule.assess();
    return {
      phi: r.components.integrationProxy.value,
      gw: r.components.broadcastProxy.value,
      pad: r.components.arousalProxy.value,
      score: r.compositeScore,
      confidence: r.confidence,
      cycles: r.totalCycles,
    };
  },
};

export { _acmAdapter as acmAdapter };
