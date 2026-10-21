# Demande de revue externe · External review request

**ASTRA-FCS v3.3.0-rc.5** · <https://github.com/christophejlegros-lgtm/ASTRA-FCS-v3.3.0>
(le nom du dépôt porte « v3.3.0 » ; ce n'est pas un identifiant
de version — voir `RELEASE.md` · *the repository name is not a version identifier*)
Christophe Jean Legros · Assistance Multi IA, Genève · Assistant-Multi-IA@proton.me

---

## FR — Objet

ASTRA-FCS (*Agent Orchestré de Simulation et Test de Recherche sur l'Access*) est un serveur
*Model Context Protocol* qui expose 82 outils de simulation et
d'analyse à des assistants d'IA, et qui rend exécutable le programme de recherche du
fonctionnalisme contraint par le substrat (FCS). Toutes les données biologiques produites
sont simulées ; les indices liés à la conscience sont des proxys calculés, non des mesures.
La revue porte sur la **recevabilité** de ce que l'instrument permet d'affirmer, non sur une
prétention empirique qu'il ne formule pas.

Cette demande sollicite **trois relectures séparées**, confiées à des personnes distinctes
(point 5 du programme minimal de consolidation de l'analyse épistémologique du
9 octobre 2026) :

- **A — neurosciences computationnelles** : les modèles et leur confrontation aux données ;
- **B — mesure** : les proxys, les règles de décision et les statistiques ;
- **C — philosophie** : la cohérence du cadre et la portée des inférences.

## EN — Purpose

ASTRA-FCS (*Agent-orchestrated Simulation Testbed for Research on Access*) is a
*Model Context Protocol* server exposing 82 simulation and analysis tools to
AI assistants and making the research programme of substrate-constrained functionalism
(FCS) executable. All biological data produced are simulated; consciousness-related indices
are computed proxies, not measurements. The review bears on the **admissibility** of what
the instrument lets one claim. It seeks **three separate reviews by distinct people**:
A — computational neuroscience; B — measurement; C — philosophy.

---

## Indépendance · Independence

**FR.** Le code, la théorie et leurs vérifications procèdent d'un même auteur. L'assistance
de plusieurs systèmes d'IA a diversifié les contributions ; elle **ne garantit pas, à elle
seule, une indépendance des présupposés ou des erreurs**, et aucune vérification produite
avec cette assistance — y compris l'analyse épistémologique du 9 octobre 2026 et la présente
consolidation — n'est comptée comme une revue. **Aucune relecture humaine extérieure n'a eu
lieu à ce jour.**

Critères d'indépendance demandés à chaque relecteur, à déclarer :
1. aucune participation au développement d'ASTRA ou à la rédaction de la série FCS ;
2. aucune co-publication, collaboration ou relation contractuelle avec l'auteur — période
   de référence **À FIXER PAR L'AUTEUR** ;
3. aucun lien avec les entreprises citées (FinalSpark, OVOMIND, Koniku, Cortical Labs) ;
4. relecture rédigée par le relecteur lui-même ; l'usage d'outils d'IA est déclaré.

Les trois relecteurs ne se concertent pas avant la remise de leurs rapports.

**EN.** Code, theory and their checks come from one author. Multi-AI assistance diversified
the contributions but does **not by itself guarantee independence of assumptions or
errors**; no check produced with that assistance — including the epistemological analysis of
9 October 2026 and this consolidation — counts as a review. **No external human review has
taken place yet.** Reviewers declare the four criteria above and do not confer before
submitting.

---

## Relecture A — Neurosciences computationnelles · Review A — Computational neuroscience

Modèles et confrontation aux données · Models and their confrontation with data

| # | Question | Fichiers / Files |
|---|---|---|
| A1 | Le moteur LIF+STDP (128 neurones, STDP événementielle) est-il correctement implémenté et ses paramètres plausibles ? · Is the LIF+STDP engine correctly implemented and are its parameters plausible? | `src/engine/snn.ts` |
| A2 | Le cœur d'inférence active calcule-t-il bien l'énergie libre variationnelle ? La référence NumPy est-elle indépendante ? · Does the active-inference core compute variational free energy correctly? Is the NumPy reference independent? | `src/engine/tcai/active-inference.ts`, `python/second_order/` |
| A3 | Le simulateur NeuroPlatform et les générateurs `'poisson'` / `'network-burst'` reproduisent-ils des ordres de grandeur réalistes pour un MEA d'organoïde ? · Do the NeuroPlatform simulator and its generators reproduce realistic orders of magnitude for an organoid MEA? | `src/engine/neuroplatform.ts`, `empirical/RESULTS-E1.md`, `empirical/RESULTS-E2.md` |
| A4 | Le plan d'E3 (organoïde comme unité, strates d'âge et de préparation, modèle hiérarchique contre témoin de complexité égale) est-il adéquat ? Quel jeu de données d'un autre laboratoire conviendrait ? · Is the E3 design adequate? Which dataset from another laboratory would fit? | `empirical/PREREG-E3-DRAFT.md`, `empirical/e3_analysis.py`, `empirical/test_e3.py` |
| A5 | Les hypothèses de niveau substrat H1–H3 et leurs modèles concurrents (§2bis) sont-elles opérationnalisables telles quelles ? · Are the substrate-level hypotheses H1–H3 and their rival models operationalisable as stated? | `PREREGISTRATION.md` |
| A6 | La classification des 82 outils (lecture seule, additif, destructif) est-elle juste ? · Is the classification of the 82 tools correct? | `src/tool-annotations.ts` |
| A7 | Les analogues de classes afférentes (SA1, FA1, FA2, SA2, thermiques, seuils protecteurs, fuseaux, tendons), le comparateur efférence–réafférence et le critère opérationnel de clôture (gain d'informativité de la commande sur un substitut décalé) sont-ils correctement posés ? (pré-version) · Are the afferent-class analogues, the efference–reafference comparator and the operational closure criterion (command informativeness gain over a shifted surrogate) correctly posed? | `src/engine/somatosensory.ts`, `src/engine/reafference.ts`, `src/engine/body-sim.ts` |

## Relecture B — Mesure · Review B — Measurement

Proxys, règles de décision, statistiques · Proxies, decision rules, statistics

| # | Question | Fichiers / Files |
|---|---|---|
| B1 | Les fiches de proxy (construit, formule exacte, invariances, domaine d'emploi) sont-elles exactes et complètes ? · Are the proxy cards accurate and complete? | `src/engine/proxy-cards.ts`, `astra://proxies/cards` |
| B2 | Les contrôles (signaux témoins, source commune, ablation de connectivité, invariances) éprouvent-ils les bonnes propriétés ? Les deux échecs déclarés (A1, A3) sont-ils correctement interprétés ? · Do the controls test the right properties? Are the two declared failures correctly interpreted? | `src/engine/proxy-validation.ts`, `tests/proxy-validation.test.ts` |
| B3 | La distinction entre résultat nul, absence de mesure, échantillon insuffisant et entrée dégénérée est-elle correctement implémentée ? · Is the distinction between null result, absence of measurement, insufficient sample and degenerate input correctly implemented? | `src/engine/tcai/metrics.ts`, `src/engine/acm.ts` |
| B4 | Les règles de compatibilité d'E1/E2 (intervalle min–max, bande élargie) et leur relecture par organoïde sont-elles correctement qualifiées ? · Are the E1/E2 compatibility rules and their per-organoid re-reading correctly qualified? | `empirical/confront.py`, `empirical/RESULTS-E2.md` §7, `empirical/e2x_per_organoid.py` |
| B5 | Les résultats primaires d'E3 (erreurs par organoïde, couverture, CRPS, bootstrap sur organoïdes) et la règle « réglée / indéterminée » de H1–H3 (SESOI, équivalence) sont-ils bien posés ? · Are E3's primary outcomes and the settled/undetermined rule for H1–H3 well posed? | `empirical/PREREG-E3-DRAFT.md` §4, `PREREGISTRATION.md` §4bis |
| B6 | L'α de Krippendorff et la feuille de codage aveugle suffisent-ils à éprouver la fidélité du codage des trois sous-critères ? · Do Krippendorff's α and the blind coding sheet suffice to test the reliability of the sub-criteria coding? | `src/engine/fcs/agreement.ts`, outil `fcs_agreement` |
| B7 | La sémantique d'intervalles de l'extension téléologique (pass / fail / unknown, admissibilité relative aux contraintes déclarées, bornes exactes d'utilité sur le pavé, dominance de Pareto robuste) est-elle correctement posée et implémentée ? (pré-version) · Are the interval semantics of the functional-teleology extension correctly posed and implemented? | `src/engine/teleology/index.ts`, `tests/teleology.test.ts`, `TELEOLOGY.fr.md` §5–§7 |
| B8 | Test de retrait de la thèse kinesthésique : dimensionnalité effective (rapport de participation du spectre MDS classique), pente par unité sur le niveau gradué, intervalles (1 − 2α), équivalence dans ±SESOI pour l'absence, contrôles de manipulation et de spécificité — la règle est-elle bien posée ? (pré-version) · Kinaesthetic withdrawal test: effective dimensionality, per-unit slope, (1 − 2α) intervals, equivalence within ±SESOI for absence, manipulation and specificity checks — is the rule well posed? | `src/engine/dimensionality.ts`, `src/engine/fcs/kinaesthetic-withdrawal.ts`, `empirical/PREREG-KINAESTHETIC-K0-PILOT.md`, `empirical/PREREG-KINAESTHETIC-K1.md` |

## Relecture C — Philosophie de l'esprit et des sciences · Review C — Philosophy of mind and of science

Cadre normatif et portée des inférences · Normative frame and reach of inferences

| # | Question | Fichiers / Files |
|---|---|---|
| C1 | La distinction accès/phénoménal (Block 1995) est-elle correctement inscrite dans le garde-fou, et le linter distingue-t-il bien usage et mention ? · Is the access/phenomenal distinction correctly encoded, and does the linter separate use from mention? | `src/engine/tcai/phenomenal-guard.ts`, `src/engine/fcs/negative-heuristic.ts` |
| C2 | La partition noyau/ceinture, l'ordre de révision et l'enregistrement des révisions (donnée, prédiction nouvelle, épreuve) sont-ils cohérents avec une méthodologie lakatosienne ? · Are the core/belt partition, revision order and revision records consistent with a Lakatosian methodology? | `src/engine/fcs/withdrawal.ts`, `FCS-INTEGRATION.*.md` |
| C3 | Le refus d'agréger des critères ordinaux (Okasha 2011) est-il fondé ? La dominance de Pareto est-elle correctement présentée comme un choix méthodologique, et la transposition d'Arrow (critères comme votants) correctement testée ? · Is refusing ordinal aggregation well founded; is Pareto correctly presented as a methodological choice; is the Arrow transposition correctly tested? | `src/engine/fcs/stratification.ts` (`independenceChecks`) |
| C4 | L'ordinalisation de τ et la fenêtre d'environ 100 ms reçoivent-elles une justification indépendante, ou seulement une reproduction des strates publiées ? · Do the τ ordinalisation and the ~100 ms window receive an independent justification, or only a reproduction of the published strata? | `src/engine/fcs/stratification.ts` (`episodeWindowSensitivity`), `tests/fcs.test.ts` |
| C5 | Les distinctions du niveau II (contrôle sensorimoteur, soi minimal, expérience) suffisent-elles à empêcher « proto-conscience » d'incorporer l'explanandum ? · Do the level-II distinctions keep "proto-consciousness" from building in the explanandum? | `src/engine/fcs/levels.ts` |
| C6 | Les six questions ouvertes (spécificité de la contrainte faible, M1 et sous-détermination, pont vers l'accès, épreuves discriminantes entre théories, valeur de l'information) sont-elles bien posées ? · Are the six open questions well posed? | `src/engine/fcs/levels.ts` (`OPEN_QUESTIONS`), `CONSOLIDATION.md` |
| C7 | La « téléologie fonctionnelle sous contraintes » est-elle cohérente : fonction assignée (de conception) évaluée par une analyse à la Cummins, sans fonder la finalité sur le mécanisme ; contraintes avant valeur ; refus des fins portant sur la conscience (interdictions 1–2) et des agrégations ordinales (interdiction 4) ? (pré-version) · Is the functional teleology under constraints coherent (assigned design function assessed Cummins-style; constraints before value; no ends on consciousness; no ordinal aggregation)? | `TELEOLOGY.fr.md` §2–§6, `REVUE-v3.3.0-rc.1.md` |
| C8 | Le document II §6.3 énonce la prédiction sur des matrices PHÉNOMÉNALES (jugements de similarité) ; ASTRA calcule la même statistique sur des réponses de substrat. Cette transposition est-elle recevable, et la séparation structurelle des canaux somatosensoriel et intéroceptif opérationnalise-t-elle correctement le rival déclaré (§4.2) ? (pré-version) · Document II §6.3 states the prediction on PHENOMENAL matrices; ASTRA computes the same statistic on substrate responses. Is this transposition admissible, and does the structural separation of the two channels correctly operationalise the declared rival (§4.2)? | `SOMATOSENSORY-INTEGRATION.fr.md`, `src/engine/interoception.ts`, `src/engine/fcs/kinaesthetic-withdrawal.ts` |

---

## Modalités · Practicalities

- **Objet relu / Object reviewed :** la version étiquetée `v3.3.0-rc.5` (archive Zenodo et son
  DOI de version, à ajouter à `CITATION.cff` à la publication), vérifiée par
  `node scripts/manifest.mjs --check`. Un rapport cite l'empreinte de `MANIFEST.sha256`.
- **Reproduire / Reproduce :** `npm ci && npm run build && npm test` (Node ≥ 20) ;
  `npm run golden:check` et `npm run test:empirical` (Python 3 + numpy + h5py). Graine fixée
  par défaut ; `ASTRA_SEED` pour la changer.
- **Répondre / Respond :** une *issue* GitHub par question, avec le modèle de la relecture
  (`.github/ISSUE_TEMPLATE/`), préfixe `[A3]`, `[B2]`, `[C4]`…, ou un rapport à l'adresse
  ci-dessus. Les relectures sont publiées avec l'accord de leurs auteurs, leurs objections
  citées telles quelles, et chaque objection reçoit une réponse consignée dans `reviews/`.
- **Conflits d'intérêts / Conflicts of interest :** à déclarer par chaque relecteur.
  Liens de l'auteur avec les entreprises citées (FinalSpark, OVOMIND, Koniku) et
  collaborations en cours : **À DÉCLARER PAR L'AUTEUR AVANT ENVOI** · *The author's ties to
  the companies named and ongoing collaborations: **TO BE DECLARED BY THE AUTHOR BEFORE
  SENDING**.*
- **Documents d'appui / Supporting documents :** `CONSOLIDATION.md` (réponse point par point à
  l'analyse épistémologique du 9 octobre 2026) ; série FCS (dossier `FCS v1.5/`).
