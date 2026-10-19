/**
 * ASTRA × FCS — Consolidation checks (v3.2.0, analysis of 9 October 2026, §2, §5.2, §6)
 * © 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  PAIRS, independenceChecks, contractionCheck, profileChangeCheck, episodeWindowSensitivity,
  krippendorffAlpha, agreementReport, codingTemplate, tauRank,
  assessRevision, evaluateWithdrawal, type RevisionRecord,
  LEVELS, CORE, LEVEL_ORDER_CAUTION, OPEN_QUESTIONS, PROHIBITIONS, mayAggregate,
  auditSubstrate, fcsReport,
} from '../src/engine/fcs/index.js';
import { screen } from '../src/lint-guard.js';

describe('Pareto — a methodological choice, not the unique admissible rule', () => {
  it('no FCS text calls Pareto "the only admissible rule" any more', () => {
    const text = JSON.stringify([PROHIBITIONS.P4, mayAggregate([{ name: 'a', unit: null, values: [1] }, { name: 'b', unit: null, values: [2] }])]);
    assert.ok(!/only admissible rule|seule règle admissible/i.test(text));
    assert.match(PROHIBITIONS.P4.rationaleEn, /methodological discipline, not a logical necessity/);
  });
});

describe('Independence, stated precisely', () => {
  it('the dominance relation passes both checks by construction', () => {
    assert.equal(contractionCheck('dominance').violations, 0);
    assert.equal(profileChangeCheck('dominance').violations, 0);
  });

  it('the strata-induced weak order fails both, which is a reason not to read strata as ranks', () => {
    const c = contractionCheck('strata-induced weak order');
    const p = profileChangeCheck('strata-induced weak order');
    assert.ok(c.violations > 0 && p.violations > 0);
    assert.equal(c.cases, 17 * 120); // 17 removals × C(16, 2) pairs
    assert.ok(c.violations < c.cases && p.violations < p.cases);
  });

  it('reports four checks', () => {
    assert.equal(independenceChecks().length, 4);
  });
});

describe('Episode-window sensitivity', () => {
  it('the eight strata are reproduced for any first cut in [10⁻¹, 10⁰) s, and not outside', () => {
    const w = episodeWindowSensitivity();
    assert.deepEqual(w.reproducingInterval, [-1, -0.25]);
    for (const g of w.grid) assert.equal(g.reproducesPublished, g.firstCutLog10 >= -1 && g.firstCutLog10 < 0, `cut ${g.firstCutLog10}`);
  });
});

describe('Inter-rater agreement (Krippendorff α)', () => {
  // Canonical reliability data, 4 coders × 12 units; reference values computed
  // with the `krippendorff` Python package (nominal 0.743421, ordinal 0.815388, interval 0.849107).
  const n = null;
  const data = [
    [1, 2, 3, 3, 2, 1, 4, 1, 2, n, n, n],
    [1, 2, 3, 3, 2, 2, 4, 1, 2, 5, n, 3],
    [n, 3, 3, 3, 2, 3, 4, 2, 2, 5, 1, n],
    [1, 2, 3, 3, 2, 4, 4, 1, 2, 5, 1, n],
  ];
  it('matches the reference implementation on the canonical example', () => {
    assert.ok(Math.abs(krippendorffAlpha(data, 'nominal')! - 0.743421) < 1e-6);
    assert.ok(Math.abs(krippendorffAlpha(data, 'ordinal')! - 0.815388) < 1e-6);
    assert.ok(Math.abs(krippendorffAlpha(data, 'interval')! - 0.849107) < 1e-6);
  });

  it('a rater who copies the source table agrees perfectly and reproduces the strata', () => {
    const copy = { rater: 'copy', codings: PAIRS.map((p) => ({ pairId: p.id, d: p.d, tauLowerLog10: p.tauLog10[0], ablation: p.ablation })) };
    const r = agreementReport([copy]);
    assert.equal(r.perRater[0].alphaWithSource.d, 1);
    assert.equal(r.perRater[0].alphaWithSource.tauRank, 1);
    assert.equal(r.perRater[0].stratification?.reproducesPublished, true);
    assert.equal(r.perRater[0].dominanceAgreement, 1);
    assert.equal(r.alpha.d, null, 'α across raters needs two raters');
  });

  it('a rater who shifts one ablation degree is detected', () => {
    const codings = PAIRS.map((p) => ({ pairId: p.id, d: p.d, tauRank: tauRank(p), ablation: p.id === '6' ? 3 : p.ablation }));
    const r = agreementReport([{ rater: 'x', codings }, { rater: 'copy', codings: PAIRS.map((p) => ({ pairId: p.id, d: p.d, tauRank: tauRank(p), ablation: p.ablation })) }]);
    assert.ok(r.alpha.ablation! < 1);
    assert.equal(r.alpha.d, 1);
    assert.ok(r.perRater[0].dominanceAgreement! < 1);
  });

  it('the coding template carries no published value', () => {
    const t = codingTemplate();
    assert.equal(t.pairs.length, 17);
    for (const p of t.pairs) assert.ok(p.d === null && p.tauLowerLog10 === null && p.ablation === null);
    assert.ok(!('publishedStratum' in t.pairs[0]));
  });
});

describe('Lakatosian revision records', () => {
  const base: RevisionRecord = {
    thesis: 'inference-and-measurement', date: '2026-10-09',
    motivatingDatum: 'E1 (DANDI 001603, HO6–HO8): no network bursts, no synchrony.',
    newPrediction: 'The network-burst generator is ADEQUATE on five unseen organoids (HO1–HO5).',
    defeater: 'E2, preregistered, frozen code.',
    predictionIsNovel: true, corroborated: null,
  };
  it('classifies complete, incomplete and content-decreasing records', () => {
    assert.equal(assessRevision(base).assessment, 'theoretically-progressive');
    assert.equal(assessRevision({ ...base, corroborated: false }).assessment, 'refuted-prediction');
    assert.equal(assessRevision({ ...base, corroborated: true }).assessment, 'empirically-progressive');
    assert.equal(assessRevision({ ...base, predictionIsNovel: false }).assessment, 'content-decreasing');
    const inc = assessRevision({ ...base, defeater: '' });
    assert.equal(inc.assessment, 'incomplete');
    assert.deepEqual(inc.missing, ['defeater']);
  });

  it('flags a belt revision made without the rank-1 check, and accepts it once that check is recorded', () => {
    const standing = evaluateWithdrawal({});
    const skip = assessRevision({ ...base, thesis: 'field-hypothesis' }, standing);
    assert.equal(skip.orderRespected, false);
    assert.equal(skip.assessment, 'incomplete');
    const justified = assessRevision({ ...base, thesis: 'field-hypothesis', orderDeviationJustification: 'Rank-1 auxiliaries audited on 2026-10-01.' }, standing);
    assert.equal(justified.orderRespected, true);
  });

  it('accepts the revision the declared order prescribes (regression found by independent review)', () => {
    // H3a and H3b both negative: the bridge auxiliary (rank 2) is withdrawn and revised,
    // after a recorded rank-1 check — this follows the order and must not be flagged.
    const standing = evaluateWithdrawal({ bridgeCovariation: false, bridgeLocalIntervention: false });
    const rank1: RevisionRecord = { ...base, thesis: 'inference-and-measurement', date: '2026-10-08' };
    const bridge = assessRevision({ ...base, thesis: 'bridge-auxiliary' }, standing, [rank1]);
    assert.equal(bridge.orderRespected, true, bridge.orderNoteEn);
    assert.equal(bridge.assessment, 'theoretically-progressive');
    // H1 negative: after the rank-1 check the field hypothesis is revised directly (PREREGISTRATION §3);
    // the skipped intermediate ranks are named in the note, not counted as a violation.
    const h1 = evaluateWithdrawal({ ephapticPropagationUnderBlockade: false });
    const field = assessRevision({ ...base, thesis: 'field-hypothesis' }, h1, [rank1]);
    assert.equal(field.orderRespected, true);
    assert.match(field.orderNoteEn, /Intermediate ranks/);
    // A rank-1 record dated AFTER the revision does not count.
    const late = assessRevision({ ...base, thesis: 'bridge-auxiliary' }, standing, [{ ...rank1, date: '2026-12-01' }]);
    assert.equal(late.orderRespected, false);
  });

  it('treats an unset local intervention like a null one (bridge strand)', () => {
    const r = evaluateWithdrawal({ bridgeCovariation: true });
    const bridge = r.evaluations.find((e) => e.thesis === 'bridge-auxiliary')!;
    assert.match(bridge.reasonEn, /Covariation alone does not discriminate/);
  });

  it('the M1 evaluation states its underdetermination', () => {
    const r = evaluateWithdrawal({}, new Date('2026-10-09'));
    assert.match(r.evaluations.find((e) => e.thesis === 'M1')!.reasonEn, /deflationary reading/);
  });
});

describe('Levels, core and conformance — scope notes', () => {
  it('level II separates control, minimal-self individuation and experience', () => {
    const d = LEVELS.II.distinctions!;
    assert.deepEqual(d.map((x) => x.id), ['a-sensorimotor-control', 'b-minimal-self-individuation', 'c-subjective-experience']);
  });
  it('the core carries scope notes on the weak constraint and polynomial admissibility', () => {
    assert.ok(CORE.find((c) => c.id === 'substrate-constraint-weak')?.scopeNoteEn);
    assert.match(CORE.find((c) => c.id === 'polynomial-admissibility')!.scopeNoteEn!, /not a truth criterion/);
  });
  it('level order caution and six open questions are published', () => {
    assert.match(LEVEL_ORDER_CAUTION.en, /neither an ontogenetic succession/);
    assert.equal(OPEN_QUESTIONS.length, 6);
  });
  it('a conformance profile states that it is not a diagnosis', () => {
    assert.match(auditSubstrate('organoid-mea').scopeEn, /not a diagnosis of consciousness/);
  });
  it('the consolidated report clears the claim guard', () => {
    assert.ok(screen(JSON.stringify(fcsReport())).admissible);
  });
});
