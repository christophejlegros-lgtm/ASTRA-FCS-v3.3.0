/**
 * ASTRA × FCS — The withdrawal test of the kinaesthetic thesis (v3.3.0-rc.5)
 * ══════════════════════════════════════════════════════════════════════════
 * Condition (withdrawal.ts, after document II §4.2 and S-1.6): the thesis is
 * withdrawn if "les effets de dimensionnalité sous rupture de clôture (§6.3)
 * apparaissent pour des manipulations de la congruence intéroceptive et non
 * pour des manipulations de la congruence sensorimotrice".
 *
 * The condition has TWO legs, and this module refuses to read it with one:
 *   · an effect under interoceptive manipulation — a superiority claim (lower
 *     bound above 0) or, if the author so chooses, a minimum-effect claim
 *     (lower bound above the SESOI): `effectCriterion`;
 *   · NO effect under sensorimotor manipulation — an absence claim, which a
 *     non-significant result does not establish. Absence is shown by
 *     equivalence: the (1 − 2α) interval of the effect lies inside ±SESOI,
 *     the smallest effect of interest fixed BEFORE the data (two one-sided
 *     tests; Lakens 2017). Without a SESOI no pattern is derived at all.
 *
 * Effect of a family, per unit (organoid, session or subject): OLS slope of the
 * effective dimensionality of the unit's dissimilarity matrix on the graded
 * manipulation level, baseline included (level 0 → 1 spans the family's
 * declared schedule). Across units: mean slope with its t interval. An absence
 * further requires every level's contrast with the baseline to lie within
 * ±SESOI (monotonicity guard): a response that rises then falls has a slope
 * near 0 and would otherwise be read as no effect.
 *
 * Interpretability gates, each of which turns a verdict into "undetermined":
 *   · MANIPULATION CHECK — the family must raise the prediction error of its own
 *     channel (lower bound of the interval > 0). A null effect from a
 *     manipulation that did not reach the system decides nothing.
 *   · SPECIFICITY — the family must raise its own channel's error more than the
 *     other channel's (own lower bound > other upper bound). Otherwise an effect
 *     cannot be attributed to one family.
 *   · A DECREASE of dimensionality is an anomaly against the §6.3 prediction;
 *     it goes first to rank 1 of the revision order (inference procedure and
 *     measurement auxiliaries), not to the theses.
 *
 * Confirmatory use — the only use that may set `dimensionalityFromInteroception`
 * for withdrawal.ts — requires a protocol FILED on a registry before the data
 * (every observation dated after `filedAt`), with no open parameter, an
 * unchanged hash, separated channels, a non-blocking ethics declaration and
 * observations of `reported` origin. ASTRA's own simulations test the pipeline,
 * never the thesis: a simulated observation can only ever yield an exploratory
 * report.
 *
 * Effective dimensionality is a property of a matrix of distances between
 * responses. It is not a degree of experience, and nothing here is one
 * (prohibition 1); matching dimensionality changes are not an identity with
 * phenomenality (prohibition 2).
 *
 * © 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
 */

import { createHash } from 'node:crypto';
import {
  rdmFromPatterns, effectiveDimensionality, olsSlope, tInterval, validateRdm,
  type DissimilarityMetric, type MeanInterval,
} from '../dimensionality.js';
import { validateConditionSpace, localRng, type ConditionSpec } from '../congruence.js';
import { checkChannelSeparation } from '../interoception.js';
import { evaluateWithdrawal, type KinaestheticPattern, type ThesisEvaluation } from './withdrawal.js';

export type UnitKind = 'organoid' | 'session' | 'subject' | 'simulation-seed';
export type DeliveryTarget = 'silicon' | 'living-culture' | 'human';
/**
 * How each unit's dissimilarity matrix is obtained: computed from response
 * patterns (`correlation` = 1 − r, `euclidean`), or supplied directly as
 * 1 − judged similarity between pairs (document II §6.2: "jugements de
 * similarité entre paires de conditions").
 */
export type ProtocolDissimilarity = DissimilarityMetric | 'judged-similarity';

export interface KinaestheticProtocol {
  id: string;
  title: string;
  /**
   * 'pilot' — declared exploratory: it tests the instrument and NEVER sets a
   * withdrawal outcome, whatever its data. 'confirmatory' — may, under every
   * confirmatory condition (rc.5, FCS-K0 / FCS-K1).
   */
  role: 'confirmatory' | 'pilot';
  status: 'draft' | 'filed';
  /** Time-stamped registry record; required once filed. */
  registry: { name: string; reference: string; filedAt: string } | null;
  unit: UnitKind | null;
  /** Minimum number of units with usable data in EACH family. */
  minUnits: number | null;
  /** One-sided α of each test; the intervals are (1 − 2α). */
  alpha: number | null;
  /** Smallest dimensionality effect of interest: participation-ratio units per full level range (0 → 1). */
  sesoi: number | null;
  /**
   * What counts as an effect PRESENT: 'superiority' — the lower bound of the
   * (1 − 2α) interval exceeds 0; 'minimum-effect' — it exceeds the SESOI.
   * Absence is always equivalence within ±SESOI. The author's choice, before data.
   */
  effectCriterion: 'superiority' | 'minimum-effect' | null;
  dissimilarity: ProtocolDissimilarity;
  conditions: ConditionSpec[];
  deliveryTarget: DeliveryTarget;
  /** Ethics approval reference; required for living cultures and human subjects. */
  ethicsReference: string | null;
  /** Physical signals of each channel, for the separation check. */
  sourceSignals: { somatosensory: string[]; interoceptive: string[] };
}

export interface KinaestheticObservation {
  unitId: string;
  conditionId: string;
  /** ISO 8601 time the data were collected. */
  collectedAt: string;
  origin: 'simulated' | 'reported';
  /** Dissimilarity matrix over the probe items, or patterns to compute it from. */
  rdm?: number[][];
  patterns?: number[][];
  /** Prediction errors of both channels under this condition (body-loop.ts `runConditions`). */
  manipulationCheck?: { sensorimotorError: number; interoceptiveError: number };
}

export type EthicsDecision = 'PASS' | 'WARN' | 'BLOCK';

export interface FrozenProtocol {
  protocol: KinaestheticProtocol;
  sha256: string;
  openParameters: string[];
  conditionProblems: string[];
  channelOverlap: string[];
  ethics: { decision: EthicsDecision; reasons: string[] };
}

// ── Protocol ──────────────────────────────────────────────────────

function canonical(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`;
  if (v && typeof v === 'object') {
    return `{${Object.keys(v as Record<string, unknown>).sort()
      .filter((k) => (v as Record<string, unknown>)[k] !== undefined)
      .map((k) => `${JSON.stringify(k)}:${canonical((v as Record<string, unknown>)[k])}`).join(',')}}`;
  }
  return JSON.stringify(v);
}

/**
 * SHA-256 of the protocol's SCIENTIFIC content, canonical JSON with keys sorted:
 * the identity a registry entry quotes. `status` and `registry` are excluded —
 * they are filing metadata, written AFTER the hash has been quoted on the
 * registry; including them would make every filed protocol mismatch its own
 * registered hash (corrected in rc.5 while completing FCS-K0/K1).
 */
export function protocolHash(p: KinaestheticProtocol): string {
  const { status: _status, registry: _registry, ...scientific } = p;
  return createHash('sha256').update(canonical(scientific)).digest('hex');
}

/**
 * Ethics declaration of what the manipulations are delivered to. Living tissue
 * and human subjects need an approval reference; living cultures also fall
 * under the welfare thresholds of the ethics monitor whatever the reference.
 */
export function checkDeliveryEthics(p: Pick<KinaestheticProtocol, 'deliveryTarget' | 'ethicsReference'>): { decision: EthicsDecision; reasons: string[] } {
  const reasons: string[] = [];
  const ref = p.ethicsReference?.trim();
  if (p.deliveryTarget === 'silicon') return { decision: 'PASS', reasons: ['Manipulations delivered to a silicon substrate.'] };
  if (!ref) {
    reasons.push(`${p.deliveryTarget === 'human' ? 'Human subjects' : 'A living culture'} receive the manipulations and no ethics approval reference is declared.`);
    return { decision: 'BLOCK', reasons };
  }
  reasons.push(`Ethics approval declared: ${ref}.`);
  if (p.deliveryTarget === 'living-culture') {
    reasons.push('Stimulation of living tissue: the welfare thresholds of the ethics monitor (check_ethics) apply to every session, ' +
      'and protective-threshold (nociceptive) channels are not to be delivered to the culture without a stated justification.');
  } else {
    reasons.push('Human subjects: informed consent and the right to withdraw at any time apply to every session.');
  }
  return { decision: 'WARN', reasons };
}

/** Hash, open parameters and structural checks of a protocol. */
export function freezeProtocol(p: KinaestheticProtocol): FrozenProtocol {
  const open: string[] = [];
  if (p.unit === null) open.push('unit');
  if (p.minUnits === null) open.push('minUnits');
  else if (!(Number.isInteger(p.minUnits) && p.minUnits >= 2)) open.push('minUnits (integer ≥ 2)');
  if (p.alpha === null) open.push('alpha');
  else if (!(p.alpha > 0 && p.alpha < 0.5)) open.push('alpha (in (0, 0.5))');
  if (p.sesoi === null) open.push('sesoi');
  else if (!(p.sesoi > 0 && Number.isFinite(p.sesoi))) open.push('sesoi (> 0)');
  if (p.effectCriterion === null || p.effectCriterion === undefined) open.push('effectCriterion');
  if (p.role !== 'confirmatory' && p.role !== 'pilot') open.push('role (confirmatory | pilot)');
  if (!['correlation', 'euclidean', 'judged-similarity'].includes(p.dissimilarity)) open.push('dissimilarity');
  if (p.status === 'filed' && !(p.registry?.name && p.registry.reference && Number.isFinite(Date.parse(p.registry.filedAt)))) {
    open.push('registry (name, reference, filedAt)');
  }
  return {
    protocol: p,
    sha256: protocolHash(p),
    openParameters: open,
    conditionProblems: validateConditionSpace(p.conditions),
    channelOverlap: checkChannelSeparation(p.sourceSignals.somatosensory, p.sourceSignals.interoceptive),
    ethics: checkDeliveryEthics(p),
  };
}

/**
 * A protocol template with every author decision left open. The condition
 * schedule is an EXAMPLE of the graded space of document II §6.2 (reafference
 * delays; interoceptive gain and decoupling) — the levels, like α, the SESOI
 * and the unit, are the author's to fix before any data.
 */
export function protocolTemplate(): KinaestheticProtocol {
  return {
    id: 'FCS-K-template',
    title: 'Withdrawal test of the kinaesthetic thesis: dimensionality under sensorimotor vs interoceptive incongruence',
    role: 'confirmatory',
    status: 'draft',
    registry: null,
    unit: null,
    minUnits: null,
    alpha: null,
    sesoi: null,
    effectCriterion: null,
    dissimilarity: 'correlation',
    conditions: [
      { id: 'congruent', family: 'baseline', level: 0, sensorimotor: [], interoceptive: [] },
      { id: 'sm-delay-1', family: 'sensorimotor', level: 1 / 3, sensorimotor: [{ kind: 'delay', ms: 50 }], interoceptive: [] },
      { id: 'sm-delay-2', family: 'sensorimotor', level: 2 / 3, sensorimotor: [{ kind: 'delay', ms: 150 }], interoceptive: [] },
      { id: 'sm-delay-3', family: 'sensorimotor', level: 1, sensorimotor: [{ kind: 'delay', ms: 400 }], interoceptive: [] },
      { id: 'io-gain-1', family: 'interoceptive', level: 1 / 3, sensorimotor: [], interoceptive: [{ kind: 'gain', factor: 1.5 }] },
      { id: 'io-gain-2', family: 'interoceptive', level: 2 / 3, sensorimotor: [], interoceptive: [{ kind: 'gain', factor: 2.5 }] },
      { id: 'io-decouple', family: 'interoceptive', level: 1, sensorimotor: [], interoceptive: [{ kind: 'decouple', seed: 1 }] },
    ],
    deliveryTarget: 'silicon',
    ethicsReference: null,
    sourceSignals: { somatosensory: [], interoceptive: [] },
  };
}

// ── Analysis ──────────────────────────────────────────────────────

export type FamilyClassification = 'increase' | 'equivalent' | 'decrease' | 'inconclusive';
export type CheckStatus = 'passed' | 'failed' | 'non-specific' | 'not-supplied' | 'insufficient-units';

export interface UnitEffect {
  unitId: string;
  levels: number[];
  participationRatio: number[];
  slope: number;
  /** Own-channel and other-channel prediction-error slopes, when supplied. */
  ownErrorSlope: number | null;
  otherErrorSlope: number | null;
}

export interface FamilyResult {
  family: 'sensorimotor' | 'interoceptive';
  units: number;
  effect: MeanInterval | null;
  classification: FamilyClassification | 'insufficient-units';
  manipulationCheck: { status: CheckStatus; own: MeanInterval | null; other: MeanInterval | null };
  perUnit: UnitEffect[];
  excludedUnits: Array<{ unitId: string; reason: string }>;
  /**
   * Per-level contrasts (level − baseline) across units, with their (1 − 2α)
   * intervals. An ABSENCE is declared only if the slope AND every level lie
   * within ±SESOI (decision of 20 October 2026, after the K0 dry run showed a
   * non-monotone response that a slope alone reads as "equivalent").
   */
  levelContrasts: Array<{ level: number; units: number; interval: MeanInterval | null; withinSesoi: boolean | null }>;
  /** 'failed' = slope equivalent but some level is not: the family is read as inconclusive. */
  monotonicityGuard: 'passed' | 'failed' | 'not-applicable';
}

export interface KinaestheticAnalysis {
  protocolId: string;
  sha256: string;
  confirmatory: boolean;
  confirmatoryRefusals: string[];
  families: { sensorimotor: FamilyResult; interoceptive: FamilyResult };
  pattern: KinaestheticPattern | 'undetermined';
  undeterminedReasons: string[];
  /** What may be passed to `evaluateWithdrawal` — null unless the run is confirmatory. */
  withdrawalOutcome: { dimensionalityFromInteroception: boolean | null; kinaestheticPattern: KinaestheticPattern | null };
  /** The kinaesthetic thesis as `evaluateWithdrawal` reads this outcome. */
  kinaestheticStanding: ThesisEvaluation;
  observations: { total: number; used: number; origins: string[] };
  scopeNoteEn: string;
  scopeNoteFr: string;
}

/**
 * Three-way reading of an interval. Equivalence is tested first: an interval
 * inside ±SESOI is a negligible effect even when it excludes 0. Without a SESOI
 * nothing can be classified as present or absent in the sense of the
 * withdrawal condition (see `analyseKinaestheticTest`).
 */
export function classifyEffect(ci: MeanInterval, sesoi: number | null, criterion: 'superiority' | 'minimum-effect'): FamilyClassification {
  if (sesoi !== null && ci.lower > -sesoi && ci.upper < sesoi) return 'equivalent';
  const bound = criterion === 'minimum-effect' && sesoi !== null ? sesoi : 0;
  if (ci.lower > bound) return 'increase';
  if (ci.upper < -bound) return 'decrease';
  return 'inconclusive';
}

function edOf(o: KinaestheticObservation, metric: ProtocolDissimilarity): number {
  if (o.rdm) {
    const problems = validateRdm(o.rdm);
    if (problems.length) throw new RangeError(problems.slice(0, 2).join('; '));
    return effectiveDimensionality(o.rdm).participationRatio;
  }
  if (o.patterns) {
    if (metric === 'judged-similarity') throw new RangeError('a judged-similarity protocol takes an rdm (1 − similarity), not patterns');
    return effectiveDimensionality(rdmFromPatterns(o.patterns, metric)).participationRatio;
  }
  throw new RangeError('observation carries neither rdm nor patterns');
}

function familyResult(
  family: 'sensorimotor' | 'interoceptive',
  obs: readonly KinaestheticObservation[],
  conditions: readonly ConditionSpec[],
  metric: ProtocolDissimilarity,
  alpha: number,
  sesoi: number | null,
  minUnits: number,
  criterion: 'superiority' | 'minimum-effect',
): FamilyResult {
  const level = new Map(conditions.map((c) => [c.id, c]));
  const byUnit = new Map<string, KinaestheticObservation[]>();
  for (const o of obs) {
    const c = level.get(o.conditionId);
    if (!c || (c.family !== family && c.family !== 'baseline')) continue;
    if (!byUnit.has(o.unitId)) byUnit.set(o.unitId, []);
    byUnit.get(o.unitId)!.push(o);
  }
  const perUnit: UnitEffect[] = [];
  const excludedUnits: Array<{ unitId: string; reason: string }> = [];
  for (const [unitId, list] of [...byUnit.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    try {
      const levels = list.map((o) => level.get(o.conditionId)!.level);
      if (new Set(levels).size < 2 || !levels.includes(0)) {
        excludedUnits.push({ unitId, reason: 'needs the baseline and at least one manipulated level' });
        continue;
      }
      const pr = list.map((o) => edOf(o, metric));
      const slope = olsSlope(levels, pr)!;
      const checks = list.every((o) => o.manipulationCheck &&
        Number.isFinite(o.manipulationCheck.sensorimotorError) && Number.isFinite(o.manipulationCheck.interoceptiveError));
      let ownErrorSlope: number | null = null, otherErrorSlope: number | null = null;
      if (checks) {
        const own = list.map((o) => family === 'sensorimotor' ? o.manipulationCheck!.sensorimotorError : o.manipulationCheck!.interoceptiveError);
        const other = list.map((o) => family === 'sensorimotor' ? o.manipulationCheck!.interoceptiveError : o.manipulationCheck!.sensorimotorError);
        ownErrorSlope = olsSlope(levels, own);
        otherErrorSlope = olsSlope(levels, other);
      }
      perUnit.push({ unitId, levels, participationRatio: pr, slope, ownErrorSlope, otherErrorSlope });
    } catch (e) {
      excludedUnits.push({ unitId, reason: (e as Error).message });
    }
  }
  const n = perUnit.length;
  if (n < Math.max(2, minUnits)) {
    return { family, units: n, effect: null, classification: 'insufficient-units',
      manipulationCheck: { status: 'insufficient-units', own: null, other: null }, perUnit, excludedUnits,
      levelContrasts: [], monotonicityGuard: 'not-applicable' };
  }
  const effect = tInterval(perUnit.map((u) => u.slope), alpha);
  const withChecks = perUnit.filter((u) => u.ownErrorSlope !== null && u.otherErrorSlope !== null);
  let manipulationCheck: FamilyResult['manipulationCheck'];
  if (withChecks.length < n) manipulationCheck = { status: 'not-supplied', own: null, other: null };
  else {
    const own = tInterval(withChecks.map((u) => u.ownErrorSlope!), alpha);
    const other = tInterval(withChecks.map((u) => u.otherErrorSlope!), alpha);
    const status: CheckStatus = !(own.lower > 0) ? 'failed' : !(own.lower > other.upper) ? 'non-specific' : 'passed';
    manipulationCheck = { status, own, other };
  }
  // Per-level contrasts against the unit's own baseline.
  const levelsUsed = [...new Set(perUnit.flatMap((u) => u.levels))].filter((l) => l !== 0).sort((a, b) => a - b);
  const levelContrasts = levelsUsed.map((level) => {
    const diffs: number[] = [];
    for (const u of perUnit) {
      const at = (l: number) => {
        const v = u.levels.map((x, i) => (x === l ? u.participationRatio[i] : NaN)).filter((x) => !Number.isNaN(x));
        return v.length ? v.reduce((a, b) => a + b, 0) / v.length : NaN;
      };
      const d = at(level) - at(0);
      if (Number.isFinite(d)) diffs.push(d);
    }
    const interval = diffs.length >= 2 ? tInterval(diffs, alpha) : null;
    const withinSesoi = interval && sesoi !== null ? interval.lower > -sesoi && interval.upper < sesoi : null;
    return { level, units: diffs.length, interval, withinSesoi };
  });
  let classification: FamilyClassification = classifyEffect(effect, sesoi, criterion);
  let monotonicityGuard: FamilyResult['monotonicityGuard'] = 'not-applicable';
  if (classification === 'equivalent') {
    monotonicityGuard = levelContrasts.every((c) => c.withinSesoi === true) ? 'passed' : 'failed';
    if (monotonicityGuard === 'failed') classification = 'inconclusive';
  }
  return { family, units: n, effect, classification, manipulationCheck, perUnit, excludedUnits, levelContrasts, monotonicityGuard };
}

/** Pattern of the two families, with the reasons a verdict is withheld. */
export function derivePattern(sm: FamilyResult, io: FamilyResult): { pattern: KinaestheticPattern | 'undetermined'; reasons: string[] } {
  const reasons: string[] = [];
  for (const f of [sm, io]) {
    if (f.classification === 'insufficient-units') reasons.push(`${f.family}: fewer usable units than the protocol requires`);
    if (f.manipulationCheck.status === 'failed') reasons.push(`${f.family}: manipulation check failed — the manipulation did not raise its own channel's prediction error; a null effect would be uninterpretable`);
    if (f.manipulationCheck.status === 'non-specific') reasons.push(`${f.family}: manipulation not specific — it raised the other channel's error as much as its own; effects cannot be attributed`);
    if (f.manipulationCheck.status === 'not-supplied') reasons.push(`${f.family}: manipulation check not supplied`);
    if (f.classification === 'inconclusive' && f.monotonicityGuard === 'failed') {
      reasons.push(`${f.family}: the slope is equivalent but at least one level is not within ±SESOI — a non-monotone response cannot be read as an absence`);
    } else if (f.classification === 'inconclusive') reasons.push(`${f.family}: effect neither shown nor excluded at the preregistered bound`);
    if (f.classification === 'decrease') reasons.push(`${f.family}: dimensionality decreased — an anomaly against the §6.3 prediction, to be examined first at rank 1 (inference procedure and measurement auxiliaries)`);
  }
  if (reasons.length) return { pattern: 'undetermined', reasons };
  const s = sm.classification, i = io.classification;
  if (i === 'increase' && s === 'equivalent') return { pattern: 'interoceptive-only', reasons };
  if (s === 'increase' && i === 'equivalent') return { pattern: 'sensorimotor-only', reasons };
  if (s === 'increase' && i === 'increase') return { pattern: 'both', reasons };
  if (s === 'equivalent' && i === 'equivalent') return { pattern: 'neither', reasons };
  return { pattern: 'undetermined', reasons: [`unexpected combination ${s} / ${i}`] };
}

/**
 * Analyses a set of observations under a frozen protocol. Always returns the
 * full exploratory analysis; sets the withdrawal outcome only when every
 * confirmatory condition holds.
 */
export function analyseKinaestheticTest(
  frozen: FrozenProtocol,
  observations: readonly KinaestheticObservation[],
): KinaestheticAnalysis {
  const p = frozen.protocol;
  const refusals: string[] = [];
  if (protocolHash(p) !== frozen.sha256) refusals.push('the protocol was modified after it was frozen (hash mismatch)');
  if (p.role === 'pilot') refusals.push('pilot protocol: exploratory by declaration — it tests the instrument, never the thesis');
  if (p.status !== 'filed') refusals.push('protocol not filed on a time-stamped registry: exploratory analysis only');
  if (frozen.openParameters.length) refusals.push(`open parameters: ${frozen.openParameters.join(', ')}`);
  if (frozen.conditionProblems.length) refusals.push(`condition space: ${frozen.conditionProblems.join('; ')}`);
  if (frozen.channelOverlap.length) refusals.push(`signals claimed by both channels: ${frozen.channelOverlap.join(', ')}`);
  if (frozen.ethics.decision === 'BLOCK') refusals.push(`ethics: ${frozen.ethics.reasons.join(' ')}`);
  const filedAt = p.registry ? Date.parse(p.registry.filedAt) : NaN;
  const known = new Set(p.conditions.map((c) => c.id));
  const usable = observations.filter((o) => known.has(o.conditionId));
  if (usable.length < observations.length) refusals.push(`${observations.length - usable.length} observation(s) refer to conditions outside the protocol`);
  const origins = [...new Set(usable.map((o) => o.origin))].sort();
  if (origins.includes('simulated')) refusals.push('simulated observations test the pipeline, not the thesis: they never set a withdrawal outcome');
  const badDates = usable.filter((o) => !Number.isFinite(Date.parse(o.collectedAt)));
  if (badDates.length) refusals.push(`${badDates.length} observation(s) without a valid collection date`);
  if (Number.isFinite(filedAt)) {
    const early = usable.filter((o) => Date.parse(o.collectedAt) <= filedAt);
    if (early.length) refusals.push(`${early.length} observation(s) collected before or at filing — the preregistration does not precede them`);
  }

  const alpha = p.alpha !== null && p.alpha > 0 && p.alpha < 0.5 ? p.alpha : 0.05;
  const minUnits = p.minUnits !== null && Number.isInteger(p.minUnits) && p.minUnits >= 2 ? p.minUnits : 2;
  const sesoi = p.sesoi !== null && p.sesoi > 0 ? p.sesoi : null;
  const criterion = p.effectCriterion ?? 'superiority';
  if (p.alpha === null) refusals.push('α not fixed: the exploratory analysis uses 0.05, which decides nothing');
  const sm = familyResult('sensorimotor', usable, p.conditions, p.dissimilarity, alpha, sesoi, minUnits, criterion);
  const io = familyResult('interoceptive', usable, p.conditions, p.dissimilarity, alpha, sesoi, minUnits, criterion);
  const derived = derivePattern(sm, io);
  let pattern = derived.pattern;
  const reasons = derived.reasons;
  if (sesoi === null) {
    // Without a SESOI no absence can be shown, and a tiny interval above 0 would read as "increase":
    // 'both' could then be derived from a negligible effect. Withhold every pattern.
    pattern = 'undetermined';
    reasons.push('no SESOI: absence of an effect cannot be shown, so neither leg of the withdrawal condition can be decided');
  }

  const confirmatory = refusals.length === 0;
  const decided = confirmatory && pattern !== 'undetermined';
  const withdrawalOutcome = {
    dimensionalityFromInteroception: decided ? pattern === 'interoceptive-only' : null,
    kinaestheticPattern: decided ? (pattern as KinaestheticPattern) : null,
  };
  const kinaestheticStanding = evaluateWithdrawal(withdrawalOutcome).evaluations.find((e) => e.thesis === 'kinaesthetic')!;
  return {
    protocolId: p.id, sha256: frozen.sha256, confirmatory, confirmatoryRefusals: refusals,
    families: { sensorimotor: sm, interoceptive: io },
    pattern, undeterminedReasons: reasons, withdrawalOutcome, kinaestheticStanding,
    observations: { total: observations.length, used: usable.length, origins },
    scopeNoteEn:
      'Effective dimensionality is the participation ratio of the classical-MDS spectrum of each unit\'s dissimilarity ' +
      'matrix: a property of distances between responses, compared across graded congruence conditions. The test ' +
      'decides between two closures of a loop (document II §4.2); it attributes no experience to any substrate.',
    scopeNoteFr:
      "La dimensionnalité effective est le rapport de participation du spectre MDS classique de la matrice de dissimilarité " +
      "de chaque unité : une propriété des distances entre réponses, comparée entre conditions de congruence graduées. " +
      "Le test départage deux clôtures d'une boucle (document II §4.2) ; il n'attribue d'expérience à aucun substrat.",
  };
}

// ── Synthetic validation (positive and negative controls of the pipeline) ──

export interface SyntheticOptions {
  /** Which family carries a planted dimensionality effect. */
  plant: KinaestheticPattern;
  units: number;
  items: number;
  features: number;
  /** Decoupling of the two coupled axes at level 1, in [0, 1]. */
  effect: number;
  noise: number;
  seed: number;
  collectedAt: string;
  /** A family whose manipulation check is made to fail (its own-channel error does not rise). */
  failCheck?: 'sensorimotor' | 'interoceptive' | null;
}

/**
 * Synthetic observations with a KNOWN answer. Probe items carry two latent
 * dimensions that are coupled under closure (one axis drives both) and decouple
 * in proportion to the manipulation level of the planted family — the
 * structure document II §6.3 predicts. Every observation is `simulated`: the
 * output validates the analysis, it is not evidence about any substrate.
 */
export function synthesizeObservations(protocol: KinaestheticProtocol, o: SyntheticOptions): KinaestheticObservation[] {
  if (!(o.units >= 2 && o.items >= 4 && o.features >= 3)) throw new RangeError('need ≥ 2 units, ≥ 4 items, ≥ 3 features');
  if (!(o.effect >= 0 && o.effect <= 1)) throw new RangeError('effect must lie in [0, 1]');
  const rng = localRng(o.seed);
  const g = () => { let u = 0, v = 0; while (u === 0) u = rng(); while (v === 0) v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const planted = (fam: string) => o.plant === 'both' || (o.plant === 'sensorimotor-only' && fam === 'sensorimotor') ||
    (o.plant === 'interoceptive-only' && fam === 'interoceptive');
  const out: KinaestheticObservation[] = [];
  for (let u = 0; u < o.units; u++) {
    const a = Array.from({ length: o.items }, g);
    const b = Array.from({ length: o.items }, g);
    const w1 = Array.from({ length: o.features }, g);
    const w2 = Array.from({ length: o.features }, g);
    const unitGain = 0.8 + 0.4 * rng();
    for (const c of protocol.conditions) {
      const s = c.family !== 'baseline' && planted(c.family) ? Math.min(1, o.effect * c.level * unitGain) : 0;
      const patterns = a.map((ai, i) => {
        const second = (1 - s) * ai + s * b[i];
        return w1.map((w, k) => w * ai + w2[k] * second + o.noise * g());
      });
      const own = c.family === 'baseline' ? 0 : (o.failCheck === c.family ? 0 : 0.2 * c.level);
      const smErr = 0.03 + (c.family === 'sensorimotor' ? own : 0) + 0.002 * g();
      const ioErr = 0.03 + (c.family === 'interoceptive' ? own : 0) + 0.002 * g();
      out.push({ unitId: `unit-${u + 1}`, conditionId: c.id, collectedAt: o.collectedAt, origin: 'simulated', patterns,
        manipulationCheck: { sensorimotorError: smErr, interoceptiveError: ioErr } });
    }
  }
  return out;
}
