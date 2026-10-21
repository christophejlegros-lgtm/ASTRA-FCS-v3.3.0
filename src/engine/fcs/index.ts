/**
 * ASTRA × FCS — Substrate-constrained functionalism layer
 * ═══════════════════════════════════════════════════════
 * Implements, inside ASTRA, the values of:
 *   · Fonctionnalisme contraint par le substrat, document I v1.5
 *   · Complément métaphysique, document II v1.4
 *   · L'implémentation neurochimique, document IV v1.3 (06·10·2026)
 *   · Synthèse illustrée S-1.6 (06·10·2026), incl. its optogenetic belt extension
 * © Genève 2026 Christophe Jean Legros · Assistance Multi IA
 *
 * The layer is deliberately NOT a scoring module. It supplies:
 *   taxonomy        — 17 species–function pairs, 5 causal roles, 3 sub-criteria
 *   stratification  — Pareto dominance → a partial order in 8 strata
 *   levels          — the four-level framework mapped onto ASTRA's substrates
 *   conformance     — per-substrate audit binding live biomarkers to the taxonomy
 *   withdrawal      — withdrawal conditions and the declared revision order
 *   negativeHeuristic — the five prohibitions, enforced at runtime
 *   optogenetics    — S-1.6 belt extension: interventions, astrocytic anchoring
 *   references      — the source documents' verified-DOI apparatus
 *   agreement       — inter-rater agreement on the ordinal codings (v3.2.0)
 *   kinaestheticWithdrawal — the withdrawal test of the kinaesthetic thesis:
 *                     protocol, freeze, analysis, synthetic controls (v3.3.0-rc.5)
 */

export * from './taxonomy.js';
export * from './stratification.js';
export * from './levels.js';
export * from './conformance.js';
export * from './withdrawal.js';
export * from './negative-heuristic.js';
export * from './references.js';
export * from './optogenetics.js';
export * from './agreement.js';
export * from './kinaesthetic-withdrawal.js';

import { canonicalStratification, dominanceRelation, incomparableAcrossStrata, independenceChecks, episodeWindowSensitivity } from './stratification.js';
import { PAIRS } from './taxonomy.js';
import { CORE, FIELD_HYPOTHESIS, LEVELS, LEVEL_ORDER, LEVEL_ORDER_CAUTION, OPEN_QUESTIONS } from './levels.js';
import { PROHIBITIONS, PROHIBITION_ORDER } from './negative-heuristic.js';
import { REVISION_ORDER, THESES } from './withdrawal.js';
import { auditAll, levelCoverage, type BiomarkerInputs } from './conformance.js';
import { DOI_NOTE, REFERENCES } from './references.js';
import { beltExtensionS16 } from './optogenetics.js';

export const FCS_PROVENANCE = Object.freeze({
  documents: [
    'Fonctionnalisme contraint par le substrat — document I, v1.5',
    'Complément métaphysique — document II, v1.4',
    'L\'implémentation neurochimique — document IV, v1.3 (06·10·2026)',
    'Synthèse illustrée — S-1.6 (06·10·2026)',
  ],
  author: '© Genève 2026 Christophe Jean Legros · Assistance Multi IA',
  contact: 'Assistant-Multi-IA@proton.me',
});

/**
 * One consolidated view of the FCS layer, for the dashboard and for the
 * `fcs_report` MCP tool. Carries no aggregate quantity of any kind.
 */
export function fcsReport(bio: BiomarkerInputs = {}) {
  const strat = canonicalStratification();
  return {
    provenance: FCS_PROVENANCE,
    core: CORE,
    fieldHypothesis: FIELD_HYPOTHESIS,
    levels: LEVEL_ORDER.map((l) => LEVELS[l]),
    levelOrderCaution: LEVEL_ORDER_CAUTION,
    openQuestions: OPEN_QUESTIONS,
    levelCoverage: levelCoverage(),
    taxonomy: {
      pairCount: PAIRS.length,
      classCount: 13,
      roleCount: 5,
      strataCount: strat.strata.length,
      rule: strat.rule,
      ordinalisation: strat.ordinalisation,
      reproducesPublished: strat.reproducesPublished,
      divergences: strat.divergences,
      strata: strat.strata.map((s) => ({ index: s.index, pairIds: s.pairIds })),
      dominance: (() => {
        const rel = dominanceRelation();
        const across = incomparableAcrossStrata();
        return {
          comparable: rel.comparableCount,
          unorderedPairs: rel.unorderedPairCount,
          hasseEdges: rel.hasse.length,
          incomparableAcrossStrata: across.pairs.length,
          crossStratumPairs: across.crossStratumCount,
          noteEn: 'The strata present the partial order; they do not rank pairs across strata.',
          independence: independenceChecks().map((c) => ({
            relation: c.relation, test: c.test, cases: c.cases, violations: c.violations,
          })),
          episodeWindow: (() => {
            const w = episodeWindowSensitivity();
            return { reproducingFirstCutLog10: w.reproducingInterval, noteEn: w.noteEn };
          })(),
          aggregationRuleStatusEn:
            'Pareto dominance is the rule the programme adopts — a methodological discipline, not a logical necessity.',
        };
      })(),
    },
    substrates: auditAll(bio),
    negativeHeuristic: PROHIBITION_ORDER.map((p) => PROHIBITIONS[p]),
    beltExtension: beltExtensionS16(),
    revisionOrder: REVISION_ORDER.map((id) => ({
      rank: THESES[id].revisionRank, id, nameEn: THESES[id].nameEn, nameFr: THESES[id].nameFr,
    })),
    references: { count: REFERENCES.length, doiNote: DOI_NOTE },
  };
}
