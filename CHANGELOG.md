# Changelog

Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) ; versions : [SemVer](https://semver.org/lang/fr/).
La version courante est fixée par `src/version.ts` ; `npm run check:identity` vérifie que ce
fichier, le README, les métadonnées de citation et le gate CI la portent tous.

## [3.3.0-rc.5] — 2026-10-20 (candidat local, non publié)

Canaux du corps et test de retrait de la thèse kinesthésique, après l'analyse critique de
`SENSORS.pdf` (`REVUE-SENSORS.md`). Réalisé avec une assistance d'IA ; ce n'est pas une revue
externe (`REVIEW.md`).

### Ajouté
- **Canal somatosensoriel** (`src/engine/somatosensory.ts`). Le canal produit des analogues
  fonctionnels des classes afférentes : SA1, FA1, FA2, SA2, COLD, WARM, NOCI (indicateurs de
  seuil), SPINDLE et TENDON. Ses lectures sont validées et portent un domaine d'horloge.
  L'étirement cutané est classé réafférent. Le contact thermique est chauffé et lu avec le
  flux. Un code de fréquence est déclaré.
- **Canal intéroceptif séparé** (`src/engine/interoception.ts`). Il a son propre type, ses
  variables déclarées (consigne et plage viable) et une prédiction homéostatique apprise.
  Aucun défaut n'est fourni pour les cultures. `checkChannelSeparation` signale les signaux
  communs aux deux canaux. La fusion extéroceptive refuse une trame non extéroceptive
  (`EXTEROCEPTIVE_MODALITIES`).
- **Boucle efférence–réafférence** (`src/engine/reafference.ts`). Le module comprend un modèle
  direct NLMS et un appariement par latence attendue, calibrée puis figée. Il fournit un
  comparateur dont le résidu estime l'exafférence, et une clôture opérationnelle M3 éprouvée
  contre un substitut aux commandes décalées.
- **Manipulations de congruence** (`src/engine/congruence.ts`). Côté sensorimoteur : délai,
  gain, inversion, remappage et gigue. Côté intéroceptif : délai, gain autour de la consigne,
  décalage et découplage. Les manipulations portent sur les horodatages matériels. Une
  condition n'appartient qu'à une famille, et les flux aléatoires sont locaux.
- **Contrôle de manipulation** (`src/engine/body-loop.ts`) : calibration, gel, puis
  manipulation, avec les erreurs des deux canaux par condition. **Doigt simulé**
  (`src/engine/body-sim.ts`), destiné uniquement à éprouver la chaîne.
- **Dimensionnalité** (`src/engine/dimensionality.ts`). Le module calcule la matrice de
  dissimilarité, le spectre MDS classique et le rapport de participation, et fournit la loi
  de Student et la pente des moindres carrés, sans dépendance statistique.
- **Test de retrait** (`src/engine/fcs/kinaesthetic-withdrawal.ts`). Il comprend le protocole
  et son empreinte SHA-256 canonique, ainsi que l'éthique de délivrance (blocage sans
  approbation pour une culture vivante ou des sujets humains). L'analyse calcule une pente par
  unité et des intervalles (1 − 2α). L'absence est établie par équivalence dans ±SESOI, et le
  critère d'effet est à préenregistrer. Des contrôles de manipulation et de spécificité
  s'ajoutent. Les quatre motifs sont dérivés, et une diminution de dimensionnalité est une
  anomalie imputée au rang 1. Les conditions confirmatoires sont : protocole déposé, empreinte
  inchangée, aucun paramètre ouvert, données postérieures au dépôt et d'origine `reported`.
  **Les simulations ne fixent jamais un résultat de retrait.** Des contrôles synthétiques à
  motif connu sont fournis.
- `withdrawal.ts` : le champ optionnel `kinaestheticPattern` motive la position de la thèse,
  et des entrées incohérentes ne sont pas utilisées. Le comportement booléen antérieur est
  inchangé. `fcs_withdrawal` accepte ce champ.
- MCP : 7 outils en lecture seule (`soma_encode`, `intero_encode`, `kin_closure`,
  `kin_manipulation_check`, `kin_protocol`, `kin_analyse`, `kin_validate`), la ressource
  `astra://kinaesthetic/protocol-template` et le prompt `kinaesthetic-withdrawal-test`.
- Documents : `SOMATOSENSORY-INTEGRATION.fr.md` / `.en.md` et `REVUE-SENSORS.md` (analyse
  critique, corrections, références aux DOI vérifiés). Le niveau II de `levels.ts` mentionne
  les nouveaux modules. `REVIEW.md` reçoit les questions A7, B8 et C8.

### Préenregistrements complétés (décisions de l'auteur, 20 octobre 2026)
- **FCS-K0**, pilote robot (`empirical/PREREG-KINAESTHETIC-K0-PILOT.md`,
  `empirical/protocols/FCS-K0.protocol.json`). Complet et prêt à déposer sur OSF Registries,
  déclaré `role: "pilot"` : il ne fixe jamais de résultat de retrait. Banc minimal : servo à
  encodeur absolu avec courant moteur, DIGIT, thermistance chauffée et deux jauges
  d'étirement ; côté intéroceptif, thermistance d'actionneur, jauge de batterie et
  température de carte. Dix séances. Huit mouvements-sondes (quatre amplitudes × mousse et
  aluminium). Niveaux calqués sur K1.
- **FCS-K1**, participants humains, confirmatoire (`empirical/PREREG-KINAESTHETIC-K1.md`,
  `empirical/protocols/FCS-K1.protocol.json`). Main virtuelle mobile avec délais
  visuo-moteurs de 0, 100, 200, 300 et 500 ms ; rétroaction cardio-visuelle synchrone,
  déphasée de 25 % puis de 50 %, puis découplée. Jugements de similarité par paires sur six
  configurations par niveau. Blocs contrebalancés et carrés latins, deux lignes de base
  regroupées. α = 0,05, SESOI = 0,25, critère de supériorité. Exclusions techniques
  seulement. Règle d'effectif fixée par un pilote de 10 participants : n = 40 ou 60. Trois
  valeurs restent en attente : laboratoire hôte, approbation éthique et n.
- `prereg:check` compte aussi les marqueurs « EN ATTENTE » / « PENDING » et reconnaît les
  statuts « prêt à déposer » et « déposé ». `scripts/kin.mjs` fournit `kin:protocol`
  (empreinte et préparation au dépôt), `kin:k0:dryrun`, `kin:k0:observe` et `kin:analyse`.
- Code associé : champ `role` (pilot | confirmatory) ; dissimilarité `judged-similarity`
  et `rdmFromSimilarityJudgements` ; manipulation `phase-shift` (exécutée par l'appareil) ;
  `body-probes.ts` (sondes et observations de K0) ; `calibrateFreezeManipulate`.

### Dépôt de K0 préparé (21 octobre 2026)
- **Texte du dépôt** : `empirical/OSF-K0-FILING.md` donne les métadonnées et les 25 champs
  du modèle « OSF Preregistration » (Bowman et al. 2016), en anglais à coller et en
  français, avec la procédure et les commandes à exécuter après l'approbation.
- **Consignation du dépôt** : `node --import tsx scripts/kin.mjs file <protocole> --reference
  <DOI> --filed-at <date>` (aussi `npm run kin:file`). La commande inscrit `status` et
  `registry`, ne réécrit que ces deux champs du JSON et remplace la ligne de statut du
  document. Elle vérifie que l'empreinte est inchangée et refuse un protocole non prêt ou
  déjà déposé, un document qui ne cite pas l'empreinte, une date future et un DOI resté à
  l'état de gabarit. L'option `--dry-run` montre l'effet sans rien écrire.
- **K0, deux précisions avant le dépôt** : la règle d'échec technique et d'arrêt (une séance
  refusée par `kin:k0:observe` est rapportée puis remplacée, jusqu'à dix séances acceptées),
  et une analyse de dimensionnalité exécutée une seule fois.

### Corrigé pendant le développement
- **Modèle OSF de K0.** Le §8 indiquait « Open-Ended Registration », qu'OSF réserve aux
  études qu'aucun modèle structuré ne couvre ; il indique désormais « OSF Preregistration »,
  comme K1.
- **Test de `prereg:check`.** Il exigeait l'état « prêt à déposer » de K0, si bien que la
  consignation du dépôt aurait fait échouer l'intégration continue. Il suit désormais le
  statut du JSON, et un nouveau test vérifie que le JSON et la ligne de statut concordent.
- Sans SESOI, un intervalle minuscule au-dessus de 0 était lu comme une « augmentation », et
  un plan « intéroceptif seul » pouvait conclure à « both », ce qui maintenait la thèse.
  Désormais, aucun motif n'est dérivé sans SESOI (test de régression).
- **Empreinte du protocole.** Elle incluait `status` et `registry`, qui changent au dépôt :
  tout protocole déposé aurait cessé de correspondre à l'empreinte enregistrée. Elle ne
  couvre plus que le contenu scientifique.
- **Garde de monotonie**, ajoutée sur décision de l'auteur. La simulation à blanc de K0
  montrait une réponse en U inversé dont la pente, proche de 0, aurait été lue comme une
  absence. Une absence exige désormais que la pente **et** chaque niveau tombent dans
  ±SESOI ; sinon, le résultat est « non concluant ».
- **Réponses de K0.** Avec les seules erreurs du comparateur somatosensoriel, une
  manipulation intéroceptive ne pouvait pas modifier les motifs, et l'absence intéroceptive
  était garantie par construction. Les réponses combinent désormais les erreurs des deux
  canaux, chacune centrée-réduite.

### Inchangé
- Fichiers gelés E1/E2 (`check:frozen`) et RNG global : les nouveaux calculs utilisent des
  flux locaux, ce qu'un test vérifie.
- Surface : 75 → **82 outils**, 16 → **17 ressources**, 10 → **11 prompts**.
  Tests : 425 → **515** (102 suites).

### À décider par l'auteur
- K1 : laboratoire hôte, référence éthique et n, après le pilote humain ; ce sont des
  événements, non des décisions. K0 : dépôt sur OSF (`empirical/OSF-K0-FILING.md`), puis
  collecte.
- Raccorder ou non le canal intéroceptif au contrôleur homéostatique (cela couplerait les
  deux familles).
- La rc.4 n'ayant pas été publiée, la fusion de la rc.5 avec elle ou leur numérotation
  séparée.

## [3.3.0-rc.4] — 2026-10-19 (candidat local, non publié)

- Origine des biomarqueurs FCS préservée : `simulated` / `reported` ; aucune preuve de mesure déduite du mode `live`.
- Profils de type de substrat explicitement distingués d'un spécimen vérifié ; inférence d'absence du porteur humain corrigée.
- Validation des biomarqueurs dans l'API pure ; refus de NaN, Infinity et valeurs hors domaine.
- Garde-fou étendu aux réponses structurées, ressources textuelles embarquées et chaînes JSON décodées.
- Utilité : déclaration `scale: "cardinal"` requise (migration), poids acceptés normalisés ; contrat conservé dans les rapports.
- Liens actifs du README, de la citation et de la demande de revue corrigés vers le dépôt vérifié.
- Date de publication non déclarée avant publication effective. Archives de validation antérieures conservées comme historiques.
- Aucun changement des fichiers gelés E1/E2 ni des effectifs MCP.
- Revue : `REVUE-v3.3.0-rc.3.md` ; assistance d'IA, sans évaluation externe.

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
