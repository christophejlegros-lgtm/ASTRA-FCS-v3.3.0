/**
 * ASTRA × FCS — The four-level framework and its mapping onto ASTRA
 * ═════════════════════════════════════════════════════════════════
 * Document I v1.5 · synthesis S-1.6.
 *
 *   I   Substrate                    — transmembrane ionic currents, endogenous
 *                                      fields, ephaptic coupling
 *   II  Kinaesthetic proto-consciousness — efference–reafference closed loop,
 *                                      minimal self, agency
 *   III Hierarchical inference       — predictive coding, top-down priors,
 *                                      bottom-up prediction errors
 *   IV  Access consciousness         — global broadcast, late cortical ignition,
 *                                      availability for report and control
 *
 * CORE vs BELT (Lakatos). The core asserts: individuation by a functional
 * profile; the substrate constraint in the WEAK sense (the profile is realised,
 * as a matter of fact, by a restricted class of transmembrane ionic dynamics);
 * weak emergence; polynomial admissibility. The FIELD HYPOTHESIS — that the
 * endogenous field is a causally efficacious coupling route — belongs to the
 * protective belt and is tested at the level of the substrate.
 *
 * WHY THIS MATTERS FOR ASTRA. ASTRA implements levels III and IV in silicon and
 * reads level I only through a wetware channel. Under the substrate constraint,
 * a silicon realisation of the level-III/IV profile is not thereby a realisation
 * of the FCS carrier: the carrier is a transmembrane ionic dynamics, and the SNN
 * has none. This module makes that gap explicit per level rather than leaving it
 * to a footnote.
 *
 * © 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
 */

import type { SubstrateKind } from '../tcai/phenomenal-guard.js';

// ── 1. Epistemic status vocabulary (common to documents I, II, IV) ──

export type EpistemicStatus =
  | 'ESTABLISHED'   // Établi — supported by converging published results
  | 'MODELLED'      // Modélisé — a model, not a measurement
  | 'CONTESTED'     // Contesté — live disagreement in the literature
  | 'NORMATIVE';    // Normatif — a declared methodological choice, not a finding

export type Placement = 'core' | 'belt' | 'complement';

// ── 2. The levels ─────────────────────────────────────────────────

export type FcsLevel = 'I' | 'II' | 'III' | 'IV';

export interface LevelDescriptor {
  level: FcsLevel;
  nameFr: string;
  nameEn: string;
  formalismFr: string;
  formalismEn: string;
  status: EpistemicStatus[];
  /** The observable the document names for this level, if it names one. */
  observableFr: string | null;
  observableEn: string | null;
  /** Reading by the metaphysical complement, and its placement. */
  complement: { thesis: 'M1' | 'M2' | 'M3'; placement: Placement; noteFr: string; noteEn: string };

  // ── ASTRA mapping ──
  /** ASTRA modules that implement, or stand in for, this level. */
  astraModules: string[];
  /**
   * Which substrates available to ASTRA realise this level. A substrate absent
   * from this list does NOT realise the level — it may still simulate its
   * functional profile, which is a different claim.
   */
  realisedBy: SubstrateKind[];
  /**
   * What ASTRA cannot determine at this level, stated positively. Never empty:
   * every level has a limit, and printing it is cheaper than discovering it.
   */
  astraGapFr: string;
  astraGapEn: string;
  /** v3.2.0 — distinctions the level's name must not collapse (level II). */
  distinctions?: Array<{ id: string; fr: string; en: string }>;
}

export const LEVELS: Record<FcsLevel, LevelDescriptor> = {
  I: {
    level: 'I',
    nameFr: 'Substrat',
    nameEn: 'Substrate',
    formalismFr:
      'Flux ioniques transmembranaires, champs endogènes, couplage éphaptique. Les champs existent, sont ' +
      'mesurables, et leur origine ionique est comprise. Ce qui reste à établir, et que l\'hypothèse du champ ' +
      'affirme, est qu\'ils soient une voie de couplage causalement autonome plutôt qu\'un épiphénomène de mesure.',
    formalismEn:
      'Transmembrane ionic currents, endogenous fields, ephaptic coupling. The fields exist, are measurable, ' +
      'and their ionic origin is understood. What remains to establish, and what the field hypothesis asserts, ' +
      'is that they are a causally autonomous coupling route rather than a measurement epiphenomenon.',
    status: ['ESTABLISHED', 'MODELLED'],
    observableFr: 'Coefficient de couplage éphaptique ; fraction volumique extracellulaire ; résistivité du milieu.',
    observableEn: 'Ephaptic coupling coefficient; extracellular volume fraction; resistivity of the medium.',
    complement: {
      thesis: 'M1', placement: 'complement',
      noteFr: 'Bases catégoriques des propriétés structurales ; ancrage de la phénoménalité. Aucune observable propre ; valeur d\'allocation marginale nulle.',
      noteEn: 'Categorical bases of the structural properties; anchoring of phenomenality. No observable of its own; nil marginal allocation value.',
    },
    astraModules: ['engine/neuroplatform.ts (FinalSpark MEA)', 'engine/fcs/conformance.ts'],
    realisedBy: ['organoid-mea'],
    astraGapFr:
      'La MEA mesure un potentiel de champ extracellulaire ; elle ne mesure ni la fraction volumique ni la ' +
      'résistivité, et ne sépare donc pas le couplage par le champ de sa cause ionique commune. Le réseau ' +
      'LIF+STDP en silicium n\'a pas de courant ionique transmembranaire : il ne réalise pas ce niveau, il en ' +
      'simule un profil fonctionnel d\'ordre supérieur.',
    astraGapEn:
      'The MEA measures an extracellular field potential; it measures neither volume fraction nor resistivity, ' +
      'and so does not separate field coupling from its common ionic cause. The silicon LIF+STDP network has no ' +
      'transmembrane ionic current: it does not realise this level, it simulates a higher-order functional profile of it.',
  },

  II: {
    level: 'II',
    nameFr: 'Proto-conscience kinesthésique',
    nameEn: 'Kinaesthetic proto-consciousness',
    formalismFr:
      'Boucle efférence–réafférence, soi minimal, agentivité. Le corps est le premier objet non parce qu\'il ' +
      'serait plus proche du sujet, mais parce qu\'il est le seul dont le système possède simultanément la ' +
      'commande et le retour.',
    formalismEn:
      'Efference–reafference loop, minimal self, agency. The body is the first object not because it is nearer ' +
      'the subject, but because it is the only one of which the system holds command and return at once.',
    status: ['MODELLED', 'CONTESTED'],
    observableFr: 'Effets de dimensionnalité sous manipulation de la congruence sensorimotrice.',
    observableEn: 'Dimensionality effects under manipulation of sensorimotor congruence.',
    complement: {
      thesis: 'M3', placement: 'belt',
      noteFr: 'Le plus petit sujet est la plus petite boucle close. Rival déclaré : la clôture intéroceptive, à laquelle le choix cède si les effets de dimensionnalité y apparaissent.',
      noteEn: 'The smallest subject is the smallest closed loop. Declared rival: interoceptive closure, to which the choice yields if the dimensionality effects appear there.',
    },
    astraModules: ['engine/tcai/self-model.ts', 'engine/tcai/second-order.ts', 'engine/tcai/acm-bridge.ts (connectProductionSnn)',
      'engine/somatosensory.ts + engine/reafference.ts (body loop, v3.3.0-rc.5)', 'engine/interoception.ts (declared rival, separate channel)',
      'engine/fcs/kinaesthetic-withdrawal.ts (withdrawal test)'],
    realisedBy: ['silicon-snn', 'organoid-mea'],
    astraGapFr:
      'ASTRA ferme une boucle commande–retour sur son propre réseau : la clôture opérationnelle est réelle au ' +
      'sens du critère M3. Ce que le critère ne livre pas, et que la thèse kinesthésique ne prétend pas livrer, ' +
      'est un degré : l\'interdiction 1 proscrit de quantifier une proto-conscience. « Réalisé » porte ici sur la ' +
      'boucle de contrôle sensorimoteur (a) et sur la frontière opérationnelle (b) ; non sur l\'expérience (c), ' +
      'que ni (a) ni (b) n\'établissent (voir distinctions). Depuis la v3.3.0-rc.5, le comparateur ' +
      'efférence–réafférence porte aussi sur un corps instrumenté, simulé ou rapporté, et le canal intéroceptif ' +
      'est tenu séparé ; le test de retrait n\'accepte que des observations rapportées sous protocole déposé.',
    astraGapEn:
      'ASTRA closes a command–return loop on its own network: the operational closure is real in the sense of ' +
      'criterion M3. What the criterion does not deliver, and what the kinaesthetic thesis does not claim to ' +
      'deliver, is a degree: prohibition 1 forbids quantifying a proto-consciousness. "Realised" here bears on the ' +
      'sensorimotor control loop (a) and on the operational boundary (b); not on experience (c), which neither (a) ' +
      'nor (b) establishes (see distinctions). Since v3.3.0-rc.5 the efference–reafference comparator also runs on ' +
      'an instrumented body, simulated or reported, with the interoceptive channel kept separate; the withdrawal ' +
      'test accepts only reported observations under a filed protocol.',
    distinctions: [
      {
        id: 'a-sensorimotor-control',
        fr: '(a) Contrôle sensorimoteur : boucle efférence–réafférence close. Observable, réalisable en silicium.',
        en: '(a) Sensorimotor control: a closed efference–reafference loop. Observable, realisable in silicon.',
      },
      {
        id: 'b-minimal-self-individuation',
        fr: '(b) Individuation d\'un soi minimal : frontière opérationnelle délimitée par la clôture (critère M3). Une frontière, non une magnitude.',
        en: '(b) Individuation of a minimal self: an operational boundary drawn by closure (criterion M3). A boundary, not a magnitude.',
      },
      {
        id: 'c-subjective-experience',
        fr: '(c) Expérience subjective : non établie par (a) ni par (b). Que (a)+(b) soient la forme primitive de la conscience est la thèse kinesthésique — une thèse de la ceinture, non un résultat. Sans cette distinction, le terme « proto-conscience » incorporerait à l\'explanandum ce que le modèle doit expliquer.',
        en: '(c) Subjective experience: established neither by (a) nor by (b). That (a)+(b) are the primitive form of consciousness is the kinaesthetic thesis — a belt thesis, not a result. Without this distinction the term "proto-consciousness" would build into the explanandum what the model is meant to explain.',
      },
    ],
  },

  III: {
    level: 'III',
    nameFr: 'Inférence hiérarchique',
    nameEn: 'Hierarchical inference',
    formalismFr:
      'Codage prédictif : a priori descendants, erreurs de prédiction ascendantes. L\'inférence exacte étant ' +
      'NP-difficile, une théorie doit spécifier la famille d\'approximations qu\'elle prête au système, faute ' +
      'de quoi elle est vide.',
    formalismEn:
      'Predictive coding: top-down priors, bottom-up prediction errors. Since exact inference is NP-hard, a ' +
      'theory must specify the family of approximations it ascribes to the system, failing which it is empty.',
    status: ['MODELLED'],
    observableFr: 'Erreur de prédiction, surprise, et la famille d\'approximations déclarée.',
    observableEn: 'Prediction error, surprise, and the declared family of approximations.',
    complement: {
      thesis: 'M2', placement: 'belt',
      noteFr: 'Les niveaux d\'inférence ne sont pas seulement des mécanismes : ce sont des dimensions de l\'espace phénoménal.',
      noteEn: 'Levels of inference are not only mechanisms: they are dimensions of phenomenal space.',
    },
    astraModules: ['engine/world-model.ts (JEPA/LeWM)', 'engine/tcai/active-inference.ts', 'engine/wm-simulation.ts'],
    realisedBy: ['silicon-snn'],
    astraGapFr:
      'ASTRA remplit la part déclarative de l\'exigence de polynomialité : la famille d\'approximations est ' +
      'déclarée — encodeur joint-embedding, régularisation SIGReg, planification CEM à horizon borné, sur un ' +
      'réseau de taille fixée. Cela ne démontre pas la tractabilité générale du construit approché : la ' +
      'complexité se définit relativement à une taille d\'entrée, une précision et un problème algorithmique (v3.2.0).',
    astraGapEn:
      'ASTRA meets the declarative part of the polynomiality requirement: the family of approximations is declared — ' +
      'joint-embedding encoder, SIGReg regularisation, bounded-horizon CEM planning, on a network of fixed size. That ' +
      'does not show the general tractability of the construct approximated: complexity is defined relative to an ' +
      'input size, a precision and an algorithmic problem (v3.2.0).',
  },

  IV: {
    level: 'IV',
    nameFr: 'Conscience d\'accès',
    nameEn: 'Access consciousness',
    formalismFr:
      'Diffusion globale, ignition corticale tardive, disponibilité au rapport et au contrôle. La pensée est la ' +
      'dynamique sérielle de ce niveau, sous une conjecture contestée.',
    formalismEn:
      'Global broadcast, late cortical ignition, availability for report and control. Thought is the serial ' +
      'dynamics of this level, under a contested conjecture.',
    status: ['ESTABLISHED', 'CONTESTED'],
    observableFr: 'Observable polynomiale : indice de complexité perturbationnelle (Casali et al., 2013).',
    observableEn: 'Polynomial observable: perturbational complexity index (Casali et al., 2013).',
    complement: {
      thesis: 'M3', placement: 'belt',
      noteFr: 'M3 étendue : la clôture opérationnelle portée à l\'ensemble du système. Observable : structure de similarité sous perturbation.',
      noteEn: 'M3 extended: operational closure carried to the whole system. Observable: similarity structure under perturbation.',
    },
    astraModules: ['engine/tcai/global-workspace.ts', 'engine/tcai/oscillatory-binding.ts', 'engine/tcai/orch-or.ts (surrogate gate)'],
    realisedBy: ['silicon-snn'],
    astraGapFr:
      'L\'ignition du workspace d\'ASTRA est une signature de niveau IV au sens formel — compétition, seuil, ' +
      'diffusion. Elle est ÉTABLIE comme signature et CONTESTÉE comme suffisante. ASTRA ne calcule pas d\'indice ' +
      'de complexité perturbationnelle : l\'observable nommée par le document n\'est pas instrumentée ici.',
    astraGapEn:
      'The ignition of ASTRA\'s workspace is a level-IV signature in the formal sense — competition, threshold, ' +
      'broadcast. It is ESTABLISHED as a signature and CONTESTED as sufficient. ASTRA computes no perturbational ' +
      'complexity index: the observable the document names is not instrumented here.',
  },
};

export const LEVEL_ORDER: readonly FcsLevel[] = Object.freeze(['I', 'II', 'III', 'IV']);

// ── 3. Core / belt partition ──────────────────────────────────────

export interface CoreClaim {
  id: string; fr: string; en: string;
  /** v3.2.0 — what the claim does not license, or the open question it leaves (analysis of 9 October 2026). */
  scopeNoteFr?: string;
  scopeNoteEn?: string;
}

/**
 * The core. Its revision would be the abandonment of the programme, which is
 * why no withdrawal condition is stated for it (see ./withdrawal.ts).
 */
export const CORE: readonly CoreClaim[] = Object.freeze([
  {
    id: 'functional-individuation',
    fr: 'La conscience est individuée par un profil fonctionnel, réalisable de multiples façons en principe.',
    en: 'Consciousness is individuated by a functional profile, multiply realisable in principle.',
  },
  {
    id: 'substrate-constraint-weak',
    fr: 'Contrainte de substrat, sens faible : dans le vivant, le profil est réalisé DE FAIT par une classe restreinte de dynamiques ioniques transmembranaires.',
    en: 'Substrate constraint, weak sense: in living systems the profile is realised AS A MATTER OF FACT by a restricted class of transmembrane ionic dynamics.',
    scopeNoteFr:
      'Question ouverte, non contradiction : si la contrainte faible décrit seulement l\'ancrage neurophysiologique de la ' +
      'cognition vivante, sa portée propre peut être modeste devant les neurosciences ordinaires. Il reste à montrer quelles ' +
      'classes de dynamiques sont requises pour quelles fonctions, et quelles prédictions séparent le FCS d\'un ' +
      'fonctionnalisme déjà sensible aux contraintes de réalisation (OPEN_QUESTIONS, q1).',
    scopeNoteEn:
      'Open question, not a contradiction: if the weak constraint only describes the neurophysiological anchoring of living ' +
      'cognition, its own reach may be modest beside ordinary neuroscience. It remains to show which classes of dynamics are ' +
      'required for which functions, and which predictions separate FCS from a functionalism already sensitive to ' +
      'realisation constraints (OPEN_QUESTIONS, q1).',
  },
  {
    id: 'weak-emergence',
    fr: 'Émergence faible : les propriétés de niveau supérieur sont déductibles en principe de la dynamique de niveau I, sans l\'être en pratique.',
    en: 'Weak emergence: higher-level properties are in principle deducible from the level-I dynamics, though not in practice.',
  },
  {
    id: 'polynomial-admissibility',
    fr: 'Recevabilité polynomiale : une théorie doit spécifier la famille d\'approximations qu\'elle prête au système.',
    en: 'Polynomial admissibility: a theory must specify the family of approximations it ascribes to the system.',
    scopeNoteFr:
      'Critère de sélection des observables et des modèles recevables, non critère de vérité : une théorie difficile à ' +
      'calculer peut être vraie, une approximation efficace inadéquate. La complexité se spécifie relativement à une taille ' +
      'd\'entrée, une précision et un problème algorithmique ; une routine bornée sur un réseau fixé ne démontre pas la ' +
      'tractabilité générale du construit qu\'elle approche.',
    scopeNoteEn:
      'A criterion for selecting admissible observables and models, not a truth criterion: a theory hard to compute may be ' +
      'true, an efficient approximation inadequate. Complexity is specified relative to an input size, a precision and an ' +
      'algorithmic problem; a bounded routine on a fixed network does not show the general tractability of the construct ' +
      'it approximates.',
  },
]);

/**
 * v3.2.0 — the order I → IV is an order of presentation and analysis. It
 * establishes neither an ontogenetic succession nor a relation of necessity
 * between levels; any such dependence is a belt thesis to be tested.
 */
export const LEVEL_ORDER_CAUTION = Object.freeze({
  fr: 'L\'ordre I → IV est un ordre de présentation et d\'analyse. Il n\'établit ni succession ontogénétique ni relation ' +
      'de nécessité entre niveaux ; toute dépendance de ce type (par exemple de IV envers II) est une thèse de la ceinture, ' +
      'à éprouver, non un résultat du cadre.',
  en: 'The order I → IV is an order of presentation and analysis. It establishes neither an ontogenetic succession nor a ' +
      'relation of necessity between levels; any such dependence (e.g. of IV on II) is a belt thesis to be tested, not a ' +
      'result of the framework.',
});

/**
 * v3.2.0 — open questions the epistemological analysis of 9 October 2026
 * leaves to the author. Stated so that they travel with the framework rather
 * than in a separate report. None is a contradiction; each is a demand for
 * discriminating content.
 */
export const OPEN_QUESTIONS: ReadonlyArray<{ id: string; fr: string; en: string; section: string }> = Object.freeze([
  {
    id: 'q1', section: '§2',
    fr: 'Quelles classes de dynamiques sont requises pour quelles fonctions, et quelles prédictions séparent le FCS d\'un fonctionnalisme déjà sensible aux contraintes de réalisation ?',
    en: 'Which classes of dynamics are required for which functions, and which predictions separate FCS from a functionalism already sensitive to realisation constraints?',
  },
  {
    id: 'q2', section: '§2',
    fr: 'Comment distinguer, au niveau II, contrôle sensorimoteur, individuation d\'un soi minimal et expérience subjective, sans que le terme « proto-conscience » n\'incorpore l\'explanandum ?',
    en: 'How are sensorimotor control, minimal-self individuation and subjective experience told apart at level II, without the term "proto-consciousness" building in the explanandum?',
  },
  {
    id: 'q3', section: '§2.2',
    fr: 'M1 et une lecture déflationniste prédisant les mêmes observations, quelle épreuve les départagerait — ou faut-il tenir M1 pour une lecture sans rôle régulateur ?',
    en: 'Since M1 and a deflationary reading predict the same observations, what test would separate them — or is M1 to be held a reading with no regulating role?',
  },
  {
    id: 'q4', section: '§5',
    fr: 'Même une confirmation robuste de H1/H2 n\'établirait qu\'une efficacité causale du couplage par le champ dans la préparation étudiée : quelles inférences supplémentaires mènent aux signatures d\'accès, puis à leur portée phénoménale ?',
    en: 'Even a robust confirmation of H1/H2 would establish only a causal efficacy of field coupling in the preparation studied: which further inferences lead to access signatures, and then to their phenomenal reach?',
  },
  {
    id: 'q5', section: '§5.1',
    fr: 'Quelles épreuves discriminantes opposent les modules empruntés (GNW, inférence active, métriques inspirées de l\'IIT, Orch-OR) plutôt que de reproduire des signatures plausibles pour chacun (cf. COGITATE 2025, doi:10.1038/s41586-025-08888-1) ?',
    en: 'Which discriminating tests set the borrowed modules (GNW, active inference, IIT-inspired metrics, Orch OR) against each other, rather than reproducing plausible signatures for each (cf. COGITATE 2025, doi:10.1038/s41586-025-08888-1)?',
  },
  {
    id: 'q6', section: '§5.2',
    fr: 'Prioriser les mécanismes classiques avant l\'hypothèse quantique est une politique d\'enquête défendable ; sous quelles hypothèses de coûts et d\'issues la valeur de l\'information la justifie-t-elle, sans valoir réfutation préalable d\'Orch-OR ?',
    en: 'Prioritising classical mechanisms before the quantum hypothesis is a defensible research policy; under which assumptions about costs and outcomes does the value of information justify it, without amounting to a prior refutation of Orch OR?',
  },
]);

/** The field hypothesis — belt, not core. The distinction is load-bearing. */
export const FIELD_HYPOTHESIS = Object.freeze({
  id: 'field-hypothesis',
  placement: 'belt' as Placement,
  fr: 'Le champ électromagnétique endogène est une voie de couplage causalement efficace, et non un épiphénomène de mesure. Sous cette hypothèse, le porteur de niveau I est le courant ionique transmembranaire et le champ qu\'il engendre.',
  en: 'The endogenous electromagnetic field is a causally efficacious coupling route, not a measurement epiphenomenon. Under this hypothesis the level-I carrier is the transmembrane ionic current and the field it generates.',
  status: ['MODELLED', 'CONTESTED'] as EpistemicStatus[],
});

// ── 4. Which levels a substrate reaches ───────────────────────────

export interface SubstrateLevelProfile {
  substrate: SubstrateKind;
  /** Levels this substrate REALISES, in the document's sense. */
  realises: FcsLevel[];
  /** Levels whose functional profile it simulates without realising the carrier. */
  simulates: FcsLevel[];
  /** Levels it neither realises nor simulates. */
  absent: FcsLevel[];
}

/**
 * Read the per-level `realisedBy` lists back as a per-substrate profile.
 * A level is "simulated" when an ASTRA module implements its formalism on a
 * substrate the level does not list — the honest description of what silicon
 * does with levels III and IV under the substrate constraint.
 */
export function levelProfile(substrate: SubstrateKind): SubstrateLevelProfile {
  const realises: FcsLevel[] = [];
  const simulates: FcsLevel[] = [];
  const absent: FcsLevel[] = [];

  for (const level of LEVEL_ORDER) {
    const d = LEVELS[level];
    if (d.realisedBy.includes(substrate)) realises.push(level);
    else if (substrate === 'silicon-snn' && d.astraModules.length > 0 && level !== 'I') simulates.push(level);
    else absent.push(level);
  }
  return { substrate, realises, simulates, absent };
}
