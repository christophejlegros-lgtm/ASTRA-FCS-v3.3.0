/**
 * ASTRA — Somatosensory channel (v3.3.0-rc.5)
 * ═══════════════════════════════════════════
 * Cutaneous, thermal, protective-threshold and proprioceptive signals, encoded
 * as FUNCTIONAL ANALOGUES of the afferent classes, for the efference–reafference
 * loop of FCS level II. Nothing here is calibrated on human afferents: the
 * classes name the role a signal plays, not a physiological equivalence.
 *
 *   SA1     sustained normal force            (Merkel analogue)
 *   FA1     rate of change of force           (Meissner analogue)
 *   FA2     band-limited vibration            (Pacini analogue) — needs a vibration
 *           channel; a frame-based optical tactile sensor cannot supply it
 *   SA2     skin stretch                      (Ruffini analogue) — cutaneous stretch
 *           carries kinaesthetic information in humans (Edin & Johansson 1995;
 *           Collins et al. 2005), so it is REAFFERENT and is manipulated with the
 *           joints, never left congruent beside them
 *   COLD / WARM  static deviation from a neutral temperature + rate of change;
 *           a heated sensor with a heat-flux reading adds the cooling flux that
 *           lets materials at the same temperature be told apart
 *   NOCI    protective THRESHOLD flags (mechanical, heat, cold). A threshold
 *           channel, named nociceptive; it carries no claim of any felt state
 *   SPINDLE joint position and velocity       (muscle-spindle analogue)
 *   TENDON  effort: joint torque              (Golgi tendon organ analogue)
 *
 * Provenance follows rc.4: `simulated` (produced inside ASTRA) or `reported`
 * (supplied by a caller). ASTRA never upgrades either to a measurement.
 * Timing: every reading carries a hardware timestamp `t` (ms) and the clock
 * domain that produced it; the comparator refuses to pair samples across clock
 * domains, because a delay manipulation is meaningless against an unknown offset.
 *
 * © 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
 */

export type Origin = 'simulated' | 'reported';

export const AFFERENT_CLASSES = ['SA1', 'FA1', 'FA2', 'SA2', 'COLD', 'WARM', 'NOCI', 'SPINDLE', 'TENDON'] as const;
export type AfferentClass = typeof AFFERENT_CLASSES[number];

/** Classes that report the consequences of the system's own movement (reafferent by construction). */
export const REAFFERENT_CLASSES: readonly AfferentClass[] = Object.freeze(['SA1', 'FA1', 'FA2', 'SA2', 'SPINDLE', 'TENDON']);

export interface TaxelFrame {
  rows: number;
  cols: number;
  /** Normal force per taxel (N), row-major, length rows × cols. */
  normalN: number[];
  /** Optional tangential components (N), same layout. */
  shearXN?: number[];
  shearYN?: number[];
}

export interface ThermalContact {
  /** Temperature of the sensing surface (°C). */
  surfaceTempC: number;
  /** Neutral (adapting) temperature the static component is referred to (°C). */
  neutralTempC: number;
  /** True when the sensor is actively held above ambient — required to read heat flux meaningfully. */
  heated: boolean;
  /** Heat flux leaving the sensing surface (W/m²; positive = the contact cools the sensor). */
  heatFluxWm2?: number | null;
}

export interface JointSample {
  id: string;
  angleRad: number;
  velocityRadS?: number | null;
  torqueNm?: number | null;
}

export interface SomatosensoryReading {
  /** Hardware timestamp of acquisition (ms), in `clockDomain`. */
  t: number;
  clockDomain: string;
  origin: Origin;
  taxels?: TaxelFrame;
  /** RMS of a band-limited vibration channel (arbitrary units declared by the device). */
  vibrationRms?: number | null;
  /** Skin-stretch sensors (dimensionless strain). */
  stretch?: number[];
  thermal?: ThermalContact;
  joints?: JointSample[];
  /** Identifiers of the physical sensors behind this reading (for the channel-separation check). */
  sourceSignals?: string[];
  /** Set by a manipulation: the acquisition time before the imposed delay. */
  generatedAt?: number;
}

export interface SomatosensoryConfig {
  forceSatN: number;
  forceRateSatNs: number;
  vibrationSat: number;
  stretchSat: number;
  tempSpanC: number;
  tempRateSatCs: number;
  heatFluxSatWm2: number;
  torqueSatNm: number;
  velocityScaleRadS: number;
  /** Declared joint ranges [min, max] (rad); joints absent here use [−π, π]. */
  jointRanges: Record<string, [number, number]>;
  /** Protective thresholds. Engineering defaults, to be replaced by the device's ratings. */
  nociMechanicalN: number;
  nociHeatC: number;
  nociColdC: number;
}

/**
 * Defaults are scaling constants for a fingertip-sized prototype, not
 * physiological calibrations. The heat threshold follows the TRPV1 activation
 * range reviewed by Vriens, Nilius & Voets (2014, doi:10.1038/nrn3784); the
 * others are placeholders to be set from the device's datasheet.
 */
export const DEFAULT_SOMATOSENSORY_CONFIG: SomatosensoryConfig = Object.freeze({
  forceSatN: 5,
  forceRateSatNs: 50,
  vibrationSat: 1,
  stretchSat: 0.2,
  tempSpanC: 10,
  tempRateSatCs: 2,
  heatFluxSatWm2: 2000,
  torqueSatNm: 1,
  velocityScaleRadS: 2,
  jointRanges: {},
  nociMechanicalN: 15,
  nociHeatC: 43,
  nociColdC: 15,
}) as SomatosensoryConfig;

// ── Validation (rc.4 convention: refuse NaN, Infinity and out-of-domain values) ──

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Problems found in a reading; empty array = admissible. */
export function validateSomatosensoryReading(r: SomatosensoryReading): string[] {
  const p: string[] = [];
  if (!r || typeof r !== 'object') return ['reading is not an object'];
  if (!finite(r.t)) p.push('t must be a finite timestamp (ms)');
  if (typeof r.clockDomain !== 'string' || !r.clockDomain.trim()) p.push('clockDomain is required');
  if (r.origin !== 'simulated' && r.origin !== 'reported') p.push("origin must be 'simulated' or 'reported'");
  if (r.taxels) {
    const { rows, cols, normalN, shearXN, shearYN } = r.taxels;
    if (!Number.isInteger(rows) || !Number.isInteger(cols) || rows < 1 || cols < 1) p.push('taxels: rows and cols must be positive integers');
    else {
      const n = rows * cols;
      if (!Array.isArray(normalN) || normalN.length !== n) p.push(`taxels.normalN must have ${n} values`);
      else if (normalN.some((v) => !finite(v) || v < 0)) p.push('taxels.normalN must be finite and ≥ 0');
      for (const [name, arr] of [['shearXN', shearXN], ['shearYN', shearYN]] as const) {
        if (arr !== undefined && (!Array.isArray(arr) || arr.length !== n || arr.some((v) => !finite(v)))) p.push(`taxels.${name} must have ${n} finite values`);
      }
    }
  }
  if (r.vibrationRms !== undefined && r.vibrationRms !== null && (!finite(r.vibrationRms) || r.vibrationRms < 0)) p.push('vibrationRms must be finite and ≥ 0');
  if (r.stretch !== undefined && (!Array.isArray(r.stretch) || r.stretch.some((v) => !finite(v)))) p.push('stretch must be an array of finite values');
  if (r.thermal) {
    const th = r.thermal;
    for (const k of ['surfaceTempC', 'neutralTempC'] as const) {
      if (!finite(th[k]) || th[k] < -60 || th[k] > 200) p.push(`thermal.${k} must be finite and within [−60, 200] °C`);
    }
    if (typeof th.heated !== 'boolean') p.push('thermal.heated must be declared');
    if (th.heatFluxWm2 !== undefined && th.heatFluxWm2 !== null && !finite(th.heatFluxWm2)) p.push('thermal.heatFluxWm2 must be finite');
  }
  if (r.joints) {
    const ids = new Set<string>();
    for (const j of r.joints) {
      if (typeof j.id !== 'string' || !j.id) p.push('joint id is required');
      else if (ids.has(j.id)) p.push(`joint id "${j.id}" is duplicated`);
      else ids.add(j.id);
      if (!finite(j.angleRad)) p.push(`joint ${j.id}: angleRad must be finite`);
      if (j.velocityRadS != null && !finite(j.velocityRadS)) p.push(`joint ${j.id}: velocityRadS must be finite`);
      if (j.torqueNm != null && !finite(j.torqueNm)) p.push(`joint ${j.id}: torqueNm must be finite`);
    }
  }
  return p;
}

// ── Encoding ──────────────────────────────────────────────────────

export interface AfferentFrame {
  channel: 'somatosensory';
  t: number;
  clockDomain: string;
  origin: Origin;
  /** Activations in [0, 1] per class; SPINDLE holds [position, velocity] per joint (velocity 0.5 = still). */
  classes: Record<AfferentClass, number[]>;
  /** Unit labels aligned with `classes`, e.g. "taxel 3", "joint mcp · velocity". */
  labels: Record<AfferentClass, string[]>;
  /** Time since the previous reading of the same clock domain (ms); null for the first reading. */
  dtMs: number | null;
  protective: { mechanical: boolean; heat: boolean; cold: boolean };
  notes: string[];
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function emptyClasses<T>(make: () => T): Record<AfferentClass, T> {
  return Object.fromEntries(AFFERENT_CLASSES.map((c) => [c, make()])) as Record<AfferentClass, T>;
}

/**
 * Stateful encoder: derivatives (FA1, dynamic thermal, velocity when not
 * reported) need the previous reading of the same clock domain.
 */
export class SomatosensoryEncoder {
  readonly config: SomatosensoryConfig;
  private prev = new Map<string, SomatosensoryReading>();

  constructor(config: Partial<SomatosensoryConfig> = {}) {
    this.config = { ...DEFAULT_SOMATOSENSORY_CONFIG, ...config, jointRanges: { ...(config.jointRanges ?? {}) } };
  }

  reset(): void { this.prev.clear(); }

  encode(r: SomatosensoryReading): AfferentFrame {
    const problems = validateSomatosensoryReading(r);
    if (problems.length) throw new RangeError(`Invalid somatosensory reading: ${problems.join('; ')}`);
    const c = this.config;
    const prev = this.prev.get(r.clockDomain);
    const dtMs = prev && r.t > prev.t ? r.t - prev.t : null;
    const dtS = dtMs !== null ? dtMs / 1000 : null;
    const classes = emptyClasses<number[]>(() => []);
    const labels = emptyClasses<string[]>(() => []);
    const notes: string[] = [];
    const protective = { mechanical: false, heat: false, cold: false };

    if (r.taxels) {
      const { normalN } = r.taxels;
      const prevN = prev?.taxels && prev.taxels.normalN.length === normalN.length ? prev.taxels.normalN : null;
      normalN.forEach((f, i) => {
        classes.SA1.push(clamp01(f / c.forceSatN));
        labels.SA1.push(`taxel ${i}`);
        // Fixed layout: FA1 is 0 (at rest) until a derivative is available, so vectors keep one length.
        classes.FA1.push(prevN && dtS ? clamp01(Math.abs(f - prevN[i]) / dtS / c.forceRateSatNs) : 0);
        labels.FA1.push(`taxel ${i}`);
        if (f >= c.nociMechanicalN) protective.mechanical = true;
      });
      if (!prevN || !dtS) notes.push('FA1 set to 0: it needs two readings of the same taxel layout on one clock domain.');
    }

    if (r.vibrationRms != null) {
      classes.FA2.push(clamp01(r.vibrationRms / c.vibrationSat));
      labels.FA2.push('vibration channel');
    } else if (r.taxels) {
      notes.push('FA2 requires a band-limited vibration channel; a frame-based tactile array cannot supply it.');
    }

    (r.stretch ?? []).forEach((s, i) => {
      classes.SA2.push(clamp01(Math.abs(s) / c.stretchSat));
      labels.SA2.push(`stretch ${i}`);
    });

    if (r.thermal) {
      const th = r.thermal;
      const stat = (th.surfaceTempC - th.neutralTempC) / c.tempSpanC;
      let dyn = 0;
      if (prev?.thermal && dtS) dyn = (th.surfaceTempC - prev.thermal.surfaceTempC) / dtS / c.tempRateSatCs;
      let fluxCooling = 0;
      if (th.heatFluxWm2 != null) {
        if (!th.heated) notes.push('Heat flux reported by an unheated sensor: material contrast at equal temperature is not readable.');
        fluxCooling = th.heatFluxWm2 / c.heatFluxSatWm2;
      } else if (th.heated) {
        notes.push('Heated sensor without a heat-flux reading: only surface temperature is encoded.');
      }
      classes.COLD.push(clamp01(0.5 * Math.max(0, -stat) + 0.5 * Math.max(0, -dyn) + Math.max(0, fluxCooling)));
      classes.WARM.push(clamp01(0.5 * Math.max(0, stat) + 0.5 * Math.max(0, dyn) + Math.max(0, -fluxCooling)));
      labels.COLD.push('contact'); labels.WARM.push('contact');
      if (th.surfaceTempC >= c.nociHeatC) protective.heat = true;
      if (th.surfaceTempC <= c.nociColdC) protective.cold = true;
    }

    for (const j of r.joints ?? []) {
      const [lo, hi] = c.jointRanges[j.id] ?? [-Math.PI, Math.PI];
      classes.SPINDLE.push(clamp01((j.angleRad - lo) / (hi - lo)));
      labels.SPINDLE.push(`joint ${j.id} · position`);
      let w = j.velocityRadS ?? null;
      if (w === null) {
        const pj = prev?.joints?.find((q) => q.id === j.id);
        if (pj && dtS) w = (j.angleRad - pj.angleRad) / dtS;
      }
      classes.SPINDLE.push(w === null ? 0.5 : 0.5 + 0.5 * Math.tanh(w / c.velocityScaleRadS));
      labels.SPINDLE.push(`joint ${j.id} · velocity`);
      if (j.torqueNm != null) {
        classes.TENDON.push(clamp01(Math.abs(j.torqueNm) / c.torqueSatNm));
        labels.TENDON.push(`joint ${j.id} · effort`);
      }
    }

    classes.NOCI = [protective.mechanical ? 1 : 0, protective.heat ? 1 : 0, protective.cold ? 1 : 0];
    labels.NOCI = ['mechanical threshold', 'heat threshold', 'cold threshold'];

    this.prev.set(r.clockDomain, r);
    return { channel: 'somatosensory', t: r.t, clockDomain: r.clockDomain, origin: r.origin, classes, labels, dtMs, protective, notes };
  }
}

/** Flattened activations of the selected classes, in class order (input to the forward model and to RDMs). */
export function afferentVector(frame: AfferentFrame, classes: readonly AfferentClass[] = REAFFERENT_CLASSES): number[] {
  const out: number[] = [];
  for (const k of classes) out.push(...frame.classes[k]);
  return out;
}

/**
 * Rate code for spike injection or stimulation planning: each activation in
 * [0, 1] becomes a rate in [0, maxHz]. The mapping is linear and declared; it
 * is a design choice of the bridge, not a property of afferents.
 */
export function afferentRates(frame: AfferentFrame, maxHz = 100, classes: readonly AfferentClass[] = AFFERENT_CLASSES):
  { rateHz: number[]; index: Array<{ cls: AfferentClass; label: string }> } {
  if (!(maxHz > 0 && Number.isFinite(maxHz))) throw new RangeError('afferentRates: maxHz must be finite and > 0');
  const rateHz: number[] = [];
  const index: Array<{ cls: AfferentClass; label: string }> = [];
  for (const k of classes) {
    frame.classes[k].forEach((a, i) => { rateHz.push(a * maxHz); index.push({ cls: k, label: frame.labels[k][i] ?? `${k} ${i}` }); });
  }
  return { rateHz, index };
}
