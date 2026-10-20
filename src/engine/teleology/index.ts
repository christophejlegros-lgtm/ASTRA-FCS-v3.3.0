/**
 * ASTRA — Functional teleology under constraints (v3.3.0-rc.2)
 * ════════════════════════════════════════════════════════════
 * Declared-purpose assessment: a contract states a purpose, an assigned
 * function, criteria (goals) and constraints with thresholds; outcomes report
 * intervals; the module says whether constraints hold (admissibility), whether
 * goals are met (attainment), and — optionally — an additive value conditional
 * on declared anchors and weights. No actuator, no state mutation, no causal
 * inference. Exposition: TELEOLOGY.fr.md.
 *
 * rc.2 — the rules the exposition states are now enforced, not only declared:
 *   · an ordinal criterion (unit naming a rank, stratum, level, class…) may carry
 *     a threshold and enter Pareto comparison, never the additive utility — the
 *     same unit test as FCS prohibition 4 (`isOrdinalUnit`);
 *   · no goal or constraint may be stated on consciousness, sentience or
 *     phenomenality (FCS prohibitions 1–2): the extension evaluates no end on
 *     such a quantity, whatever the threshold;
 *   · every report restates the contract's purpose, function and owner, so the
 *     server-wide claim guard screens them;
 *   · an outcome is "admissible" relative to the declared constraints only, and
 *     the report says when that set is empty.
 *
 * © 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
 */
import { z } from 'zod';
import { isOrdinalUnit } from '../fcs/negative-heuristic.js';

const label = z.string().trim().min(1).max(2000);
const id = z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/);
const number = z.number().finite().min(-1e12).max(1e12);

/**
 * Words that put a criterion on consciousness, sentience or phenomenality.
 * Deliberately narrow, matched on the criterion's id, description and unit.
 */
export const PHENOMENAL_TERMS =
  /(conscious|conscien|sentien|phenomen|phénomén|qualia|awareness|subjective experience|expérience subjective|lived experience|expérience vécue)/iu;

const criterion = z.object({
  id, description: label, beneficiary: label, unit: label,
  scale: z.enum(['cardinal', 'ordinal', 'unspecified']).optional(),
  direction: z.enum(['minimize', 'maximize']), threshold: number,
}).strict();
export const contractSchema = z.object({
  id, purpose: label, function: label, owner: label, context: label, horizon: label,
  criteria: z.array(criterion).min(1).max(100),
  constraints: z.array(criterion).max(100),
  // Optional explicit cardinal value model, never inferred from ordinal FCS ranks.
  utility: z.object({
    rationale: label,
    terms: z.array(z.object({
      criterionId: id, worst: number, best: number,
      weight: z.number().finite().positive().max(1),
    }).strict()).min(1).max(100),
  }).strict().optional(),
}).strict().superRefine((c, ctx) => {
  const ids = [...c.criteria, ...c.constraints].map(x => x.id);
  const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
  if (new Set(ids).size !== ids.length) issue('Criterion and constraint IDs must be unique.');
  for (const k of [...c.criteria, ...c.constraints]) {
    if (PHENOMENAL_TERMS.test(`${k.id} ${k.description} ${k.unit}`))
      issue(`Criterion "${k.id}" is stated on consciousness or phenomenality: this extension evaluates no end ` +
        'or constraint on such a quantity (FCS prohibitions 1 and 2).');
  }
  if (!c.utility) return;
  const terms = c.utility.terms;
  if (terms.length !== c.criteria.length || new Set(terms.map(t => t.criterionId)).size !== terms.length)
    issue('Utility must cover each objective exactly once.');
  if (Math.abs(terms.reduce((sum, t) => sum + t.weight, 0) - 1) > 1e-9)
    issue('Utility weights must sum to one.');
  for (const t of terms) {
    const k = c.criteria.find(k => k.id === t.criterionId);
    if (!k || (k.direction === 'maximize' ? t.best <= t.worst : t.best >= t.worst))
      issue('Utility anchors must follow the criterion direction with a nonzero span.');
    if (k && k.scale !== 'cardinal')
      issue(`Criterion "${k.id}" requires an explicit cardinal scale declaration for additive utility.`);
    if (k && isOrdinalUnit(k.unit))
      issue(`Criterion "${k.id}" has an ordinal unit ("${k.unit}"): it may carry a threshold and enter the Pareto ` +
        'comparison, never the additive utility (FCS prohibition 4).');
  }
});
export const outcomeSchema = z.object({
  id, kind: z.enum(['observed', 'simulated', 'predicted']),
  source: label, context: label, horizon: label,
  observations: z.array(z.object({
    criterionId: id, unit: label, lower: number, upper: number,
  }).strict().refine(o => o.lower <= o.upper, 'Reversed interval')).max(200),
}).strict().superRefine((o, ctx) => {
  if (new Set(o.observations.map(v => v.criterionId)).size !== o.observations.length)
    ctx.addIssue({ code: 'custom', message: 'Duplicate observations.' });
});
export const assessmentShape = { contract: contractSchema, outcome: outcomeSchema };
export const comparisonShape = {
  contract: contractSchema, outcomes: z.array(outcomeSchema).min(2).max(50),
};
type Contract = z.infer<typeof contractSchema>;
type Outcome = z.infer<typeof outcomeSchema>;
type Status = 'pass' | 'fail' | 'unknown';

export const TELEOLOGY_FRAMEWORK = {
  purpose: 'Evaluate declared purposes against supplied outcome intervals.',
  distinctions: ['declared goal', 'assigned function', 'reported outcome', 'stakeholder value'],
  rule: 'Hard constraints precede utility. Missing or overlapping evidence stays unknown.',
  comparison: 'Robust interval Pareto dominance; no forced total ranking.',
  utility: 'Optional bounded additive value conditional on declared anchors and weights. Exact over the box of ' +
    'declared intervals; not a probabilistic expectation.',
  enforced: [
    'An ordinal criterion (unit naming a rank, stratum, level, class, score or index) never enters the additive utility (FCS prohibition 4).',
    'No goal or constraint may be stated on consciousness, sentience or phenomenality (FCS prohibitions 1 and 2).',
    'Admissibility is relative to the declared constraints; an empty set is reported as such.',
    'Each report restates purpose, function and owner, so the server-wide claim guard screens them.',
  ],
  limits: ['Sources and contexts are declared, not independently verified.',
    'No causal attribution, inner intention, or empirical validation follows from this calculation.',
    'Function is analysed by contribution to a declared capacity (Cummins 1975); that analysis does not explain why a component exists.',
    'No actions are executed; no biological substrate is controlled.'],
};

function evaluate(c: Contract, o: Outcome) {
  if (c.context !== o.context || c.horizon !== o.horizon)
    throw new Error('Outcome context and horizon must match the contract.');
  const all = [...c.criteria, ...c.constraints];
  for (const v of o.observations) {
    const k = all.find(k => k.id === v.criterionId);
    if (!k || v.unit !== k.unit) throw new Error('Unknown criterion or mismatched unit.');
  }
  const rows = all.map(k => {
    const v = o.observations.find(v => v.criterionId === k.id);
    let status: Status = 'unknown';
    if (v) status = k.direction === 'maximize'
      ? (v.lower >= k.threshold ? 'pass' : v.upper < k.threshold ? 'fail' : 'unknown')
      : (v.upper <= k.threshold ? 'pass' : v.lower > k.threshold ? 'fail' : 'unknown');
    return { id: k.id, beneficiary: k.beneficiary, unit: k.unit, status,
      interval: v ? [v.lower, v.upper] : null };
  });
  const constraints = rows.slice(c.criteria.length);
  const admissibility = constraints.some(r => r.status === 'fail') ? 'rejected'
    : constraints.some(r => r.status === 'unknown') ? 'undetermined' : 'admissible';
  const goals = rows.slice(0, c.criteria.length);
  const attainment = goals.some(r => r.status === 'fail') ? 'not_met'
    : goals.some(r => r.status === 'unknown') ? 'undetermined' : 'met';
  let utility: { lower: number; upper: number; conditional: true } | null = null;
  if (c.utility && admissibility === 'admissible' && goals.every(r => r.interval)) {
    const bounds = c.utility.terms.map(t => {
      const v = o.observations.find(v => v.criterionId === t.criterionId)!;
      const score = (x: number) => Math.max(0, Math.min(1, (x - t.worst) / (t.best - t.worst)));
      const a = score(v.lower), b = score(v.upper);
      return { lower: Math.min(a, b) * t.weight, upper: Math.max(a, b) * t.weight };
    });
    const weightSum = c.utility.terms.reduce((sum, t) => sum + t.weight, 0);
    utility = { lower: Math.max(0, Math.min(1, bounds.reduce((s, b) => s + b.lower, 0) / weightSum)),
      upper: Math.max(0, Math.min(1, bounds.reduce((s, b) => s + b.upper, 0) / weightSum)), conditional: true };
  }
  return { contractSnapshot: c, contractId: c.id, purpose: c.purpose, function: c.function, owner: c.owner,
    outcomeId: o.id, evidenceKind: o.kind, source: o.source,
    admissibility,
    admissibilityBasis: c.constraints.length ? 'declared-constraints' : 'empty-contract',
    constraintsDeclared: c.constraints.length,
    attainment, criteria: goals, constraints, utility,
    interpretation: c.constraints.length
      ? 'Conditional on supplied data and declared values; no causal inference.'
      : 'Conditional on supplied data and declared values; no causal inference. No constraint was declared: ' +
        '"admissible" certifies nothing beyond the empty contract.' };
}
export function assess(input: unknown) {
  const { contract, outcome } = z.object(assessmentShape).strict().parse(input);
  return evaluate(contract, outcome);
}
export function compare(input: unknown) {
  const { contract: c, outcomes } = z.object(comparisonShape).strict().parse(input);
  if (new Set(outcomes.map(o => o.id)).size !== outcomes.length)
    throw new Error('Outcome IDs must be unique.');
  if (new Set(outcomes.map(o => o.kind)).size !== 1)
    throw new Error('Do not mix observed, simulated and predicted outcomes in a ranking.');
  const reports = outcomes.map(o => evaluate(c, o));
  const eligible = outcomes.filter((_, i) => reports[i].admissibility === 'admissible'
    && reports[i].criteria.every(r => r.interval));
  const dominates = (a: Outcome, b: Outcome) => {
    let strict = false;
    for (const k of c.criteria) {
      const av = a.observations.find(v => v.criterionId === k.id)!;
      const bv = b.observations.find(v => v.criterionId === k.id)!;
      const delta = k.direction === 'maximize' ? av.lower - bv.upper : bv.lower - av.upper;
      if (delta < 0) return false;
      if (delta > 0) strict = true;
    }
    return strict;
  };
  const dominance = eligible.flatMap(a => eligible.filter(b => b !== a && dominates(a, b))
    .map(b => ({ better: a.id, worse: b.id })));
  return { contractSnapshot: c, contractId: c.id, purpose: c.purpose, function: c.function, owner: c.owner,
    reports, dominance,
    nonDominated: eligible.filter(o => !dominance.some(d => d.worse === o.id)).map(o => o.id),
    excluded: outcomes.filter(o => !eligible.includes(o)).map(o => o.id),
    interpretation: 'Non-dominated does not mean optimal. Utility does not override constraints.' };
}
