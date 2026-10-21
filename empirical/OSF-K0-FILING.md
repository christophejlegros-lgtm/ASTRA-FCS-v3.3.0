# FCS-K0 : texte du dépôt sur OSF Registries
# FCS-K0 — OSF Registries filing text

**ASTRA-FCS v3.3.0-rc.5** · © Genève 2026 Christophe Jean Legros · Assistance Multi IA

Texte préparé le 21 octobre 2026 pour enregistrer le pilote FCS-K0 ([`PREREG-KINAESTHETIC-K0-PILOT.md`](PREREG-KINAESTHETIC-K0-PILOT.md), [`protocols/FCS-K0.protocol.json`](protocols/FCS-K0.protocol.json)) avec le modèle « OSF Preregistration » (Bowman et al. 2016, https://doi.org/10.31222/osf.io/epgjd) : 25 champs répartis en six sections.

- **Langues.** Chaque champ donne le texte anglais à coller dans le formulaire, puis sa traduction française. Le formulaire est rédigé en anglais pour le lectorat international du registre ; le document K0 joint en est la version de référence.
- **Priorité en cas d'écart** : (1) le protocole JSON, identifié par son empreinte ; (2) le document K0 joint ; (3) le formulaire. Cette règle figure elle-même dans le champ *Other*.
- **Intitulés.** Les intitulés suivent la version publiée du modèle ; le formulaire en ligne peut les formuler un peu autrement.

*Prepared on 21 October 2026. Each field gives the English text to paste, then its French translation. Precedence: protocol JSON, then the attached K0 document, then the form.*

---

## A. Procédure / Procedure

1. **Projet OSF.** Sur https://osf.io, créer un projet, par exemple « ASTRA-FCS — FCS-K0 pilot ».
2. **Fichiers.** Téléverser dans le stockage du projet (*OSF Storage*) :
   - `PREREG-KINAESTHETIC-K0-PILOT.md` ;
   - `FCS-K0.protocol.json` ;
   - l'archive du code source, produite par `git archive` du commit courant de la branche, et dont le nom porte l'identifiant du commit.

   OSF archive avec l'enregistrement les fichiers présents dans le projet, et aucun fichier ne peut être ajouté ni modifié après la soumission.
3. **Modèle.** Depuis l'onglet *Registrations* du projet, créer un nouvel enregistrement avec le modèle **OSF Preregistration**. OSF réserve *Open-Ended Registration* aux études qu'aucun modèle structuré ne couvre, ce qui n'est pas le cas de K0.
4. **Remplissage.** Remplir les métadonnées (partie B), puis les 25 champs (partie C) avec le texte anglais.
5. **Soumission.** Relire puis soumettre. Rendre l'enregistrement public immédiatement est recommandé, puisque le protocole est déjà public sur GitHub ; OSF permet aussi un embargo d'au plus quatre ans.
6. **Approbation.** Chaque administrateur du projet reçoit un courriel d'approbation. Sans refus, OSF approuve l'enregistrement au bout de 48 heures.
7. **Consignation.** Relever le DOI de l'enregistrement et sa date, puis exécuter la partie D. Ne collecter aucune séance réelle avant l'approbation ; si OSF n'affiche que le jour, ne collecter qu'à partir du lendemain.

*Create an OSF project; upload the K0 document, the protocol JSON and a `git archive` of the source; register from the project with the OSF Preregistration template; make it public; after approval, record the DOI and date (part D). No real session before approval.*

---

## B. Métadonnées de l'enregistrement / Registration metadata

**Title** — FCS-K0 — Pilot of the kinaesthetic withdrawal test on an instrumented robot finger (instrument test; exploratory)

**Description** — Descriptive pilot of the instrument for the withdrawal test of the kinaesthetic thesis in the substrate-constrained functionalism (FCS) research programme: an instrumented one-joint robot finger, ten sessions, eight congruence conditions in two families (sensorimotor, interoceptive), analysed with the ASTRA-FCS software. A declared pilot: it tests the instrument, never the thesis. Protocol SHA-256: 1b5c9f3c7731bc6b922d587f38721139bdae9c098f5efdf1ea3a7f73eb0de997.

*FR* — Pilote descriptif de l'instrument du test de retrait de la thèse kinesthésique, dans le programme du fonctionnalisme contraint par le substrat (FCS) : un doigt robotique instrumenté à une articulation, dix séances, huit conditions de congruence en deux familles (sensorimotrice, intéroceptive), analysées par le logiciel ASTRA-FCS. Pilote déclaré : il éprouve l'instrument, jamais la thèse.

**Contributors** — Christophe Jean Legros (administrateur). Ajouter l'identifiant ORCID s'il existe.

**License** — au choix de l'auteur. Suggestion : CC-BY 4.0 pour le texte de l'enregistrement ; le code du dépôt reste sous licence MIT (`LICENSE`).

**Subjects** — à choisir dans la taxonomie d'OSF, par exemple *Artificial Intelligence and Robotics* (Computer Sciences) et *Philosophy of Mind* (Philosophy).

**Tags** — kinaesthesia; interoception; efference copy; reafference; robot finger; tactile sensing; representational similarity analysis; effective dimensionality; equivalence testing; pilot study; preregistration; consciousness science

---

## C. Formulaire « OSF Preregistration » / Form

### 1. Study Information

#### 1.1 Title

**EN** — FCS-K0 — Pilot of the kinaesthetic withdrawal test on an instrumented robot finger (instrument test; exploratory)

**FR** — FCS-K0 — Pilote du test de retrait de la thèse kinesthésique sur un doigt robotique instrumenté (test de l'instrument ; exploratoire)

#### 1.2 Authors

**EN** — Christophe Jean Legros (Assistance Multi IA, Geneva, Switzerland)

**FR** — Christophe Jean Legros (Assistance Multi IA, Genève, Suisse)

#### 1.3 Description

**EN** — FCS-K0 is a descriptive pilot of the instrument that will test the withdrawal condition of the kinaesthetic thesis in the substrate-constrained functionalism (FCS) research programme. The thesis holds that the first closure of level II is the sensorimotor one, between efference and reafference, rather than the interoceptive one. Its withdrawal condition reads: if the effects on dimensionality under rupture of closure appear for manipulations of interoceptive congruence and not for manipulations of sensorimotor congruence, the first closure is interoceptive and level II is redefined. The confirmatory test is FCS-K1, in human participants, to be registered separately. K0 runs the same analysis on an instrumented one-joint robot finger, in which the system under test is the ASTRA-FCS software: separate somatosensory and interoceptive channels, a forward model with a comparator, and a homeostatic predictor. On real hardware, K0 reports the operational closure of the loop, the manipulation and specificity checks, the timing accuracy of the chain, and the full output of the analysis. K0 is declared a pilot ("role": "pilot"). Whatever its data, the analysis code never sets a withdrawal outcome from it, and its results bear on the instrument, not on the thesis, nor on experience in any substrate.

**FR** — FCS-K0 est le pilote descriptif de l'instrument qui éprouvera la condition de retrait de la thèse kinesthésique, dans le programme du fonctionnalisme contraint par le substrat (FCS). La thèse tient que la première clôture du niveau II est la clôture sensorimotrice, entre efférence et réafférence, et non la clôture intéroceptive. Sa condition de retrait s'énonce ainsi : si les effets de dimensionnalité sous rupture de clôture apparaissent pour des manipulations de la congruence intéroceptive et non pour des manipulations de la congruence sensorimotrice, la première clôture est intéroceptive et le niveau II est redéfini. Le test confirmatoire est FCS-K1, chez des participants humains, enregistré séparément. K0 exécute la même analyse sur un doigt robotique instrumenté à une articulation, dont le système éprouvé est le logiciel ASTRA-FCS : canaux somatosensoriel et intéroceptif séparés, modèle prédictif avec comparateur, prédicteur homéostatique. Sur matériel réel, K0 rapporte la clôture opérationnelle de la boucle, les contrôles de manipulation et de spécificité, l'exactitude temporelle de la chaîne et les sorties complètes de l'analyse. K0 est déclaré pilote (`"role": "pilot"`) : quelles que soient ses données, le code d'analyse n'en tire jamais de résultat de retrait, et ses résultats portent sur l'instrument, non sur la thèse ni sur l'expérience d'un quelconque substrat.

#### 1.4 Hypotheses

**EN** — None. K0 is descriptive: it tests no hypothesis and sets no success threshold. For comparison only, a simulated dry run of the same chain (ten simulated sessions, command `npm run kin:k0:dryrun`) gives a non-monotone sensorimotor response, classified "inconclusive" by the monotonicity guard, and an increase under interoceptive manipulation. These are properties of the simulated instrument and say nothing about the thesis.

**FR** — Aucune. K0 est descriptif : il n'éprouve aucune hypothèse et ne fixe aucun seuil de réussite. À titre de comparaison seulement, une simulation à blanc de la même chaîne (dix séances simulées, commande `npm run kin:k0:dryrun`) donne une réponse sensorimotrice non monotone, classée « non concluante » par la garde de monotonie, et une augmentation sous manipulation intéroceptive. Ce sont des propriétés de l'instrument simulé, qui ne disent rien sur la thèse.

### 2. Design Plan

#### 2.1 Study type

**EN** — Experiment.

**FR** — Expérience (option *Experiment*). Les manipulations sont appliquées par le chercheur à chaque unité ; aucune assignation entre groupes n'est en jeu.

#### 2.2 Blinding

**EN** — No blinding is involved in this study.

**FR** — Aucune mise en aveugle (option *No blinding is involved in this study*).

#### 2.3 Is there any additional blinding in this study?

**EN** — No. The analysis is run by the frozen code of the repository on the protocol identified by its SHA-256; it leaves the analyst no parameter to set.

**FR** — Non. L'analyse est exécutée par le code gelé du dépôt, sur le protocole identifié par son empreinte SHA-256 ; elle ne laisse aucun paramètre au choix de l'analyste.

#### 2.4 Study design

**EN** — Within-unit design. The unit is a recording session of the instrumented finger: 10 sessions, on different days, each after reinstallation of the bench. Each session comprises two blocks. The first is a congruent calibration block of 1,500 commands, after which the forward model and the interoceptive predictor are frozen. The second is a test block of three passes over eight probe movements, in an order drawn at random on each pass. The probes are four amplitudes (0.3, 0.6, 0.9 and 1.2 rad) pressing on two objects (foam and aluminium, at room temperature), each a progressive press of 60 control periods. Eight conditions are applied to the same recorded test block:
- congruent: baseline, level 0, no manipulation;
- sm-delay-100, sm-delay-200, sm-delay-300 and sm-delay-500: sensorimotor family, delay of the somatosensory return by 100, 200, 300 and 500 ms, levels 0.2, 0.4, 0.6 and 1;
- io-gain-1.5 and io-gain-2.5: interoceptive family, deviations from the setpoint multiplied by 1.5 and 2.5, levels 1/3 and 2/3;
- io-decouple: interoceptive family, decoupling by shuffled replay, level 1.

The two families are kept apart in three ways. A condition belongs to one family only. No physical signal belongs to both channels. The exteroceptive fusion refuses interoceptive frames. The robot controller executes the probes open-loop. The system under test is ASTRA-FCS, and the manipulations are applied to the hardware timestamps by the reference implementation of the firmware delay line (src/engine/congruence.ts). A pure interoceptive delay is not used, because a homeostatic predictor barely registers it.

**FR** — Plan intra-unité. L'unité est une séance d'enregistrement du doigt instrumenté : 10 séances, sur des jours différents, chacune après réinstallation du banc. Chaque séance comprend deux blocs. Le premier est un bloc de calibration congruent de 1 500 commandes, après lequel le modèle prédictif et le prédicteur intéroceptif sont gelés. Le second est un bloc d'essai de trois passages sur huit mouvements-sondes, dans un ordre tiré au hasard à chaque passage. Les sondes combinent quatre amplitudes (0,3, 0,6, 0,9 et 1,2 rad) et deux objets (mousse et aluminium, à température ambiante) ; chacune est un appui progressif de 60 périodes de commande. Huit conditions sont appliquées au même bloc d'essai enregistré :
- `congruent` : ligne de base, niveau 0, aucune manipulation ;
- `sm-delay-100`, `sm-delay-200`, `sm-delay-300` et `sm-delay-500` : famille sensorimotrice, retour somatosensoriel retardé de 100, 200, 300 et 500 ms, niveaux 0,2, 0,4, 0,6 et 1 ;
- `io-gain-1.5` et `io-gain-2.5` : famille intéroceptive, écarts à la consigne multipliés par 1,5 et 2,5, niveaux 1/3 et 2/3 ;
- `io-decouple` : famille intéroceptive, découplage par relecture mélangée, niveau 1.

Les deux familles sont séparées de trois manières. Une condition n'appartient qu'à une famille. Aucun signal physique n'appartient aux deux canaux. La fusion extéroceptive refuse les trames intéroceptives. Le contrôleur du robot exécute les sondes en boucle ouverte. Le système éprouvé est ASTRA-FCS, et les manipulations sont appliquées aux horodatages matériels par l'implémentation de référence de la ligne à retard du micrologiciel (`src/engine/congruence.ts`). Un délai intéroceptif pur n'est pas utilisé, car un prédicteur homéostatique le perçoit à peine.

#### 2.5 Randomization

**EN** — The probe order is drawn at random on each of the three passes. The order actually executed is recorded in each session file, which maps every command to its probe. The conditions are not randomized: all eight are applied offline to the same recorded test block, so their order cannot affect the data. The decoupling manipulation uses a local generator seeded in the protocol (seed 1), which leaves the global random stream untouched.

**FR** — L'ordre des sondes est tiré au hasard à chacun des trois passages. L'ordre réellement exécuté est consigné dans le fichier de chaque séance, qui associe chaque commande à sa sonde. Les conditions ne sont pas tirées au hasard : les huit sont appliquées hors ligne au même bloc d'essai enregistré, si bien que leur ordre ne peut pas affecter les données. Le découplage utilise un générateur local dont la graine est fixée par le protocole (graine 1) ; le flux aléatoire global n'est pas touché.

### 3. Sampling Plan

#### 3.1 Existing data

**EN** — Registration prior to creation of data.

**FR** — Enregistrement antérieur à la création des données (option *Registration prior to creation of data*). **À confirmer par l'auteur avant de soumettre** : aucune séance n'a été enregistrée sur le banc.

#### 3.2 Explanation of existing data

**EN** — No session has been recorded on the bench. The only existing outputs are those of the simulated dry run, produced by the simulated finger of ASTRA-FCS. They are marked "simulated", test the pipeline only, and are never used as K0 data.

**FR** — Aucune séance n'a été enregistrée sur le banc. Les seules sorties existantes sont celles de la simulation à blanc, produites par le doigt simulé d'ASTRA-FCS. Elles portent l'origine `simulated`, n'éprouvent que la chaîne de traitement et ne servent jamais de données de K0.

#### 3.3 Data collection procedures

**EN** — The bench has a somatosensory side and an interoceptive side.
- Somatosensory side: a one-joint finger driven by a servomotor with an absolute encoder and motor-current sensing; a DIGIT optical tactile sensor (Lambeta et al. 2020), whose normal forces come from a calibration model and which, being frame-based, provides no FA2 channel; a heated contact thermistor that reads heat flux; and two stretch gauges on the "skin" of the joint.
- Interoceptive side: an actuator thermistor, a battery fuel gauge and a board temperature sensor.

The declared source signals are servo-absolute-encoder, servo-motor-current (effort, TENDON class), digit-optical-tactile, heated-contact-thermistor, stretch-gauge-0 and stretch-gauge-1 for the somatosensory channel, and actuator-thermistor, battery-fuel-gauge and board-thermistor for the interoceptive channel. The two lists are disjoint: motor current serves as effort and never as interoceptive energy draw, and charge comes from a separate gauge.

The interoceptive variables are actuatorTempC, stateOfCharge and boardTempC. Each viable range is the manufacturer's rated operating range of the part, and each setpoint is the midpoint of its recommended operating range; these values are recorded in the session metadata before the first session.

All signals share one clock domain, that of the microcontroller, and every command and every return carries a hardware timestamp. Each session is saved as a JSON file with the fields unitId, collectedAt, interoceptiveSpecs, efference, somatosensory, interoceptive, interoceptiveLoad (optional), probes, probeOfCommand and testStart (src/engine/body-probes.ts). Data passed to ASTRA-FCS are marked "reported": the software does not verify them and never promotes them to measurements. Observations are built with npm run kin:k0:observe. Sessions are recorded only after this registration has been approved.

**FR** — Le banc comporte un côté somatosensoriel et un côté intéroceptif.
- Côté somatosensoriel : un doigt à une articulation actionné par un servomoteur à encodeur absolu, avec mesure du courant moteur ; un capteur tactile optique DIGIT (Lambeta et al. 2020), dont les forces normales proviennent d'un modèle d'étalonnage et qui, fonctionnant par images, ne fournit pas de canal FA2 ; une thermistance chauffée qui mesure le flux de chaleur au contact ; deux jauges d'étirement sur la « peau » de l'articulation.
- Côté intéroceptif : une thermistance d'actionneur, une jauge de batterie et une sonde de température de la carte.

Les signaux sources déclarés sont `servo-absolute-encoder`, `servo-motor-current` (effort, classe TENDON), `digit-optical-tactile`, `heated-contact-thermistor`, `stretch-gauge-0` et `stretch-gauge-1` pour le canal somatosensoriel, et `actuator-thermistor`, `battery-fuel-gauge` et `board-thermistor` pour le canal intéroceptif. Les deux listes sont disjointes : le courant moteur sert d'effort et jamais de consommation intéroceptive, et la charge provient d'une jauge distincte.

Les variables intéroceptives sont `actuatorTempC`, `stateOfCharge` et `boardTempC`. Chaque plage viable est la plage de fonctionnement assignée par le fabricant de la pièce, et chaque consigne est le milieu de sa plage recommandée ; ces valeurs sont consignées dans les métadonnées de la session avant la première séance.

Tous les signaux partagent un domaine d'horloge unique, celui du microcontrôleur, et chaque commande comme chaque retour porte un horodatage matériel. Chaque séance est enregistrée dans un fichier JSON comportant les champs `unitId`, `collectedAt`, `interoceptiveSpecs`, `efference`, `somatosensory`, `interoceptive`, `interoceptiveLoad` (facultatif), `probes`, `probeOfCommand` et `testStart` (`src/engine/body-probes.ts`). Les données transmises à ASTRA-FCS portent l'origine `reported` : le logiciel ne les vérifie pas et ne les promeut jamais au rang de mesures. Les observations sont construites par `npm run kin:k0:observe`. Les séances ne sont enregistrées qu'après l'approbation de cet enregistrement.

#### 3.4 Sample size

**EN** — 10 sessions (units), on different days, each after reinstallation of the bench.

**FR** — 10 séances (unités), sur des jours différents, chacune après réinstallation du banc.

#### 3.5 Sample size rationale

**EN** — Fixed by the author on 20 October 2026. K0 tests no hypothesis and sets no success threshold, so no power analysis applies. Ten sessions on different days, each after reinstallation, expose the session-to-session variability of the instrument. The analysis code estimates nothing until this number of usable units is reached (minUnits = 10 in the protocol).

**FR** — Fixé par l'auteur le 20 octobre 2026. K0 n'éprouve aucune hypothèse et ne fixe aucun seuil de réussite ; aucune analyse de puissance ne s'applique. Dix séances sur des jours différents, chacune après réinstallation, exposent la variabilité de l'instrument d'une séance à l'autre. Le code d'analyse n'estime rien tant que ce nombre d'unités utilisables n'est pas atteint (`minUnits` = 10 dans le protocole).

#### 3.6 Stopping rule

**EN** — Collection stops at the tenth accepted session. A session is a technical failure if npm run kin:k0:observe refuses its recording, that is if a field is missing, if a probe has no paired return or no interoceptive reading, or if fewer than two features are non-constant. A technical failure is reported with its reason and replaced by a new session on another day. No session is dropped or replaced for any other reason. The closure and timing of each session may be checked as soon as it is recorded, to monitor the instrument. The dimensionality analysis is run once, on the ten accepted sessions.

**FR** — La collecte s'arrête à la dixième séance acceptée. Une séance est un échec technique si `npm run kin:k0:observe` refuse son enregistrement : champ manquant, sonde sans retour apparié ou sans lecture intéroceptive, ou moins de deux caractéristiques non constantes. Un échec technique est rapporté avec son motif et remplacé par une nouvelle séance, un autre jour. Aucune séance n'est écartée ni remplacée pour un autre motif. La clôture et l'exactitude temporelle d'une séance peuvent être contrôlées dès son enregistrement, pour surveiller l'instrument. L'analyse de dimensionnalité n'est exécutée qu'une fois, sur les dix séances acceptées.

### 4. Variables

#### 4.1 Manipulated variables

**EN** — The congruence condition, with eight levels: a baseline and two families, identified as in the protocol.
- congruent: baseline, level 0, no manipulation.
- sm-delay-100, sm-delay-200, sm-delay-300 and sm-delay-500: sensorimotor family; the somatosensory return is delayed by 100, 200, 300 and 500 ms; levels 0.2, 0.4, 0.6 and 1.
- io-gain-1.5 and io-gain-2.5: interoceptive family; the deviations of each interoceptive variable from its setpoint are multiplied by 1.5 and 2.5; levels 1/3 and 2/3.
- io-decouple: interoceptive family; the interoceptive values are permuted across their timestamps (seeded shuffle, seed 1); level 1.

The level codes the strength of the rupture within a family, from 0 (congruent) to 1 (the family's strongest rupture).

**FR** — La condition de congruence, à huit niveaux : une ligne de base et deux familles, identifiées comme dans le protocole.
- `congruent` : ligne de base, niveau 0, aucune manipulation.
- `sm-delay-100`, `sm-delay-200`, `sm-delay-300` et `sm-delay-500` : famille sensorimotrice ; le retour somatosensoriel est retardé de 100, 200, 300 et 500 ms ; niveaux 0,2, 0,4, 0,6 et 1.
- `io-gain-1.5` et `io-gain-2.5` : famille intéroceptive ; les écarts de chaque variable intéroceptive à sa consigne sont multipliés par 1,5 et 2,5 ; niveaux 1/3 et 2/3.
- `io-decouple` : famille intéroceptive ; les valeurs intéroceptives sont permutées entre leurs horodatages (mélange à graine fixe, graine 1) ; niveau 1.

Le niveau code l'intensité de la rupture au sein d'une famille, de 0 (congruent) à 1 (rupture la plus forte de la famille).

#### 4.2 Measured variables

**EN** — Five variables are measured.
1. Comparator error of the somatosensory channel: for each paired command, the difference between the return and the prediction of the frozen forward model, over the afferent-class features.
2. Interoceptive prediction error: for each delivered reading, the error of the frozen homeostatic predictor on each declared variable.
3. Manipulation check: the mean RMS error of each channel over the test block, under each condition.
4. Operational closure (criterion M3) of each session, assessed with the MCP tool kin_closure. It comprises the fraction of commands paired with a return, the median latency, and the gain in informativeness of the real commands over a surrogate (the same commands circularly shifted by half a session). These are reported against the declared default criteria (paired fraction ≥ 0.9, median latency ≤ 100 ms, gain ≥ 0.05), which are not success thresholds for K0.
5. Timing accuracy of the chain: the gap between the calibrated and the observed latency, and the number of unpaired commands.

**FR** — Cinq variables sont mesurées.
1. Erreur du comparateur somatosensoriel : pour chaque commande appariée, l'écart entre le retour et la prédiction du modèle prédictif gelé, sur les caractéristiques des classes afférentes.
2. Erreur de prédiction intéroceptive : pour chaque lecture délivrée, l'erreur du prédicteur homéostatique gelé sur chaque variable déclarée.
3. Contrôle de manipulation : l'erreur quadratique moyenne de chaque canal sur le bloc d'essai, sous chaque condition.
4. Clôture opérationnelle (critère M3) de chaque séance, évaluée par l'outil MCP `kin_closure`. Elle comprend la fraction des commandes appariées à un retour, la latence médiane, et le gain d'informativité des commandes réelles sur un substitut (les mêmes commandes décalées circulairement d'une demi-séance). Ces grandeurs sont rapportées au regard des critères par défaut déclarés (fraction appariée ≥ 0,9, latence médiane ≤ 100 ms, gain ≥ 0,05), qui ne sont pas des seuils de réussite pour K0.
5. Exactitude temporelle de la chaîne : l'écart entre la latence calibrée et la latence observée, et le nombre de commandes non appariées.

#### 4.3 Indices

**EN** — The indices are built in four steps.
1. Probe response: the mean somatosensory comparator errors and the mean interoceptive prediction errors over the probe, concatenated. Interoceptive readings are assigned to the probe running when they are delivered. Each feature is then standardized across the eight probes, and constant features are dropped. With somatosensory errors alone, an interoceptive absence would be guaranteed by construction.
2. Dissimilarity matrix, per session and condition: 1 − Pearson r between probe responses (Kriegeskorte, Mur & Bandettini 2008).
3. Effective dimensionality: the participation ratio of the eigenvalue spectrum given by classical multidimensional scaling of that matrix (Torgerson 1952; Gao & Ganguli 2015).
4. Per session and family: the ordinary-least-squares slope of effective dimensionality on level, baseline included, and the contrast of each level with the session's own baseline. For the manipulation check, the slope on level of each channel's mean error.

**FR** — Les indices sont construits en quatre étapes.
1. Réponse d'une sonde : les erreurs moyennes du comparateur somatosensoriel et les erreurs moyennes de prédiction intéroceptive sur la sonde, concaténées. Les lectures intéroceptives sont rattachées à la sonde en cours au moment de leur délivrance. Chaque caractéristique est ensuite centrée-réduite sur les huit sondes, et les caractéristiques constantes sont écartées. Avec les seules erreurs somatosensorielles, une absence intéroceptive serait garantie par construction.
2. Matrice de dissimilarité, par séance et par condition : 1 − r de Pearson entre réponses de sondes (Kriegeskorte, Mur & Bandettini 2008).
3. Dimensionnalité effective : le rapport de participation du spectre des valeurs propres que donne le positionnement multidimensionnel classique de cette matrice (Torgerson 1952 ; Gao & Ganguli 2015).
4. Par séance et par famille : la pente des moindres carrés ordinaires de la dimensionnalité effective sur le niveau, ligne de base incluse, et le contraste de chaque niveau avec la ligne de base de la séance. Pour le contrôle de manipulation, la pente sur le niveau de l'erreur moyenne de chaque canal.

### 5. Analysis Plan

#### 5.1 Statistical models

**EN** — For each family, the per-session slopes are summarized by a two-sided Student t interval at the (1 − 2α) level, that is 90 % for α = 0.05, which is a one-sided α at each bound. The same interval is computed for each level's contrast with the baseline, and for the manipulation-check slopes of the family's own channel and of the other channel. The implementation is analyseKinaestheticTest in src/engine/fcs/kinaesthetic-withdrawal.ts, run by npm run kin:analyse with the SHA-256 quoted under Other.

**FR** — Pour chaque famille, les pentes par séance sont résumées par un intervalle de Student bilatéral au niveau (1 − 2α), soit 90 % pour α = 0,05, ce qui revient à un α unilatéral à chaque borne. Le même intervalle est calculé pour le contraste de chaque niveau avec la ligne de base, et pour les pentes du contrôle de manipulation, sur le canal de la famille et sur l'autre canal. L'implémentation est `analyseKinaestheticTest` dans `src/engine/fcs/kinaesthetic-withdrawal.ts`, exécutée par `npm run kin:analyse` avec l'empreinte SHA-256 citée au champ *Other*.

#### 5.2 Transformations

**EN** — Each response feature is standardized across probes, and constant features are dropped. The dissimilarity is 1 − r, followed by classical multidimensional scaling and the participation ratio. Levels are coded as listed under Manipulated variables. There is no other transformation.

**FR** — Chaque caractéristique de réponse est centrée-réduite sur les sondes, et les caractéristiques constantes sont écartées. La dissimilarité est 1 − r ; viennent ensuite le positionnement multidimensionnel classique et le rapport de participation. Les niveaux sont codés comme au champ *Manipulated variables*. Il n'y a aucune autre transformation.

#### 5.3 Inference criteria

**EN** — The parameters are those of FCS-K1, so that the same rule is exercised: α = 0.05 one-sided (90 % intervals), a smallest effect size of interest (SESOI) of 0.25 participation-ratio units over the full level range, and the superiority criterion.

A family is classified as follows:
- "equivalent" (effect absent) only if the slope interval and every level-contrast interval lie within ±SESOI (monotonicity guard);
- otherwise "increase" if the lower bound of the slope interval exceeds 0;
- "decrease" if its upper bound is below 0;
- "inconclusive" in every other case.

The manipulation check is passed if the lower bound of the own-channel error slope exceeds 0, and it is specific if that bound also exceeds the upper bound of the other channel's slope. The pattern is interoceptive-only, sensorimotor-only, both, neither, or undetermined with its reasons. Because K0 is a pilot, these outputs are reported as they are and are never turned into a withdrawal outcome.

**FR** — Les paramètres sont ceux de FCS-K1, afin d'éprouver la même règle : α = 0,05 unilatéral (intervalles à 90 %), une plus petite taille d'effet d'intérêt (SESOI) de 0,25 unité de rapport de participation sur l'étendue complète des niveaux, et le critère de supériorité.

Une famille est classée comme suit :
- « équivalente » (effet absent) seulement si l'intervalle de la pente et l'intervalle de chaque contraste par niveau sont compris dans ±SESOI (garde de monotonie) ;
- sinon, « augmentation » si la borne inférieure de l'intervalle de la pente dépasse 0 ;
- « diminution » si sa borne supérieure est inférieure à 0 ;
- « non concluante » dans tous les autres cas.

Le contrôle de manipulation est réussi si la borne inférieure de la pente de l'erreur du canal propre dépasse 0, et il est spécifique si cette borne dépasse aussi la borne supérieure de la pente de l'autre canal. Le motif est intéroceptif seul, sensorimoteur seul, les deux, aucun, ou indéterminé avec ses raisons. K0 étant un pilote, ces sorties sont rapportées telles quelles et ne deviennent jamais un résultat de retrait.

#### 5.4 Data exclusion

**EN** — No session or observation is excluded on the basis of its results. Technical failures are handled as stated under Stopping rule. If the analysis code excludes a unit from a family, because the unit has no baseline or no manipulated level or because its dissimilarity matrix is invalid, that unit is reported with the reason the code gives and is not replaced. Observations referring to conditions outside the protocol are set aside by the code and reported.

**FR** — Aucune séance ni observation n'est écartée en raison de ses résultats. Les échecs techniques sont traités comme indiqué au champ *Stopping rule*. Si le code d'analyse écarte une unité d'une famille, parce qu'elle n'a pas de ligne de base ou pas de niveau manipulé, ou parce que sa matrice de dissimilarité est invalide, cette unité est rapportée avec le motif donné par le code et n'est pas remplacée. Les observations qui renvoient à des conditions extérieures au protocole sont mises à l'écart par le code et rapportées.

#### 5.5 Missing data

**EN** — A session lacking any stream or field is a technical failure (see Stopping rule). Within an accepted session, every condition is computed from the same recording, so no condition can be missing. If fewer than ten units remain usable in a family, the code reports "insufficient units" for that family and gives no estimate; this is reported as such.

**FR** — Une séance à laquelle manque un flux ou un champ est un échec technique (voir *Stopping rule*). Dans une séance acceptée, toutes les conditions sont calculées à partir du même enregistrement : aucune ne peut manquer. S'il reste moins de dix unités utilisables dans une famille, le code indique « unités insuffisantes » pour cette famille et ne donne aucune estimation ; ce résultat est rapporté tel quel.

#### 5.6 Exploratory analysis

**EN** — K0 is exploratory as a whole. Beyond the outputs above, the closure and timing measures of each session will be compared with the simulated dry run. Any further analysis will be labelled exploratory.

**FR** — K0 est exploratoire dans son ensemble. Au-delà des sorties ci-dessus, les mesures de clôture et d'exactitude temporelle de chaque séance seront comparées à la simulation à blanc. Toute autre analyse sera signalée comme exploratoire.

### 6. Other

#### 6.1 Other

**EN** — Identity of the protocol. The SHA-256 of the scientific content of protocols/FCS-K0.protocol.json, excluding its status and registry fields, is 1b5c9f3c7731bc6b922d587f38721139bdae9c098f5efdf1ea3a7f73eb0de997. It is computed on the canonical JSON of the scientific fields, not on the bytes of the file, so sha256sum of the file gives a different value. It can be checked with node --import tsx scripts/kin.mjs hash empirical/protocols/FCS-K0.protocol.json --strict. The protocol was frozen in commit 23088e6669904916f1004c5278b3c6936b1a7ef8 of https://github.com/christophejlegros-lgtm/ASTRA-FCS-v3.3.0.

Attached files. The K0 preregistration document, in French with English summaries; the protocol JSON; and an archive of the source code made with git archive, whose file name carries the commit identifier.

Precedence in case of discrepancy. First the protocol JSON, identified by its hash; then the attached K0 document; then this form.

Ethics. Not applicable: the manipulations are delivered to a silicon substrate (ethics decision PASS in the code).

Scope. K0 decides nothing about the kinaesthetic thesis, about experience, or about any degree of either. An effective dimensionality is here a property of an instrument's errors.

Related registration. FCS-K1, the confirmatory test in human participants, will be filed separately after ethics approval and a human pilot.

Template and references. OSF Preregistration template: Bowman et al. (2016), https://doi.org/10.31222/osf.io/epgjd. Gao & Ganguli (2015), https://doi.org/10.1016/j.conb.2015.04.003. Kriegeskorte, Mur & Bandettini (2008), https://doi.org/10.3389/neuro.06.004.2008. Lambeta et al. (2020), https://doi.org/10.1109/LRA.2020.2977257. Torgerson (1952), https://doi.org/10.1007/BF02288916.

**FR** — Identité du protocole. L'empreinte SHA-256 du contenu scientifique de `protocols/FCS-K0.protocol.json`, hors champs `status` et `registry`, est `1b5c9f3c7731bc6b922d587f38721139bdae9c098f5efdf1ea3a7f73eb0de997`. Elle est calculée sur le JSON canonique des champs scientifiques, non sur les octets du fichier : `sha256sum` appliqué au fichier donne une autre valeur. On la vérifie par `node --import tsx scripts/kin.mjs hash empirical/protocols/FCS-K0.protocol.json --strict`. Le protocole a été gelé dans le commit `23088e6669904916f1004c5278b3c6936b1a7ef8` de https://github.com/christophejlegros-lgtm/ASTRA-FCS-v3.3.0.

Fichiers joints. Le document de préenregistrement K0, en français avec des résumés anglais ; le protocole JSON ; une archive du code source produite par `git archive`, dont le nom de fichier porte l'identifiant du commit.

Priorité en cas d'écart. D'abord le protocole JSON, identifié par son empreinte ; puis le document K0 joint ; enfin ce formulaire.

Éthique. Sans objet : les manipulations sont délivrées à un substrat de silicium (décision éthique `PASS` dans le code).

Portée. K0 ne décide rien de la thèse kinesthésique, de l'expérience, ni d'un quelconque degré de l'une ou de l'autre. Une dimensionnalité effective y est une propriété des erreurs d'un instrument.

Enregistrement lié. FCS-K1, le test confirmatoire chez des participants humains, sera déposé séparément, après l'approbation éthique et un pilote humain.

Modèle et références : voir le texte anglais.

*Phrase facultative, au choix de l'auteur, sur l'usage d'un assistant :* « The analysis code and the documents were written with the assistance of Claude (Anthropic), as recorded in the commit history of the repository. »

---

## D. Après l'approbation : consigner le dépôt et pousser / After approval: record the filing and push

Prérequis : Git et Node.js 20.6 ou plus récent (22 recommandé). Les commandes ci-dessous valent à l'identique dans PowerShell, dans l'invite de commandes Windows et dans un terminal macOS ou Linux ; tapez-les une par une.

**Remplacements.** Dans les commandes, remplacez :
- `10.17605/OSF.IO/XXXXX` par le DOI affiché par OSF ;
- `AAAA-MM-JJ` par la date d'enregistrement, ou par la date et l'heure si OSF les affiche (par exemple `2026-10-23T14:05:00+02:00`).

Si vous oubliez un remplacement, la commande refuse et n'écrit rien.

```
git clone --branch rc.5-kinaesthetic-withdrawal https://github.com/christophejlegros-lgtm/ASTRA-FCS-v3.3.0.git
cd ASTRA-FCS-v3.3.0
npm ci
node --import tsx scripts/kin.mjs file empirical/protocols/FCS-K0.protocol.json --reference 10.17605/OSF.IO/XXXXX --filed-at AAAA-MM-JJ --dry-run
node --import tsx scripts/kin.mjs file empirical/protocols/FCS-K0.protocol.json --reference 10.17605/OSF.IO/XXXXX --filed-at AAAA-MM-JJ
npm run test:body
git add empirical/protocols/FCS-K0.protocol.json empirical/PREREG-KINAESTHETIC-K0-PILOT.md
git commit -m "FCS-K0 filed on OSF Registries (10.17605/OSF.IO/XXXXX)"
git push
```

Ce que font ces commandes :
- **`--dry-run`** affiche ce qui serait écrit, sans rien écrire.
- **La seconde commande `file`** inscrit `"status": "filed"` et le registre dans le JSON, remplace la ligne de statut du document K0 par « DÉPOSÉ LE … / FILED ON … », vérifie que l'empreinte est inchangée et refuse d'écraser un dépôt déjà consigné.
- **`npm run test:body`** vérifie notamment que le JSON et la ligne de statut concordent.

**Variantes.**
- *PR #3 déjà fusionnée* : omettre `--branch rc.5-kinaesthetic-withdrawal`. Le clone suit alors `main`, et `git push` y envoie le commit.
- *Clone existant* : remplacer les deux premières lignes par `git pull`, exécuté dans le dossier du dépôt.
- *Première utilisation de Git sur la machine* : exécuter une fois `git config --global user.name "Christophe Jean Legros"` et `git config --global user.email "Assistant-Multi-IA@proton.me"`. Avec Git pour Windows, le premier `git push` ouvre en général une fenêtre d'authentification GitHub.
- *PowerShell refuse d'exécuter `npm`* (« l'exécution de scripts est désactivée sur ce système ») : taper `npm.cmd ci` et `npm.cmd run test:body`.

*Why `node --import tsx` rather than `npm run kin:file -- …`: PowerShell can swallow the `--` that npm needs to pass arguments on.*

---

## Références / References

- Bowman, S. D., DeHaven, A. C., Errington, T. M., Hardwicke, T. E., Mellor, D. T., Nosek, B. A., & Soderberg, C. K. (2016). *OSF Prereg Template*. MetaArXiv. https://doi.org/10.31222/osf.io/epgjd (DOI vérifié le 21 octobre 2026 sur la notice RePEc/IDEAS et dans la documentation du paquet R `preregr`.)
- Les autres références, aux DOI vérifiés sur Crossref le 20 octobre 2026, sont celles de [`PREREG-KINAESTHETIC-K0-PILOT.md`](PREREG-KINAESTHETIC-K0-PILOT.md).
- Procédure OSF : centre d'aide d'OSF, « Select a Registration Template » (https://help.osf.io/hc/en-us/articles/360019738794-Select-a-Registration-Template), consulté le 21 octobre 2026. L'approbation sous 48 heures et l'embargo d'au plus quatre ans proviennent du guide CASRAI sur la préinscription OSF (https://casrai.org/guides/osf-preregistration), source secondaire.
