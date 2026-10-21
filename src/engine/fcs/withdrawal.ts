/**
 * ASTRA × FCS — Withdrawal conditions and the declared revision order
 * ═══════════════════════════════════════════════════════════════════
 * Synthesis S-1.6 (06·10·2026; unchanged here from S-1.5), "Ce qui ferait céder
 * chaque thèse" / documents I v1.5, II v1.4. S-1.6's results bearing on M2, M3
 * and the bridge without meeting their conditions are in ./optogenetics.ts.
 *
 * "Une condition d'abandon sans terme serait une clause de style." — an
 * abandonment condition with no deadline is a stylistic clause. The programme
 * therefore states, for each belt thesis, the condition under which it is
 * withdrawn and what survives the withdrawal.
 *
 * The CORE carries no withdrawal condition: its revision would be the
 * abandonment of the programme, not a move within it. That asymmetry is the
 * point, and this module preserves it by refusing to evaluate core claims.
 *
 * The REVISION ORDER is declared in advance, common to documents I, II and IV:
 *
 *   inference procedure & measurement auxiliaries → bridge auxiliary
 *   → grain hypothesis (M2) → individuation criterion (M3)
 *   → kinaesthetic thesis → field hypothesis
 *
 * Declaring it in advance is what stops a refutation from being absorbed by
 * whichever auxiliary is cheapest to sacrifice after the fact.
 *
 * © 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
 */

export type ThesisId =
  | 'inference-and-measurement'
  | 'bridge-auxiliary'
  | 'M2'
  | 'M3'
  | 'kinaesthetic'
  | 'field-hypothesis'
  | 'M1';

export interface Thesis {
  id: ThesisId;
  nameFr: string;
  nameEn: string;
  placement: 'belt' | 'complement';
  /** Position in the declared revision order; M1 sits outside it (dated clause). */
  revisionRank: number | null;
  conditionFr: string;
  conditionEn: string;
  survivesFr: string;
  survivesEn: string;
  /** ISO date for a thesis carrying a dated clause, else null. */
  deadline: string | null;
}

export const THESES: Record<ThesisId, Thesis> = {
  'inference-and-measurement': {
    id: 'inference-and-measurement',
    nameFr: 'Procédure d\'inférence et auxiliaires de mesure',
    nameEn: 'Inference procedure and measurement auxiliaries',
    placement: 'belt',
    revisionRank: 1,
    conditionFr:
      'Premier poste révisé devant toute anomalie : la famille d\'approximations déclarée, les auxiliaires de ' +
      'mesure et les valeurs ordinales attribuées aux sous-critères (document IV §5).',
    conditionEn:
      'First item revised in the face of any anomaly: the declared family of approximations, the measurement ' +
      'auxiliaries, and the ordinal values assigned to the sub-criteria (document IV §5).',
    survivesFr: 'L\'ensemble du programme et de sa ceinture.',
    survivesEn: 'The whole programme and its belt.',
    deadline: null,
  },
  'bridge-auxiliary': {
    id: 'bridge-auxiliary',
    nameFr: 'Auxiliaire de pont',
    nameEn: 'Bridge auxiliary',
    placement: 'belt',
    revisionRank: 2,
    conditionFr:
      'Ni covariation au cours du cycle veille-sommeil, ni effet de l\'intervention locale sur les marqueurs de ' +
      'niveau IV, à composition ionique mesurée.',
    conditionEn:
      'Neither covariation across the sleep–wake cycle nor effect of the local intervention on level-IV markers, ' +
      'with ionic composition measured.',
    survivesFr: 'L\'hypothèse du champ, restreinte au niveau I.',
    survivesEn: 'The field hypothesis, restricted to level I.',
    deadline: null,
  },
  M2: {
    id: 'M2',
    nameFr: 'M2 · hypothèse de grain (structure reflétée)',
    nameEn: 'M2 · grain hypothesis (reflected structure)',
    placement: 'belt',
    revisionRank: 3,
    conditionFr:
      'Hypothèse du champ réfutée ; ou, chez l\'humain, aucune part de structure phénoménale expliquée par le ' +
      'champ au-delà de la décharge — issue contraire au biais méthodologique, seule informative.',
    conditionEn:
      'Field hypothesis refuted; or, in humans, no share of phenomenal structure explained by the field beyond ' +
      'firing — an outcome against the methodological bias, the only informative one.',
    survivesFr: 'M1 et M3 ; l\'hypothèse du champ si seule la seconde condition est remplie ; la contrainte de substrat dans tous les cas.',
    survivesEn: 'M1 and M3; the field hypothesis if only the second condition holds; the substrate constraint in every case.',
    deadline: null,
  },
  M3: {
    id: 'M3',
    nameFr: 'M3 · individuation par clôture',
    nameEn: 'M3 · individuation by closure',
    placement: 'belt',
    revisionRank: 4,
    conditionFr:
      'Déplacements de frontière mieux prédits par une synchronie imposée (résonance partagée) ou par la ' +
      'topologie du champ que par la clôture.',
    conditionEn:
      'Boundary shifts better predicted by imposed synchrony (shared resonance) or by field topology than by closure.',
    survivesFr: 'Un monisme russellien structural sans critère d\'individuation ; le problème de la frontière est rouvert.',
    survivesEn: 'A structural Russellian monism without an individuation criterion; the boundary problem is reopened.',
    deadline: null,
  },
  kinaesthetic: {
    id: 'kinaesthetic',
    nameFr: 'Thèse kinesthésique',
    nameEn: 'Kinaesthetic thesis',
    placement: 'belt',
    revisionRank: 5,
    conditionFr:
      'Effets de dimensionnalité obtenus par manipulation de la congruence intéroceptive, non sensorimotrice.',
    conditionEn:
      'Dimensionality effects obtained by manipulating interoceptive, not sensorimotor, congruence.',
    survivesFr: 'Le cadre, avec un niveau II redéfini comme intéroceptif.',
    survivesEn: 'The framework, with level II redefined as interoceptive.',
    deadline: null,
  },
  'field-hypothesis': {
    id: 'field-hypothesis',
    nameFr: 'Hypothèse du champ',
    nameEn: 'Field hypothesis',
    placement: 'belt',
    revisionRank: 6,
    conditionFr:
      'Volets de niveau I négatifs : pas de propagation par le champ sous blocage synaptique, ou efficacité ' +
      'indépendante de la fraction volumique, à potassium et volume cellulaire contrôlés.',
    conditionEn:
      'Negative level-I strands: no field-mediated propagation under synaptic blockade, or efficacy independent ' +
      'of volume fraction, with potassium and cell volume controlled.',
    survivesFr:
      'La contrainte de substrat ; le programme cherche quelle autre voie de la classe ionique réalise le profil. ' +
      'M2 tombe avec son présupposé.',
    survivesEn:
      'The substrate constraint; the programme looks for which other route of the ionic class realises the ' +
      'profile. M2 falls with its presupposition.',
    deadline: null,
  },
  M1: {
    id: 'M1',
    nameFr: 'M1 · nature intrinsèque (bases catégoriques)',
    nameEn: 'M1 · intrinsic nature (categorical bases)',
    placement: 'complement',
    revisionRank: null,
    conditionFr:
      'Aucune expérience exhibée au 30 septembre 2027 dont le rang dépende de M1 ; ou complément modificateur ' +
      'corroboré, qui la rendrait superflue.',
    conditionEn:
      'No experiment exhibited by 30 September 2027 whose ranking depends on M1; or a corroborated modifying ' +
      'complement, which would make it superfluous.',
    survivesFr: 'M2 et M3 ; programme et heuristique inchangés.',
    survivesEn: 'M2 and M3; programme and heuristic unchanged.',
    deadline: '2027-09-30',
  },
};

export const REVISION_ORDER: readonly ThesisId[] = Object.freeze([
  'inference-and-measurement', 'bridge-auxiliary', 'M2', 'M3', 'kinaesthetic', 'field-hypothesis',
]);

// ── Evaluation ────────────────────────────────────────────────────

/**
 * Experimental outcomes, as the strands are stated. `null` = not yet run,
 * which is the honest default and never collapses to `false`.
 */
export interface StrandOutcomes {
  /** Chiang et al. 2019 replication: propagation persists under synaptic blockade. */
  ephapticPropagationUnderBlockade?: boolean | null;
  /** Osmotic strand: propagation efficacy varies with volume fraction, K⁺ and cell volume controlled. */
  efficacyVariesWithVolumeFraction?: boolean | null;
  /** Bridge: coupling covaries with volume fraction and level-IV signatures across sleep–wake. */
  bridgeCovariation?: boolean | null;
  /** Bridge: local intervention on volume fraction shifts local level-IV markers. */
  bridgeLocalIntervention?: boolean | null;
  /** Human strands: field explains phenomenal structure beyond firing (against the bias). */
  fieldBeyondFiringInHumans?: boolean | null;
  /** Boundary shifts better predicted by imposed synchrony or field topology than by closure. */
  boundaryBetterByResonanceOrTopology?: boolean | null;
  /** Dimensionality effects obtained by interoceptive, not sensorimotor, congruence. */
  dimensionalityFromInteroception?: boolean | null;
  /**
   * v3.3.0-rc.5 — the pattern behind that boolean, as a confirmatory run of
   * `fcs/kinaesthetic-withdrawal.ts` derives it. Optional: when present it must
   * agree with `dimensionalityFromInteroception` (true ⇔ 'interoceptive-only'),
   * and it lets the evaluation say WHY the thesis stands — a sensorimotor-only
   * pattern supports the choice of first closure, while 'both' and 'neither'
   * leave it undiscriminated.
   */
  kinaestheticPattern?: KinaestheticPattern | null;
  /** An experiment has been exhibited whose ranking depends on M1. */
  experimentRankedByM1?: boolean | null;
}

export type ThesisStanding = 'withdrawn' | 'standing' | 'undetermined';

/**
 * Patterns of the kinaesthetic withdrawal test (v3.3.0-rc.5): which family of
 * congruence manipulation raised effective dimensionality, each leg decided by
 * superiority (an effect) or equivalence (an absence within the preregistered
 * bound).
 */
export type KinaestheticPattern = 'interoceptive-only' | 'sensorimotor-only' | 'both' | 'neither';

const KINAESTHETIC_PATTERN_NOTE: Record<KinaestheticPattern, { standing: ThesisStanding; reasonEn: string }> = {
  'interoceptive-only': {
    standing: 'withdrawn',
    reasonEn: 'Dimensionality effects obtained by manipulating interoceptive, not sensorimotor, congruence. The declared rival wins and level II is redefined as interoceptive.',
  },
  'sensorimotor-only': {
    standing: 'standing',
    reasonEn: 'Dimensionality effects followed sensorimotor congruence and were shown absent, within the preregistered bound, under interoceptive manipulation: the first closure stays kinaesthetic, as the M3 choice states.',
  },
  'both': {
    standing: 'standing',
    reasonEn: 'Dimensionality effects followed both families of manipulation. The withdrawal condition (interoceptive AND NOT sensorimotor) is not met, but the test does not discriminate the first closure either.',
  },
  'neither': {
    standing: 'standing',
    reasonEn: 'Neither family produced dimensionality effects (equivalence shown for both). The withdrawal condition is not met; what fails is the dimensionality prediction of document II §6.3 itself — an anomaly that goes first to rank 1 of the revision order.',
  },
};

export interface ThesisEvaluation {
  thesis: ThesisId;
  nameEn: string;
  standing: ThesisStanding;
  /** The specific outcome(s) that decided it, or what is still missing. */
  reasonEn: string;
  survivesEn: string;
  revisionRank: number | null;
}

export interface WithdrawalReport {
  evaluations: ThesisEvaluation[];
  /** Next thesis to revise, per the declared order, among those still standing. */
  nextToReviseEn: string;
  coreNoteEn: string;
  /** Days remaining on M1's dated clause, negative once elapsed. */
  m1DaysRemaining: number;
}

const undet = (what: string) => `Undetermined — ${what} has not been run or returned.`;

/**
 * Evaluate the belt against a set of strand outcomes.
 *
 * Note the asymmetry the documents insist on: a favourable human outcome does
 * NOT corroborate M2, because the methodological bias favours the field. Only
 * the outcome against the bias is informative. The evaluator reproduces that:
 * `fieldBeyondFiringInHumans === true` leaves M2 `undetermined`, not `standing`.
 */
export function evaluateWithdrawal(
  outcomes: StrandOutcomes = {},
  now: Date = new Date(),
): WithdrawalReport {
  const evaluations: ThesisEvaluation[] = [];
  const push = (id: ThesisId, standing: ThesisStanding, reasonEn: string) =>
    evaluations.push({
      thesis: id, nameEn: THESES[id].nameEn, standing, reasonEn,
      survivesEn: THESES[id].survivesEn, revisionRank: THESES[id].revisionRank,
    });

  // Field hypothesis — level-I strands.
  const blockade = outcomes.ephapticPropagationUnderBlockade;
  const osmotic = outcomes.efficacyVariesWithVolumeFraction;
  let fieldWithdrawn = false;
  if (blockade === false || osmotic === false) {
    fieldWithdrawn = true;
    push('field-hypothesis', 'withdrawn',
      blockade === false
        ? 'No field-mediated propagation under synaptic blockade — the first level-I strand is negative.'
        : 'Propagation efficacy independent of volume fraction, with K⁺ and cell volume controlled — the osmotic strand is negative.');
  } else if (blockade === true && osmotic === true) {
    push('field-hypothesis', 'standing', 'Both level-I strands positive. The hypothesis stands; it is not thereby established as the only route.');
  } else {
    push('field-hypothesis', 'undetermined', undet('at least one level-I strand'));
  }

  // Bridge auxiliary.
  const cov = outcomes.bridgeCovariation;
  const loc = outcomes.bridgeLocalIntervention;
  if (cov === false && loc === false) {
    push('bridge-auxiliary', 'withdrawn', 'Neither covariation across the sleep–wake cycle nor an effect of the local intervention, with ionic composition measured.');
  } else if (loc === true) {
    push('bridge-auxiliary', 'standing', 'The local intervention shifted level-IV markers — the value of the strand is carried by the intervention, which breaks the neuromodulatory common cause. Covariation alone would not discriminate.');
  } else if (cov === true && loc == null) {
    push('bridge-auxiliary', 'undetermined', 'Covariation observed but the local intervention has not been run. Covariation alone does not discriminate: ionic composition varies with state (Ding et al. 2016) and a neuromodulatory common cause may act upstream.');
  } else {
    push('bridge-auxiliary', 'undetermined', undet('the bridge strand'));
  }

  // M2 — presupposes the field hypothesis; asymmetric evidence.
  const human = outcomes.fieldBeyondFiringInHumans;
  if (fieldWithdrawn) {
    push('M2', 'withdrawn', 'The field hypothesis is refuted, and M2 falls with its presupposition.');
  } else if (human === false) {
    push('M2', 'withdrawn', 'In humans, no share of phenomenal structure is explained by the field beyond firing — the outcome against the methodological bias, which is the informative one.');
  } else if (human === true) {
    push('M2', 'undetermined', 'The favourable human outcome does not discriminate: the methodological bias favours the field. Only the contrary outcome is informative.');
  } else {
    push('M2', 'undetermined', undet('the human grain strand'));
  }

  // M3.
  const boundary = outcomes.boundaryBetterByResonanceOrTopology;
  if (boundary === true) {
    push('M3', 'withdrawn', 'Boundary shifts better predicted by imposed synchrony or field topology than by closure.');
  } else if (boundary === false) {
    push('M3', 'standing', 'Closure outperformed the declared rivals on boundary shifts.');
  } else {
    push('M3', 'undetermined', undet('the boundary-shift comparison'));
  }

  // Kinaesthetic thesis.
  const intero = outcomes.dimensionalityFromInteroception;
  const pattern = outcomes.kinaestheticPattern ?? null;
  if (pattern !== null && !(pattern in KINAESTHETIC_PATTERN_NOTE)) {
    push('kinaesthetic', 'undetermined', `Unknown kinaesthetic pattern "${String(pattern)}".`);
  } else if (pattern !== null && intero != null && (pattern === 'interoceptive-only') !== intero) {
    push('kinaesthetic', 'undetermined', `Inconsistent outcomes: pattern "${pattern}" with dimensionalityFromInteroception = ${intero}. Neither is used.`);
  } else if (pattern !== null) {
    push('kinaesthetic', KINAESTHETIC_PATTERN_NOTE[pattern].standing, KINAESTHETIC_PATTERN_NOTE[pattern].reasonEn);
  } else if (intero === true) {
    push('kinaesthetic', 'withdrawn', 'Dimensionality effects obtained by manipulating interoceptive, not sensorimotor, congruence. The declared rival wins and level II is redefined as interoceptive.');
  } else if (intero === false) {
    push('kinaesthetic', 'standing', 'Dimensionality effects did not follow interoceptive congruence.');
  } else {
    push('kinaesthetic', 'undetermined', undet('the interoceptive-congruence manipulation'));
  }

  // M1 — dated clause.
  const deadline = new Date(THESES.M1.deadline as string);
  const m1DaysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / 86_400_000);
  if (outcomes.experimentRankedByM1 === true) {
    push('M1', 'standing', 'An experiment has been exhibited whose ranking depends on M1: it acquires a regulating role.');
  } else if (m1DaysRemaining <= 0) {
    push('M1', 'withdrawn', `Dated clause elapsed on ${THESES.M1.deadline} with no experiment exhibited whose ranking depends on M1. Held definitively to be a reading with no regulating role.`);
  } else {
    push('M1', 'undetermined', `Dated clause runs to ${THESES.M1.deadline}; ${m1DaysRemaining} days remain. Marginal allocation value currently nil — kept as a reading, not as a regulating hypothesis. Underdetermination: a deflationary reading predicts the same structural observations, so a success of the M2/M3 tests would not confirm M1 specifically.`);
  }

  // Measurement auxiliaries are revised first, always.
  push('inference-and-measurement', 'standing',
    'First in the revision order: revised before any belt thesis when an anomaly appears. Its standing is procedural, not empirical.');

  const nextStanding = REVISION_ORDER.find(
    (id) => evaluations.find((e) => e.thesis === id)?.standing !== 'withdrawn',
  );

  return {
    evaluations: evaluations.sort((a, b) => (a.revisionRank ?? 99) - (b.revisionRank ?? 99)),
    nextToReviseEn: nextStanding
      ? `${THESES[nextStanding].nameEn} — rank ${THESES[nextStanding].revisionRank} in the declared revision order.`
      : 'Every belt thesis is withdrawn; what remains is the core, whose revision would be the abandonment of the programme.',
    coreNoteEn:
      'The core — individuation by a functional profile, substrate constraint in the weak sense, weak emergence, ' +
      'polynomial admissibility — carries no withdrawal condition. Its revision would be the abandonment of the ' +
      'programme, not a move within it.',
    m1DaysRemaining,
  };
}

// ── Lakatosian revision records (v3.2.0) ──────────────────────────
//
// Analysis of 9 October 2026, §2.1: a declared revision order is not enough.
// Protecting a core is not unscientific in itself; what decides is whether
// each revision produces NEW empirical content, later corroborated, rather
// than absorbing failures indefinitely (Lakatos 1978,
// doi:10.1017/CBO9780511621123). Every revision must therefore state the datum
// that motivates it, what it now predicts, and the test that could still
// defeat it. `assessRevision` checks a record against those requirements and
// against the declared order; it classifies, it does not adjudicate.

export interface RevisionRecord {
  /** Thesis revised. */
  thesis: ThesisId;
  /** ISO date of the revision. */
  date: string;
  /** The observation that motivates the revision (with its source). */
  motivatingDatum: string;
  /** What the revised thesis predicts that the unrevised one did not. */
  newPrediction: string;
  /** The test, still to be run, whose outcome could defeat the revised thesis. */
  defeater: string;
  /**
   * True when `newPrediction` concerns an observation not already used to
   * motivate or calibrate the revision. A prediction that merely restates the
   * motivating datum adds no content.
   */
  predictionIsNovel: boolean;
  /** Outcome of the defeater test: true = corroborated, false = refuted, null = not yet run. */
  corroborated: boolean | null;
  /** Required when the revised thesis is not the first standing one in the declared order. */
  orderDeviationJustification?: string;
}

export type RevisionAssessment =
  | 'incomplete'                 // a required field is empty
  | 'content-decreasing'         // no novel prediction: absorbs the anomaly without new content
  | 'theoretically-progressive'  // novel prediction stated, not yet tested
  | 'empirically-progressive'    // novel prediction corroborated
  | 'refuted-prediction';        // novel prediction tested and refuted

export interface RevisionVerdict {
  thesis: ThesisId;
  assessment: RevisionAssessment;
  missing: string[];
  orderRespected: boolean;
  orderNoteEn: string;
  noteEn: string;
  noteFr: string;
}

/**
 * Classify a revision record.
 *
 * ORDER (corrected after independent review). The declared order says which
 * thesis absorbs an anomaly first: rank 1 — the inference procedure and the
 * measurement auxiliaries — is ALWAYS examined first; PREREGISTRATION.md §3
 * then lets a level-I failure bear directly on the field hypothesis (rank 6),
 * and an H3 failure on the bridge auxiliary (rank 2). Hence the machine-
 * checkable requirement: a revision of rank r ≥ 2 respects the order when a
 * rank-1 record exists for it (in `priorRevisions`, dated no later), or when a
 * deviation is justified. Intermediate ranks that are neither withdrawn nor
 * recorded are reported in the note — acceptable only if the anomaly does not
 * implicate them — without failing the check.
 *
 * @param standing current standing of the belt (to read which theses are withdrawn)
 * @param priorRevisions revision records already made for the same anomaly
 */
export function assessRevision(
  record: RevisionRecord,
  standing: WithdrawalReport | null = null,
  priorRevisions: readonly RevisionRecord[] = [],
): RevisionVerdict {
  const missing: string[] = [];
  if (!record.motivatingDatum?.trim()) missing.push('motivatingDatum');
  if (!record.newPrediction?.trim()) missing.push('newPrediction');
  if (!record.defeater?.trim()) missing.push('defeater');
  if (!record.date?.trim()) missing.push('date');

  let orderRespected = true;
  let orderNoteEn: string;
  const rank = THESES[record.thesis].revisionRank;
  if (rank === null) {
    orderNoteEn = 'M1 sits outside the revision order (dated clause).';
  } else if (rank === 1) {
    orderNoteEn = 'Rank 1 — the inference procedure and measurement auxiliaries are always revised first.';
  } else {
    const before = priorRevisions.filter((p) => !p.date || !record.date || p.date <= record.date);
    const rank1Checked = before.some((p) => THESES[p.thesis].revisionRank === 1);
    const justified = !!record.orderDeviationJustification?.trim();
    orderRespected = rank1Checked || justified;
    const isWithdrawn = (id: ThesisId) => standing?.evaluations.find((e) => e.thesis === id)?.standing === 'withdrawn';
    const skipped = REVISION_ORDER.filter((id) => {
      const k = THESES[id].revisionRank ?? 99;
      return k > 1 && k < rank && !isWithdrawn(id) && !before.some((p) => p.thesis === id);
    });
    orderNoteEn = (rank1Checked
      ? `Rank ${rank}, after a recorded rank-1 check of the inference procedure and measurement auxiliaries.`
      : justified
        ? `Rank ${rank} without a recorded rank-1 check; deviation justified: ${record.orderDeviationJustification}`
        : `Rank ${rank} revised without a recorded rank-1 check and without a declared justification.`) +
      (skipped.length > 0
        ? ` Intermediate ranks neither withdrawn nor recorded: ${skipped.join(', ')} — acceptable only if the anomaly does not implicate them (PREREGISTRATION.md §3).`
        : '');
    if (!orderRespected) missing.push('rank-1 record or orderDeviationJustification');
  }

  let assessment: RevisionAssessment;
  if (missing.length > 0) assessment = 'incomplete';
  else if (!record.predictionIsNovel) assessment = 'content-decreasing';
  else if (record.corroborated === true) assessment = 'empirically-progressive';
  else if (record.corroborated === false) assessment = 'refuted-prediction';
  else assessment = 'theoretically-progressive';

  const notes: Record<RevisionAssessment, { en: string; fr: string }> = {
    'incomplete': {
      en: `Incomplete record: ${missing.join(', ')} missing. A revision without them cannot be told from an ad hoc rescue.`,
      fr: `Enregistrement incomplet : ${missing.join(', ')} manquant(s). Sans eux, une révision ne se distingue pas d'un sauvetage ad hoc.`,
    },
    'content-decreasing': {
      en: 'The revision absorbs the anomaly without predicting anything not already used to motivate it: no new empirical content.',
      fr: 'La révision absorbe l\'anomalie sans rien prédire qui n\'ait déjà servi à la motiver : aucun contenu empirique nouveau.',
    },
    'theoretically-progressive': {
      en: 'Novel prediction stated and exposed to a named defeater, not yet run. Progressive in content, not yet in corroboration.',
      fr: 'Prédiction nouvelle énoncée et exposée à une épreuve nommée, non encore réalisée. Progressive en contenu, pas encore en corroboration.',
    },
    'empirically-progressive': {
      en: 'Novel prediction corroborated by the named test. One corroboration; replication remains to be sought.',
      fr: 'Prédiction nouvelle corroborée par l\'épreuve nommée. Une corroboration ; la réplication reste à rechercher.',
    },
    'refuted-prediction': {
      en: 'Novel prediction refuted by the named test. The revision was genuine — it risked something — and failed; the next move follows the declared order.',
      fr: 'Prédiction nouvelle réfutée par l\'épreuve nommée. La révision était authentique — elle prenait un risque — et a échoué ; la suite obéit à l\'ordre déclaré.',
    },
  };
  return { thesis: record.thesis, assessment, missing, orderRespected, orderNoteEn, noteEn: notes[assessment].en, noteFr: notes[assessment].fr };
}
