# Changelog

Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) ; versions : [SemVer](https://semver.org/lang/fr/).
La version courante est fixée par `src/version.ts` ; `npm run check:identity` vérifie que ce
fichier, le README, les métadonnées de citation et le gate CI la portent tous.

## [3.3.0-rc.3] — 2026-10-19 (préversion)

Nom, définition et garde-fou des énoncés. Réalisé avec assistance d'IA ; ce n'est pas une
revue externe (`REVIEW.md`).

### Modifié
- **Nom.** Acronyme conservé ; *Awareness* → *Access* (Block 1995). EN : *Agent-orchestrated
  Simulation Testbed for Research on Access* ; FR (formulation de l'auteur) : *Agent Orchestré
  de Simulation et Test de Recherche sur l'Access*. Identifiant canonique **ASTRA-FCS**
  (titres de `CITATION.cff` et `.zenodo.json`, H1 du README, description `package.json`,
  tableau de bord). Définitions canoniques FR/EN dans le README et les résumés de citation.
- Source unique : `src/version.ts` → `ASTRA_IDENTITY` (acronyme, identifiant, noms, unités
  porteuses d'initiales, mots-outils, définitions, résumés, expansions retirées avec version
  et motif). Le README renvoyait à `phenomenal-guard.ts` pour le retrait de l'ancienne
  expansion, qui n'y figurait pas : il renvoie désormais à `ASTRA_IDENTITY.withdrawn`.
- **`lintClaim`** : 5 motifs anglais → 21 règles anglaises et françaises (attribution d'un
  état, possession, forme attributive, mesure ou détection active et passive, verbes de
  ressenti, possessifs). Les règles sans sujet ignorent une proposition niée ou non
  assertive (fenêtre de trois mots) ; les cinq règles historiques gardent leur comportement.
  Une chaîne émise reformulée (`ArgonovLedger` : le critère d'Argonov énoncé comme le sien).
- **`check:identity`** teste le nom (`checkName`) : dérivation de l'acronyme à partir des
  unités déclarées (lecture de « Agent Orchestré » comme une unité signalée), propagation,
  expansions retirées seulement là où leur retrait est consigné, admissibilité par
  `lintClaim`, `lintFcs` et `PHENOMENAL_TERMS`, avec contrôle que le test peut échouer.
  Exécuté par `tsx` (importe les linters de `src/`, sans build).

### Inchangé
- Surface MCP (75 outils, 16 ressources, 10 prompts), API, fichiers gelés E1/E2.
  Tests : 406 → 415.

### À décider par l'auteur
- F12 reste ouvert : deux arbres revendiquent la ligne 3.3.0.

## [3.3.0-rc.2] — 2026-10-19 (préversion)

Corrections de la rc.1 après revue critique (`REVUE-v3.3.0-rc.1.md`). Réalisées avec
assistance d'IA ; ce n'est pas une revue externe (`REVIEW.md`).

### Corrigé
- Règles que le texte énonçait sans que le code les applique : un critère d'unité ordinale
  n'entre plus dans l'utilité additive (interdiction 4, test `isOrdinalUnit` exporté de
  `negative-heuristic.ts`) ; aucun critère ni aucune contrainte ne peut porter sur la
  conscience, la sentience ou la phénoménalité (interdictions 1–2) ; les rapports
  restituent `purpose`, `function` et `owner`, que le garde-fou examine désormais.
- Admissibilité : `admissibilityBasis` et `constraintsDeclared` signalent le contrat vide.
- Exemple synthétique : `replay.mjs --check`, test et étape de CI.
- `CITATION.cff` / `.zenodo.json` : l'attribution des contrôles de validation à la v3.2.0
  est restaurée (un remplacement automatique l'avait réécrite en « v3.3.0-rc.1 ») ; le
  résumé mentionne l'extension ; date mise à jour.
- README (section, table des familles, effectifs, ancre), REVIEW.md (questions B7, C7),
  commentaire CI, rangement des annotations, en-têtes, bit d'exécution de
  `scripts/verify-anteriority.sh`.
- `TELEOLOGY.fr.md` : lecture de Cummins (fonction systémique, non téléologique ; fonction
  assignée = fonction de conception évaluée, non fondée, par l'analyse) ; formules en
  notation Unicode (le PDF affichait le LaTeX brut) ; enveloppe d'utilité exacte sur le
  pavé ; appareil (Cummins sans DOI non vérifié, Wright 1973 ajouté).

### Inchangé
- Surface MCP (75 outils, 16 ressources, 10 prompts), API `assess` / `compare`, fichiers
  gelés E1/E2. Tests : 401 → 406.

### À décider par l'auteur
- Deux arbres revendiquent la ligne 3.3.0 (cette pré-version et une v3.3.0 distincte à
  couche `telos_*`) : fusion, renumérotation ou abandon, avant tout marquage.

## [3.3.0-rc.1] — 2026-10-19 (préversion locale)

- Téléologie fonctionnelle : contrats de buts, intervalles de résultats, contraintes prioritaires.
- Utilité additive facultative et conditionnelle ; comparaison de Pareto robuste.
- Trois outils MCP en lecture seule, documentation et tests dédiés.
- Contrôle d’identité compatible avec les préversions SemVer.
- Aucun changement des douze fichiers gelés E1/E2.

## [3.2.0] — 2026-10-09

Consolidation à la suite de l'analyse épistémologique du 9 octobre 2026 (« ASTRA-FCS —
Analyse académique épistémologique »). Correspondance point par point : `CONSOLIDATION.md`.

### Ajouté
- **Identité de l'objet cité** : `scripts/check-identity.mjs` (+ `tests/identity.test.ts`,
  CI) ; effectifs MCP comptés à l'enregistrement (`capabilityCounts`) et déclarés dans
  `src/version.ts` (`EXPECTED_CAPABILITIES`) ; `scripts/manifest.mjs` et `MANIFEST.sha256` ;
  `scripts/check-frozen.mjs` (fichiers gelés d'E1/E2) ; `scripts/verify-anteriority.sh` ;
  `RELEASE.md` ; `empirical/PROVENANCE.md`.
- **Contrôles de validation des proxys** (aucun proxy n'est par là validé comme mesure) :
  `src/engine/proxy-cards.ts` (13 fiches : construit, formule exacte, invariances, domaine,
  inférences non autorisées) ; `src/engine/proxy-validation.ts` (17 contrôles — 9 exigences,
  dont 7 satisfaites et 2 en échec, A1 et A3 ; 8 défauts déclarés, tous confirmés : signaux
  témoins, source commune, ablation de connectivité, invariances, statuts) ; outil `proxy_validate` et ressource `astra://proxies/cards` ; statuts de mesure
  `value` / `null-result` / `not-measured` / `insufficient-sample` / `degenerate` ;
  variantes `riiuCorrelationShare` (invariante d'échelle) et `riiuResidualShare` (contrôle de
  source commune) ; `estimateEffectiveInformation` (couverture, transitions) ;
  `SNNEngine.ablateConnectivity` ; `rng.withIsolatedStream`.
- **Couche FCS** : `independenceChecks` (contraction du menu et changement de profil, pour
  la dominance et pour l'ordre induit par les strates) ; `episodeWindowSensitivity` ;
  `src/engine/fcs/agreement.ts` (α de Krippendorff, feuille de codage aveugle) et outil
  `fcs_agreement` ; enregistrements de révision lakatosiens (`RevisionRecord`,
  `assessRevision`, champ `revisions` de `fcs_withdrawal`) ; `LEVEL_ORDER_CAUTION`,
  `OPEN_QUESTIONS`, distinctions du niveau II, notes de portée du noyau ; note de portée
  de l'audit de conformité.
- **E3 (préparation)** : `empirical/PREREG-E3-DRAFT.md` (brouillon non déposé) ;
  `empirical/e3_analysis.py` (analyse par strate, organoïde comme unité, modèle à deux
  niveaux sans mise en commun par ABC ajusté, banque par durée d'enregistrement, témoin de
  complexité égale, M0 et M1-E2 simulés par le code TypeScript gelé, CRPS équitable,
  couverture, bootstrap sur organoïdes, métadonnées avant spikes, tampon de provenance) ;
  `empirical/test_e3.py` (vérité terrain synthétique, quatre vérités reproductibles,
  `results/exploratory/E3_synthetic_validation.json`) ;
  `empirical/e2x_per_organoid.py` (relecture exploratoire d'E2 par organoïde).
- **H1–H3** : modèles concurrents et prédictions différentielles, portée d'une
  confirmation, correspondance issues → champs → révisions, gabarit du plan d'analyse
  (règle « réglée / indéterminée » : un effet significatif contraire à la prédiction réfute ;
  équivalence par TOST à 1 − 2α), spécificité de l'intervention ; `scripts/prereg-check.mjs`.
- **Revue indépendante** : `REVIEW.md` en trois relectures séparées (neurosciences, mesure,
  philosophie) et critères d'indépendance ; modèles d'issues `.github/ISSUE_TEMPLATE/` ;
  registre `reviews/`.

### Corrigé
- **ACM** : `get_acm_score` lisait une instance du SNN que `snn_step` ne faisait jamais
  avancer ; le serveur, la boucle de fond et la boucle de production TCAI partagent
  désormais un seul SNN. GW̃ lisait `state.loihi.ly`, qu'aucun moteur n'écrivait (valeur 0
  dans toute session) : il lit les taux par couche du SNN pas à pas. Chaque composante
  porte statut, valeur brute, drapeau de saturation et provenance de ses entrées ; le
  composite hérite des statuts ; `confidence` est déclaré heuristique.
- **Φ̃-RIIU** : le commentaire parlait d'« énergie » de covariance ; la formule additionne des
  valeurs absolues (inchangée, bit à bit).
- **Workspace — changement incompatible, assumé dans une version mineure** : le champ
  `isConscious` de `tcai_workspace_state` devient `ignitedAccess`. Il enregistre un événement
  d'ignition (signature de type accès) ; le nom antérieur énonçait ce que le garde-fou
  interdit d'énoncer. Aucun alias n'est conservé, pour la même raison. Les clients qui
  lisaient `isConscious` doivent lire `ignitedAccess`.
- **Pareto** : n'est plus présenté comme « la seule règle admissible » (code, documentation,
  console) ; l'échec d'IIA attribué au déplacement des étiquettes de strate est remplacé par
  des vérifications calculées et exactement énoncées.
- **Niveau III** : la recevabilité polynomiale est qualifiée (part déclarative remplie ;
  tractabilité générale non démontrée).
- **Banc E1** : `empirical/test_confront.py` s'arrêtait sur l'absence de h5py après 15 PASS ;
  il rapporte désormais SKIP (motif donné), ou FAIL avec `--strict` (CI).
- **Volet de pont** : une intervention locale non renseignée est traitée comme indéterminée.

### Documentation
- Addenda datés §7 de `empirical/RESULTS-E1.md` et `empirical/RESULTS-E2.md` (portée des
  règles de décision ; lecture par organoïde, exploratoire). Verdicts, valeurs,
  pré-enregistrements et fichiers gelés inchangés.
- `FCS-INTEGRATION.fr.md` / `.en.md`, `TCAI-INTEGRATION.md`, console FCS, README.

### Corrigé après relecture indépendante (assistée par IA) de la consolidation
- `assessRevision` rejetait une révision conforme à l'ordre déclaré ; il exige désormais un
  contrôle de rang 1 enregistré et nomme les rangs intermédiaires non examinés.
- Règle « réglée / indéterminée » de H1–H3 : un effet inverse significatif était classé
  indéterminé (immunisation) ; l'équivalence utilisait un intervalle à 1 − α.
- Contrôles des proxys : distinction exigences / défauts confirmés ; R5 scindé (R5, R5L) ;
  valeurs vivantes classées contre des bandes témoins à leur propre taille ; la part
  résiduelle n'est plus dite retomber exactement au niveau témoin.
- E3 : analyse par strate, banques par durée, modèles M0 et M1-E2, CRPS équitable,
  description honnête du modèle à deux niveaux (sans mise en commun).
- `check:frozen` protège aussi E1.json, E2.json et E2_control_poisson.json ; le manifeste
  suit les fichiers suivis par git ; `prereg:check` ignore légendes, citations et blocs de
  code ; formulation de Pareto corrigée dans la console ; zéros « par construction » de la
  dominance déclarés analytiques.

### Inchangé à dessein
- Les neuf fichiers gelés d'E1/E2 et les trois résultats publiés (`npm run check:frozen`) ; la formule de Φ̃ (ACM),
  défaillante mais documentée — sa refonte relève de l'auteur ; les documents sources de la
  série FCS (`FCS v1.5/`).

## [3.1.1] — 2026-10-06
Corrections de cohérence (audit du 6 octobre 2026). Détail : section « v3.1.1 » du README.

## [3.1.0] — 2026-10
Couche FCS. Détail : section « v3.1.0 » du README.

## [3.0.1], [3.0], [2.9], [2.2] et antérieures
Voir les sections correspondantes du README.
