/**
 * ASTRA — Proxy validation controls (v3.2.0)
 * ══════════════════════════════════════════
 * Programme minimal de consolidation, point 3 — « Valider les proxys » —
 * of the epistemological analysis of 9 October 2026 (§3.1, §6.1):
 *
 *   for each metric, state construct, formula, invariances and domain of use
 *   (./proxy-cards.ts); add common-source controls, connectivity ablations
 *   and witness signals; tell a null result, an absence of measurement and an
 *   insufficient sample apart.
 *
 * Each control below tests ONE declared property of ONE proxy and reports
 * whether it holds. A control that fails is a result, not a bug in the
 * harness: the Φ̃ (ACM) proxy, for instance, is expected to fail the
 * connectivity-ablation control, and the card says so.
 *
 * ISOLATION. Synthetic signals come from a private generator; SNN engines are
 * built inside `withIsolatedStream`, so running the controls leaves the
 * global random stream — and therefore every later result of the session —
 * exactly as it was. That is what makes `proxy_validate` read-only.
 *
 * SCOPE. The controls check properties of the formulas on signals whose
 * structure is known by construction. They do not validate any proxy as a
 * measure of a theoretical construct; at most they show where a proxy cannot
 * be one.
 *
 * © 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
 */

import {
  RIIUPhi, riiuL1Share, riiuCorrelationShare, riiuResidualShare,
  computeEffectiveInformation, estimateEffectiveInformation, discretizeContinuous, classifyAgainstWitness,
  type ProxyOutcome, type EIEstimate,
} from './tcai/metrics.js';
import { SNNEngine } from './snn.js';
import { integrationProxyOf, broadcastProxyOf, arousalProxyOf, type ProxyInput } from './acm.js';
import { withIsolatedStream } from '../utils/rng.js';
import { ASTRA_VERSION } from '../version.js';

// ── Private generator (never touches the global stream) ───────────

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(u: () => number): () => number {
  return () => {
    let a = u();
    while (a <= 1e-12) a = u();
    return Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * u());
  };
}

// ── Synthetic signal families with known structure ────────────────

/** Independent N(0,1) coordinates: no dependence of any kind (witness). */
export function witnessSignals(n: number, d: number, seed: number): number[][] {
  const g = gaussian(mulberry32(seed));
  return Array.from({ length: n }, () => Array.from({ length: d }, g));
}

/**
 * One shared scalar source with unequal loadings plus independent noise:
 * strong dependence among coordinates, and NO interaction between them.
 */
export function commonSourceSignals(n: number, d: number, seed: number, noise = 0.3): number[][] {
  const u = mulberry32(seed);
  const g = gaussian(u);
  const load = Array.from({ length: d }, () => 0.5 + u());
  return Array.from({ length: n }, () => {
    const s = g();
    return load.map((l) => l * s + noise * g());
  });
}

/** Coordinates coupled two by two, independent across pairs: dependence no single common factor explains. */
export function pairwiseSignals(n: number, d: number, seed: number, noise = 0.3): number[][] {
  const g = gaussian(mulberry32(seed));
  return Array.from({ length: n }, () => {
    const z: number[] = [];
    for (let k = 0; k < Math.floor(d / 2); k++) { const x = g(); z.push(x, x + noise * g()); }
    if (z.length < d) z.push(g());
    return z;
  });
}

// ── Small statistics helpers ──────────────────────────────────────

function quantile(xs: number[], q: number): number {
  const s = [...xs].sort((a, b) => a - b);
  if (s.length === 0) return NaN;
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}
const meanOf = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const r4 = (x: number | null) => (x === null || !Number.isFinite(x) ? null : +x.toFixed(4));

export interface WitnessBand { lo: number; hi: number; mean: number; reps: number; n: number; d: number }

function band(xs: number[], n: number, d: number): WitnessBand {
  return { lo: r4(quantile(xs, 0.025))!, hi: r4(quantile(xs, 0.975))!, mean: r4(meanOf(xs))!, reps: xs.length, n, d };
}

// ── Report types ──────────────────────────────────────────────────

export type ControlFamily = 'riiu' | 'ei' | 'acm';

export interface ControlResult {
  id: string;
  family: ControlFamily;
  proxyId: string;
  kind: 'witness' | 'common-source' | 'positive' | 'invariance' | 'status' | 'ablation' | 'sampling' | 'provenance';
  /**
   * 'requirement' — the property is one a valid proxy should have: `holds: false` is a failure.
   * 'defect'      — the property is a declared limitation: `holds: true` CONFIRMS the defect.
   * (Distinction added after independent review: "14 of 16 hold" read as success.)
   */
  polarity: 'requirement' | 'defect';
  declaredPropertyEn: string;
  declaredPropertyFr: string;
  observed: Record<string, number | string | boolean | null>;
  holds: boolean;
  interpretationEn: string;
  interpretationFr: string;
}

export interface ValidationOptions {
  seed?: number;
  /** Repetitions for witness bands. */
  reps?: number;
  /** Buffer length for Φ̃-RIIU controls (deployed: 64). */
  n?: number;
  /** Latent dimension for Φ̃-RIIU controls (deployed workspace: 64). */
  dims?: number;
  /** SNN steps for the ACM controls. */
  snnSteps?: number;
  families?: ControlFamily[];
  /** Live instruments to classify against the witness bands (supplied by the server). */
  live?: { riiu?: RIIUPhi; ignitionTrajectory?: number[] };
}

export interface ProxyValidationReport {
  version: string;
  options: Required<Omit<ValidationOptions, 'live'>>;
  witnessBands: Record<string, WitnessBand>;
  controls: ControlResult[];
  live: { phiRIIU?: ProxyOutcome; effectiveInformation?: EIEstimate & { witnessBand: WitnessBand | null } } | null;
  summary: {
    controls: number;
    requirements: number; requirementsMet: number; requirementsFailed: string[];
    defects: number; defectsConfirmed: number; defectsNotReproduced: string[];
    noteEn: string;
  };
  scopeEn: string;
  scopeFr: string;
}

// ── Φ̃-RIIU controls ──────────────────────────────────────────────

function riiuControls(o: Required<Omit<ValidationOptions, 'live'>>, bands: Record<string, WitnessBand>): ControlResult[] {
  const out: ControlResult[] = [];
  const { n, dims: d, reps, seed } = o;

  // Witness bands at the deployed dimension, and at a well-conditioned control
  // dimension (DC = 8, n ≫ d) where the structural controls are run.
  const DC = 8;
  const wL1: number[] = [], wCorr: number[] = [], wL1c: number[] = [], wResC: number[] = [], csResC: number[] = [];
  for (let r = 0; r < reps; r++) {
    const w = witnessSignals(n, d, seed + 101 + r);
    wL1.push(riiuL1Share(w) ?? NaN);
    wCorr.push(riiuCorrelationShare(w) ?? NaN);
    const wc = witnessSignals(n, DC, seed + 9001 + r);
    wL1c.push(riiuL1Share(wc) ?? NaN);
    wResC.push(riiuResidualShare(wc) ?? NaN);
    csResC.push(riiuResidualShare(commonSourceSignals(n, DC, seed + 5001 + r)) ?? NaN);
  }
  bands['riiu.l1'] = band(wL1, n, d);
  bands['riiu.correlation'] = band(wCorr, n, d);
  bands['riiu.l1.d8'] = band(wL1c, n, DC);
  bands['riiu.residual.d8'] = band(wResC, n, DC);
  bands['riiu.residual.singleSource.d8'] = band(csResC, n, DC);

  out.push({
    id: 'R1', family: 'riiu', proxyId: 'tcai.phiRIIU', kind: 'witness', polarity: 'defect',
    declaredPropertyEn: 'On independent signals the share is not 0, and its level rises with the number of coordinates.',
    declaredPropertyFr: 'Sur des signaux indépendants, la part n\'est pas nulle et son niveau croît avec le nombre de coordonnées.',
    observed: { witnessMean_d: bands['riiu.l1'].mean, witnessBandLo_d: bands['riiu.l1'].lo, witnessBandHi_d: bands['riiu.l1'].hi,
      witnessMean_d8: bands['riiu.l1.d8'].mean, d, n, dOverN: r4(d / n) },
    holds: bands['riiu.l1'].mean > bands['riiu.l1.d8'].mean && bands['riiu.l1.d8'].mean > 0.05,
    interpretationEn:
      `Absolute sampling covariances do not cancel: with ${n} samples, independent noise already yields ` +
      `${bands['riiu.l1'].mean} at d = ${d} (${bands['riiu.l1.d8'].mean} at d = 8). A deployed value is interpretable only ` +
      'against this witness band at the same n and d; when d is close to n the band is narrow and high, and the proxy has ' +
      'little room left above it.',
    interpretationFr:
      `Les covariances d'échantillonnage absolues ne se compensent pas : avec ${n} échantillons, un bruit indépendant ` +
      `donne déjà ${bands['riiu.l1'].mean} pour d = ${d} (${bands['riiu.l1.d8'].mean} pour d = 8). Une valeur déployée ne ` +
      's\'interprète que rapportée à cette bande témoin, à n et d égaux ; lorsque d approche n, la bande est étroite et haute, ' +
      'et le proxy dispose de peu de marge au-dessus d\'elle.',
  });

  const cs = commonSourceSignals(n, d, seed + 7);
  const csL1 = riiuL1Share(cs), csCorr = riiuCorrelationShare(cs);
  out.push({
    id: 'R2', family: 'riiu', proxyId: 'tcai.phiRIIU', kind: 'common-source', polarity: 'defect',
    declaredPropertyEn: 'A single shared source with no interaction among coordinates raises the raw share above the witness band.',
    declaredPropertyFr: 'Une source commune unique, sans interaction entre coordonnées, porte la part brute au-dessus de la bande témoin.',
    observed: { l1Share: r4(csL1), witnessHi: bands['riiu.l1'].hi, correlationShare: r4(csCorr) },
    holds: (csL1 ?? 0) > bands['riiu.l1'].hi,
    interpretationEn:
      'The raw share cannot tell integration among components from a common drive: a high value is compatible with ' +
      'one external source and no coupling at all.',
    interpretationFr:
      'La part brute ne distingue pas une intégration entre composantes d\'un forçage commun : une valeur élevée est ' +
      'compatible avec une source externe unique et aucun couplage.',
  });

  const csC = commonSourceSignals(n, DC, seed + 17);
  const excessRaw = (riiuL1Share(csC) ?? 0) - bands['riiu.l1.d8'].mean;
  const excessRes = (riiuResidualShare(csC) ?? 0) - bands['riiu.residual.d8'].mean;
  out.push({
    id: 'R3', family: 'riiu', proxyId: 'tcai.phiRIIU.residualShare', kind: 'common-source', polarity: 'requirement',
    declaredPropertyEn:
      'Projecting out the leading component removes most of the excess a single common source adds (residual excess < ¼ of raw excess, d = 8).',
    declaredPropertyFr:
      'Retirer la composante principale supprime l\'essentiel de l\'excès dû à une source commune unique (excès résiduel < ¼ de l\'excès brut, d = 8).',
    observed: { rawExcessOverWitness: r4(excessRaw), residualExcessOverWitness: r4(excessRes), d: DC },
    holds: excessRaw > 0 && excessRes < 0.25 * excessRaw,
    interpretationEn:
      'The residual share is the common-source control: when it falls back towards the witness level, the raw value was ' +
      'carried by one shared factor. It cannot show the converse — that no common source acted.',
    interpretationFr:
      'La part résiduelle est le contrôle de source commune : lorsqu\'elle retombe vers le niveau témoin, la valeur brute ' +
      'était portée par un facteur partagé. Elle ne peut établir l\'inverse — l\'absence de toute source commune.',
  });

  const pw = pairwiseSignals(n, DC, seed + 13);
  const pwRes = riiuResidualShare(pw);
  out.push({
    id: 'R4', family: 'riiu', proxyId: 'tcai.phiRIIU.residualShare', kind: 'positive', polarity: 'requirement',
    declaredPropertyEn:
      'Dependence that no single common factor explains (pairwise coupling) survives the projection, above the single-source residual band (d = 8).',
    declaredPropertyFr:
      'Une dépendance qu\'aucun facteur commun unique n\'explique (couplage par paires) survit à la projection, au-dessus de la bande résiduelle à source unique (d = 8).',
    observed: { residualShare: r4(pwRes), singleSourceResidualHi: bands['riiu.residual.singleSource.d8'].hi, d: DC },
    holds: pwRes !== null && pwRes > bands['riiu.residual.singleSource.d8'].hi,
    interpretationEn: 'Positive control: the residual share is not blind to structured dependence.',
    interpretationFr: 'Contrôle positif : la part résiduelle n\'est pas aveugle à une dépendance structurée.',
  });

  const scaled = cs.map((z) => z.map((x, j) => (j === 0 ? 100 * x : x)));
  const dL1 = (riiuL1Share(scaled) ?? 0) - (csL1 ?? 0);
  const dCorr = (riiuCorrelationShare(scaled) ?? 0) - (csCorr ?? 0);
  out.push({
    id: 'R5', family: 'riiu', proxyId: 'tcai.phiRIIU.correlationShare', kind: 'invariance', polarity: 'requirement',
    declaredPropertyEn: 'The correlation share is unchanged when one coordinate is rescaled (×100).',
    declaredPropertyFr: 'La part de corrélation est inchangée lorsqu\'une coordonnée change d\'échelle (×100).',
    observed: { deltaCorrelationShare: r4(dCorr), factor: 100 },
    holds: Math.abs(dCorr) < 1e-9,
    interpretationEn: 'The scale-free variant does not depend on the units of the latent coordinates.',
    interpretationFr: 'La variante sans échelle ne dépend pas des unités des coordonnées latentes.',
  });
  out.push({
    id: 'R5L', family: 'riiu', proxyId: 'tcai.phiRIIU', kind: 'invariance', polarity: 'defect',
    declaredPropertyEn: 'Rescaling one coordinate (×100) changes the legacy L1 covariance share.',
    declaredPropertyFr: 'Changer l\'échelle d\'une coordonnée (×100) modifie la part L1 héritée des covariances.',
    observed: { deltaL1Share: r4(dL1), factor: 100 },
    holds: Math.abs(dL1) > 0.01,
    interpretationEn: 'The legacy Φ̃-RIIU depends on the units of the latent coordinates (declared defect).',
    interpretationFr: 'Le Φ̃-RIIU hérité dépend des unités des coordonnées latentes (défaut déclaré).',
  });

  const perm = cs.map((z) => [...z].reverse());
  const shifted = cs.map((z) => z.map((x, j) => x + 5 * j));
  const dPerm = Math.abs((riiuL1Share(perm) ?? 0) - (csL1 ?? 0)) + Math.abs((riiuCorrelationShare(perm) ?? 0) - (csCorr ?? 0));
  const dShift = Math.abs((riiuL1Share(shifted) ?? 0) - (csL1 ?? 0)) + Math.abs((riiuCorrelationShare(shifted) ?? 0) - (csCorr ?? 0));
  out.push({
    id: 'R6', family: 'riiu', proxyId: 'tcai.phiRIIU', kind: 'invariance', polarity: 'requirement',
    declaredPropertyEn: 'Both shares are invariant to a permutation and to a translation of the coordinates.',
    declaredPropertyFr: 'Les deux parts sont invariantes par permutation et par translation des coordonnées.',
    observed: { permutationDelta: r4(dPerm), translationDelta: r4(dShift) },
    holds: dPerm < 1e-9 && dShift < 1e-6,
    interpretationEn: 'The order and offset of the latent coordinates carry no information in either share.',
    interpretationFr: 'L\'ordre et le décalage des coordonnées latentes ne portent aucune information dans l\'une ou l\'autre part.',
  });

  const empty = new RIIUPhi();
  const short = new RIIUPhi();
  for (let i = 0; i < 3; i++) short.push(witnessSignals(1, d, seed + i)[0]);
  const flat = new RIIUPhi();
  for (let i = 0; i < 16; i++) flat.push(new Array(d).fill(0.25));
  const s0 = empty.evaluate().status, s1 = short.evaluate().status, s2 = flat.evaluate().status;
  out.push({
    id: 'R7', family: 'riiu', proxyId: 'tcai.phiRIIU', kind: 'status', polarity: 'requirement',
    declaredPropertyEn: 'No input, too few samples and constant input yield three distinct statuses — never a bare 0.',
    declaredPropertyFr: 'Absence d\'entrée, échantillon trop court et entrée constante donnent trois statuts distincts — jamais un 0 nu.',
    observed: { empty: s0, threeSamples: s1, constant: s2, legacyValueInAllThree: 0 },
    holds: s0 === 'not-measured' && s1 === 'insufficient-sample' && s2 === 'degenerate',
    interpretationEn: 'The legacy API returns 0 in all three cases; `evaluate()` keeps them apart.',
    interpretationFr: 'L\'API héritée renvoie 0 dans les trois cas ; `evaluate()` les distingue.',
  });
  return out;
}

// ── Effective-information controls ───────────────────────────────

function eiControls(o: Required<Omit<ValidationOptions, 'live'>>, bands: Record<string, WitnessBand>): ControlResult[] {
  const out: ControlResult[] = [];
  const k = 8;
  const cycle = Array.from({ length: 200 }, (_, t) => t % k);
  const eiCycle = computeEffectiveInformation(cycle, k);
  out.push({
    id: 'E1', family: 'ei', proxyId: 'tcai.effectiveInformation', kind: 'positive', polarity: 'requirement',
    declaredPropertyEn: 'A deterministic cycle through all 8 states returns log2(8) = 3 bits.',
    declaredPropertyFr: 'Un cycle déterministe parcourant les 8 états renvoie log2(8) = 3 bits.',
    observed: { ei: r4(eiCycle) },
    holds: Math.abs(eiCycle - 3) < 1e-9,
    interpretationEn: 'The estimator reaches its maximum on a deterministic, non-degenerate transition structure.',
    interpretationFr: 'L\'estimateur atteint son maximum sur une structure de transition déterministe et non dégénérée.',
  });

  const lengths = [32, 128, 512, 2048];
  const means: number[] = [];
  for (const L of lengths) {
    const vals: number[] = [];
    for (let r = 0; r < o.reps; r++) {
      const u = mulberry32(o.seed + 31 * L + r);
      vals.push(computeEffectiveInformation(Array.from({ length: L }, () => Math.floor(u() * k)), k));
    }
    means.push(meanOf(vals));
    if (L === 512) bands['ei.iid.512'] = band(vals, L, k);
  }
  out.push({
    id: 'E2', family: 'ei', proxyId: 'tcai.effectiveInformation', kind: 'sampling', polarity: 'defect',
    declaredPropertyEn: 'On i.i.d. uniform states (true value 0) the plug-in estimate is positive and shrinks as the trajectory lengthens.',
    declaredPropertyFr: 'Sur des états i.i.d. uniformes (valeur vraie 0), l\'estimation par substitution est positive et décroît quand la trajectoire s\'allonge.',
    observed: Object.fromEntries(lengths.map((L, i) => [`meanEI_L${L}`, r4(means[i])])),
    holds: means[0] > means[1] && means[1] > means[2] && means[2] > means[3] && means[0] > 0.1,
    interpretationEn:
      'Finite-sample bias: a short trajectory reports information that is not there. The deployed trajectory holds ≤ 512 points; ' +
      'its witness band is reported for comparison.',
    interpretationFr:
      'Biais d\'échantillon fini : une trajectoire courte rapporte une information absente. La trajectoire déployée compte ' +
      '≤ 512 points ; sa bande témoin est fournie pour comparaison.',
  });

  const half = Array.from({ length: 200 }, (_, t) => t % 4);
  const estHalf = estimateEffectiveInformation(half, k);
  out.push({
    id: 'E3', family: 'ei', proxyId: 'tcai.effectiveInformation', kind: 'sampling', polarity: 'defect',
    declaredPropertyEn: 'States never visited drop out of the estimand: a 4-state cycle in an 8-state space returns 2 bits with coverage 0.5.',
    declaredPropertyFr: 'Les états jamais visités sortent de l\'objet estimé : un cycle à 4 états dans un espace à 8 renvoie 2 bits, couverture 0,5.',
    observed: { ei: r4(estHalf.value), coverage: estHalf.coverage, status: estHalf.status },
    holds: estHalf.value !== null && Math.abs(estHalf.value - 2) < 1e-9 && estHalf.coverage === 0.5,
    interpretationEn: 'The sampling regime changes the object estimated; coverage must be reported with the value.',
    interpretationFr: 'Le régime d\'échantillonnage modifie l\'objet estimé ; la couverture doit accompagner la valeur.',
  });

  const constant = estimateEffectiveInformation(new Array(100).fill(3), k);
  const sparse = estimateEffectiveInformation([0, 1, 2, 3, 4, 5, 6, 7, 0, 1], k);
  out.push({
    id: 'E4', family: 'ei', proxyId: 'tcai.effectiveInformation', kind: 'status', polarity: 'requirement',
    declaredPropertyEn: 'A constant trajectory is degenerate; a trajectory with fewer than 5 transitions per visited state is an insufficient sample.',
    declaredPropertyFr: 'Une trajectoire constante est dégénérée ; moins de 5 transitions par état visité constituent un échantillon insuffisant.',
    observed: { constant: constant.status, tenPoints: sparse.status, legacyConstant: r4(constant.legacy), legacyTenPoints: r4(sparse.legacy) },
    holds: constant.status === 'degenerate' && sparse.status === 'insufficient-sample',
    interpretationEn: 'The legacy API returns a number in both cases; neither is a result.',
    interpretationFr: 'L\'API héritée renvoie un nombre dans les deux cas ; aucun n\'est un résultat.',
  });

  const u = mulberry32(o.seed + 77);
  const series = Array.from({ length: 300 }, (_, t) => Math.sin(t / 6) + 0.2 * (u() - 0.5));
  const eiBase = computeEffectiveInformation(discretizeContinuous(series, k), k);
  const eiOutlier = computeEffectiveInformation(discretizeContinuous([...series, 10 * Math.max(...series)], k), k);
  out.push({
    id: 'E5', family: 'ei', proxyId: 'tcai.effectiveInformation', kind: 'invariance', polarity: 'defect',
    declaredPropertyEn: 'Min–max discretisation makes the estimate depend on the extreme value of the window: one outlier changes it.',
    declaredPropertyFr: 'La discrétisation min–max rend l\'estimation dépendante de la valeur extrême de la fenêtre : un seul point aberrant la modifie.',
    observed: { eiWithout: r4(eiBase), eiWithOneOutlier: r4(eiOutlier) },
    holds: Math.abs(eiBase - eiOutlier) > 0.05,
    interpretationEn: 'The state partition is not fixed in advance; it is redrawn by the data, outliers included.',
    interpretationFr: 'La partition des états n\'est pas fixée à l\'avance ; les données la redessinent, valeurs aberrantes comprises.',
  });
  return out;
}

// ── ACM controls (SNN) ────────────────────────────────────────────

interface RunSummary { meanValue: number; meanRaw: number; saturatedShare: number; meanBroadcast: number; meanRateHz: number; synapses: number }

function runSnn(steps: number, ablate: boolean): RunSummary {
  const e = new SNNEngine();
  if (ablate) e.ablateConnectivity('all');
  const vals: number[] = [], raws: number[] = [], bc: number[] = [], rates: number[] = [];
  let sat = 0;
  for (let i = 0; i < steps; i++) {
    e.step();
    const ip = integrationProxyOf(e);
    vals.push(ip.value); raws.push(ip.raw); if (ip.saturated) sat++;
    bc.push(broadcastProxyOf(e).value);
    rates.push(e.stats().firingRateStats.mean);
  }
  const tail = (xs: number[]) => xs.slice(Math.floor(xs.length / 3));
  return {
    meanValue: meanOf(tail(vals)), meanRaw: meanOf(tail(raws)), saturatedShare: sat / steps,
    meanBroadcast: meanOf(tail(bc)), meanRateHz: meanOf(tail(rates)), synapses: e.getSynapseCount(),
  };
}

function acmControls(o: Required<Omit<ValidationOptions, 'live'>>): ControlResult[] {
  const out: ControlResult[] = [];
  const [intact, ablated] = withIsolatedStream(o.seed, () => [runSnn(o.snnSteps, false), runSnn(o.snnSteps, true)]);
  out.push({
    id: 'A1', family: 'acm', proxyId: 'acm.integrationProxy', kind: 'ablation', polarity: 'requirement',
    declaredPropertyEn: 'A proxy of integration should fall when every synapse is removed.',
    declaredPropertyFr: 'Un proxy d\'intégration devrait baisser lorsque toutes les synapses sont retirées.',
    observed: {
      intactValue: r4(intact.meanValue), ablatedValue: r4(ablated.meanValue),
      intactRaw: r4(intact.meanRaw), ablatedRaw: r4(ablated.meanRaw),
      intactSynapses: intact.synapses, ablatedSynapses: ablated.synapses,
    },
    holds: ablated.meanValue < intact.meanValue - 0.05,
    interpretationEn:
      'Φ̃ (ACM) does not register the removal of all connectivity: the clamp and the Hz-valued rate term dominate. It fails ' +
      'this control and is reported as degenerate whenever the clamp is active.',
    interpretationFr:
      'Φ̃ (ACM) n\'enregistre pas la suppression de toute connectivité : la saturation et le terme de taux en Hz dominent. ' +
      'Il échoue à ce contrôle et est déclaré dégénéré dès que la saturation est active.',
  });
  out.push({
    id: 'A2', family: 'acm', proxyId: 'acm.integrationProxy', kind: 'status', polarity: 'defect',
    declaredPropertyEn: 'In the default configuration the clamp of Φ̃ (ACM) is active for most steps.',
    declaredPropertyFr: 'Dans la configuration par défaut, la saturation de Φ̃ (ACM) est active la plupart du temps.',
    observed: { saturatedShareIntact: r4(intact.saturatedShare), saturatedShareAblated: r4(ablated.saturatedShare), steps: o.snnSteps },
    holds: intact.saturatedShare > 0.5,
    interpretationEn: 'A saturated value carries no information about further change; such outputs carry status \'degenerate\'.',
    interpretationFr: 'Une valeur saturée ne renseigne sur aucune variation ultérieure ; ces sorties portent le statut « degenerate ».',
  });
  out.push({
    id: 'A3', family: 'acm', proxyId: 'acm.broadcastProxy', kind: 'ablation', polarity: 'requirement',
    declaredPropertyEn: 'A proxy of broadcast should fall when the layers can no longer communicate.',
    declaredPropertyFr: 'Un proxy de diffusion devrait baisser lorsque les couches ne peuvent plus communiquer.',
    observed: { intact: r4(intact.meanBroadcast), ablated: r4(ablated.meanBroadcast), intactRateHz: r4(intact.meanRateHz), ablatedRateHz: r4(ablated.meanRateHz) },
    holds: ablated.meanBroadcast < intact.meanBroadcast - 0.05,
    interpretationEn:
      'GW̃ (ACM) scores the uniformity of layer rates. Disconnected, noise-driven layers fire at similar rates, so it does not ' +
      'separate broadcast from independent activity.',
    interpretationFr:
      'GW̃ (ACM) note l\'uniformité des taux par couche. Des couches déconnectées, mues par le bruit, déchargent à des taux ' +
      'voisins : il ne sépare pas la diffusion d\'une activité indépendante.',
  });
  const arousalInputs: ProxyInput[] = arousalProxyOf().inputs;
  const spk = arousalInputs.find((i) => i.name === 'loihi.spk');
  out.push({
    id: 'A4', family: 'acm', proxyId: 'acm.arousalProxy', kind: 'provenance', polarity: 'defect',
    declaredPropertyEn: 'No input of PAD̃ (ACM) is a measurement: one is written by no engine, two are synthetic drifts.',
    declaredPropertyFr: 'Aucune entrée de PAD̃ (ACM) n\'est une mesure : l\'une n\'est écrite par aucun moteur, deux sont des dérives synthétiques.',
    observed: Object.fromEntries(arousalInputs.map((i) => [i.name, i.provenance])),
    holds: arousalInputs.every((i) => i.provenance !== 'measured') && spk !== undefined && spk.provenance !== 'endogenous',
    interpretationEn: 'The arousal proxy is a function of configured or simulated values only.',
    interpretationFr: 'Le proxy d\'éveil n\'est fonction que de valeurs configurées ou simulées.',
  });
  return out;
}

// ── Driver ────────────────────────────────────────────────────────

export const DEFAULT_VALIDATION_OPTIONS: Required<Omit<ValidationOptions, 'live'>> = Object.freeze({
  seed: 20261009, reps: 40, n: 64, dims: 64, snnSteps: 300, families: ['riiu', 'ei', 'acm'] as ControlFamily[],
});

export function validateProxies(opts: ValidationOptions = {}): ProxyValidationReport {
  const o = { ...DEFAULT_VALIDATION_OPTIONS, ...opts, families: opts.families ?? DEFAULT_VALIDATION_OPTIONS.families };
  delete (o as ValidationOptions).live;
  const bands: Record<string, WitnessBand> = {};
  const controls: ControlResult[] = [];
  if (o.families.includes('riiu')) controls.push(...riiuControls(o, bands));
  if (o.families.includes('ei')) controls.push(...eiControls(o, bands));
  if (o.families.includes('acm')) controls.push(...acmControls(o));

  // Live values are classified against witness bands computed at THEIR OWN sample size
  // and dimension (v3.2.0, after independent review: bands were reused only when sizes matched).
  let live: ProxyValidationReport['live'] = null;
  if (opts.live) {
    live = {};
    if (opts.live.riiu) {
      const buf = opts.live.riiu.snapshot();
      const n = buf.length, d = n > 0 ? buf[0].length : 0;
      let wb: WitnessBand | null = null;
      if (n >= 3 && d >= 2) {
        const same = bands['riiu.l1'] && bands['riiu.l1'].d === d && bands['riiu.l1'].n === n;
        wb = same ? bands['riiu.l1']
          : band(Array.from({ length: o.reps }, (_, r) => riiuL1Share(witnessSignals(n, d, o.seed + 70_001 + r)) ?? NaN), n, d);
        bands['riiu.l1.live'] = wb;
      }
      live.phiRIIU = opts.live.riiu.evaluate(wb ? { lo: wb.lo, hi: wb.hi } : null);
    }
    if (opts.live.ignitionTrajectory) {
      const traj = discretizeContinuous(opts.live.ignitionTrajectory, 8);
      const est = estimateEffectiveInformation(traj, 8);
      let wb: WitnessBand | null = null;
      if (traj.length >= 3) {
        const L = traj.length;
        wb = band(Array.from({ length: o.reps }, (_, r) => {
          const u = mulberry32(o.seed + 90_001 + r);
          return computeEffectiveInformation(Array.from({ length: L }, () => Math.floor(u() * 8)), 8);
        }), L, 8);
        bands['ei.iid.live'] = wb;
      }
      const classified = classifyAgainstWitness(est, wb ? { lo: wb.lo, hi: wb.hi } : null) as EIEstimate;
      live.effectiveInformation = { ...est, ...classified, witnessBand: wb };
    }
  }

  const reqFailed = controls.filter((c) => c.polarity === 'requirement' && !c.holds).map((c) => c.id);
  const defNotReproduced = controls.filter((c) => c.polarity === 'defect' && !c.holds).map((c) => c.id);
  return {
    version: ASTRA_VERSION,
    options: o,
    witnessBands: bands,
    controls,
    live,
    summary: {
      controls: controls.length,
      requirements: controls.filter((c) => c.polarity === 'requirement').length,
      requirementsMet: controls.filter((c) => c.polarity === 'requirement' && c.holds).length,
      requirementsFailed: reqFailed,
      defects: controls.filter((c) => c.polarity === 'defect').length,
      defectsConfirmed: controls.filter((c) => c.polarity === 'defect' && c.holds).length,
      defectsNotReproduced: defNotReproduced,
      noteEn: 'A failed requirement is a finding against the proxy; a confirmed defect is a declared limitation reproduced. ' +
              'Neither kind validates a proxy as a measure of a construct.',
    },
    scopeEn:
      'Each control checks one declared property of one formula on signals whose structure is known by construction. ' +
      'A failing control is a finding about the proxy. No control validates a proxy as a measure of a theoretical construct.',
    scopeFr:
      'Chaque contrôle éprouve une propriété déclarée d\'une formule sur des signaux dont la structure est connue par ' +
      'construction. Un contrôle en échec est un résultat sur le proxy. Aucun contrôle ne valide un proxy comme mesure d\'un ' +
      'construit théorique.',
  };
}
