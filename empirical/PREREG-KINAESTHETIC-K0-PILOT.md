# FCS-K0 : pilote instrumental du test de retrait de la thèse kinesthésique (doigt robotique)
# FCS-K0 — Instrument pilot of the kinaesthetic withdrawal test (robot finger)

**Statut / Status : COMPLET, PRÊT À DÉPOSER sur OSF Registries, non encore déposé / COMPLETE, READY TO FILE (OSF Registries), not yet filed.** Décisions de l'auteur arrêtées le 20 octobre 2026 (v3.3.0-rc.5). Le dépôt est un enregistrement de **pilote exploratoire** : K0 éprouve l'instrument, jamais la thèse.

- Protocole machine : [`protocols/FCS-K0.protocol.json`](protocols/FCS-K0.protocol.json)
- SHA-256 du contenu scientifique (hors `status` et `registry`) : `1b5c9f3c7731bc6b922d587f38721139bdae9c098f5efdf1ea3a7f73eb0de997`
- Vérification : `npm run kin:protocol -- empirical/protocols/FCS-K0.protocol.json --strict` ; cohérence document–protocole contrôlée par `tests/kinaesthetic-protocols.test.ts`.

© Genève 2026 Christophe Jean Legros · Assistance Multi IA

---

## 0. Rôle / Role

K0 est déclaré `role: "pilot"`. Quelles que soient ses données, `analyseKinaestheticTest` ne fixe jamais de résultat de retrait pour lui. Le substrat est un système conçu par l'auteur : ses résultats renseignent sur l'instrument, non sur la conscience du vivant. Le test confirmatoire est FCS-K1, chez l'humain ([`PREREG-KINAESTHETIC-K1.md`](PREREG-KINAESTHETIC-K1.md)).

*K0 is a declared pilot: it never sets a withdrawal outcome. The confirmatory test is FCS-K1 (human participants).*

## 1. Questions du pilote / Pilot questions

Le pilote est **descriptif** et ne fixe aucun seuil de réussite. Il rapporte, pour dix séances sur matériel réel :

1. la clôture opérationnelle M3 de chaque séance (`kin_closure`) : fraction appariée, latence médiane, informativité de la commande contre le substitut ;
2. les contrôles de manipulation et de spécificité de chaque famille ;
3. l'exactitude temporelle de la chaîne, c'est-à-dire l'écart entre latence calibrée et latence observée, et les commandes non appariées ;
4. les sorties complètes de l'analyse : dimensionnalités, pentes, contrastes par niveau, garde de monotonie, motif.

Une simulation à blanc de la même chaîne (`npm run kin:k0:dryrun`) donne un point de comparaison. Ses dix séances simulées produisent une réponse sensorimotrice non monotone, classée « non concluante » par la garde de monotonie, et une augmentation sous manipulation intéroceptive. Ce sont des propriétés de l'instrument simulé, qui ne disent rien sur la thèse.

*Descriptive pilot: closure, manipulation and specificity checks, timing accuracy, full analysis output, compared with the simulated dry run.*

## 2. Substrat et unité / Substrate and unit

- **Banc minimal**, décision du 20 octobre 2026. Un doigt à une articulation actionné par un servomoteur à encodeur absolu, avec mesure du courant moteur. Un capteur tactile optique DIGIT (Lambeta et al. 2020), dont les forces normales sont obtenues par un modèle d'étalonnage ; ce capteur, fonctionnant par images, ne fournit pas de canal FA2. Une thermistance qui chauffe le contact et mesure le flux. Deux jauges d'étirement sur la « peau » de l'articulation. Côté intéroceptif : une thermistance d'actionneur, une jauge de batterie et une sonde de température de la carte.
- **Unité** : la séance (`session`). **Effectif** : 10 séances, sur des jours différents, après réinstallation du banc.
- **Échecs techniques et arrêt** (précisé le 21 octobre 2026, avant le dépôt) : une séance dont l'enregistrement est refusé par `kin:k0:observe` (champ manquant, sonde sans retour apparié ou sans lecture intéroceptive, moins de deux caractéristiques non constantes) est un échec technique. Elle est rapportée avec son motif, puis remplacée par une nouvelle séance, un autre jour, jusqu'à dix séances acceptées. Aucune séance n'est écartée ni remplacée pour un autre motif ; une unité que l'analyse écarterait (`excludedUnits`) est rapportée sans être remplacée. La collecte s'arrête à la dixième séance acceptée, et le nombre d'échecs est un résultat du pilote (question 3). La clôture et l'exactitude temporelle d'une séance peuvent être contrôlées dès son enregistrement, pour surveiller l'instrument ; l'analyse de dimensionnalité n'est exécutée qu'une fois, sur les dix séances acceptées.
- **Cible de délivrance** : silicium. **Éthique** : sans objet (décision `PASS`).

## 3. Canaux, signaux, horloge / Channels, signals, clock

- **Canal somatosensoriel** : `servo-absolute-encoder`, `servo-motor-current` (effort, classe TENDON), `digit-optical-tactile`, `heated-contact-thermistor`, `stretch-gauge-0`, `stretch-gauge-1`.
- **Canal intéroceptif** : `actuator-thermistor`, `battery-fuel-gauge`, `board-thermistor`. Les deux listes sont disjointes : le courant moteur sert d'effort et jamais de consommation intéroceptive, et la charge provient d'une jauge distincte.
- **Variables intéroceptives** : `actuatorTempC`, `stateOfCharge`, `boardTempC`. La règle est fixée dès maintenant : chaque plage viable est la plage de fonctionnement assignée par le fabricant de la pièce, et chaque consigne est le milieu de sa plage de fonctionnement recommandée. Ces valeurs sont consignées dans les métadonnées de la session avant la première séance.
- **Horloge** : un domaine d'horloge unique, celui du microcontrôleur, et un horodatage matériel de la commande et du retour. Dans K0, le système éprouvé est ASTRA, non le contrôleur du robot, qui exécute ses mouvements-sondes en boucle ouverte. Les manipulations sont donc appliquées sur les horodatages matériels par `congruence.ts`, qui est l'implémentation de référence de la ligne à retard du micrologiciel.

## 4. Conditions / Conditions

Les niveaux sont calqués sur K1 (décision du 20 octobre 2026) :

| Condition | Famille | Niveau | Manipulation |
|---|---|---|---|
| `congruent` | base | 0 | aucune |
| `sm-delay-100` | sensorimotrice | 0,2 | délai de 100 ms |
| `sm-delay-200` | sensorimotrice | 0,4 | délai de 200 ms |
| `sm-delay-300` | sensorimotrice | 0,6 | délai de 300 ms |
| `sm-delay-500` | sensorimotrice | 1 | délai de 500 ms |
| `io-gain-1.5` | intéroceptive | 1/3 | gain ×1,5 autour de la consigne |
| `io-gain-2.5` | intéroceptive | 2/3 | gain ×2,5 autour de la consigne |
| `io-decouple` | intéroceptive | 1 | découplage par relecture mélangée |

Chaque séance comprend un bloc de calibration congruent (1 500 commandes) et un bloc d'essai de trois passages sur les huit sondes, dans un ordre tiré au hasard à chaque passage. Toutes les conditions sont appliquées au même bloc d'essai enregistré. Un délai intéroceptif pur n'est pas utilisé, car il est presque invisible pour un prédicteur homéostatique (`REVUE-SENSORS.md` §4).

## 5. Mesures / Measures

- **Sondes** : huit mouvements, soit quatre amplitudes (0,3, 0,6, 0,9 et 1,2 rad) sur deux objets (mousse et aluminium, à température ambiante). Chaque sonde est un appui progressif de 60 périodes de commande.
- **Réponse d'une sonde** : la concaténation des erreurs moyennes des **deux** canaux sur la sonde, soit l'erreur du comparateur somatosensoriel et les erreurs du prédicteur intéroceptif, cette dernière rattachée à la sonde en cours au moment de la délivrance. Chaque caractéristique est ensuite centrée-réduite sur les sondes, et les caractéristiques constantes sont écartées (`body-probes.ts`). Avec les seules erreurs somatosensorielles, l'absence d'effet intéroceptif serait garantie par construction.
- **Dissimilarité** : 1 − r de Pearson (Kriegeskorte, Mur & Bandettini 2008). **Dimensionnalité effective** : rapport de participation du spectre MDS classique (Torgerson 1952 ; Gao & Ganguli 2015).
- **Effet par unité** : pente des moindres carrés de la dimensionnalité sur le niveau, ligne de base incluse, et contraste de chaque niveau avec la ligne de base.
- **Contrôle de manipulation** : erreurs moyennes des deux canaux sur le bloc d'essai, après calibration puis gel des deux modèles.

## 6. Analyse / Analysis

Les paramètres sont ceux de K1, pour éprouver la même règle : α unilatéral de 0,05 avec des intervalles à 90 % ; SESOI de 0,25 ; critère de supériorité ; une absence n'est déclarée que si la pente **et** chaque niveau tombent dans ±SESOI (garde de monotonie) ; contrôles de manipulation et de spécificité. Les sorties sont rapportées telles quelles, sans résultat de retrait.

Commandes :

- simulation à blanc : `npm run kin:k0:dryrun` ;
- données réelles : `npm run kin:k0:observe -- empirical/protocols/FCS-K0.protocol.json <séances.json…> --out k0-observations.json`, puis `npm run kin:analyse -- empirical/protocols/FCS-K0.protocol.json k0-observations.json --sha256 1b5c9f3c7731bc6b922d587f38721139bdae9c098f5efdf1ea3a7f73eb0de997`.

## 7. Ce que K0 ne décide pas / What K0 does not decide

K0 ne dit rien de la thèse kinesthésique, de l'expérience ni d'un quelconque degré (interdictions 1 et 2). Une dimensionnalité y est une propriété des erreurs d'un instrument.

## 8. Dépôt / Filing

1. Sur OSF, créer un projet et y téléverser ce document, `protocols/FCS-K0.protocol.json` et l'archive du code source (`git archive` du commit courant, dont le nom porte l'identifiant du commit). Depuis l'onglet *Registrations* du projet, créer un enregistrement avec le modèle « OSF Preregistration » (Bowman et al. 2016). OSF réserve « Open-Ended Registration » aux études qu'aucun modèle structuré ne couvre, ce qui n'est pas le cas de K0. Le texte de chaque champ, en anglais et en français, est dans [`OSF-K0-FILING.md`](OSF-K0-FILING.md) ; il cite l'empreinte SHA-256.
2. Une fois l'enregistrement approuvé, consigner le dépôt avec le DOI et la date qu'affiche OSF : `node --import tsx scripts/kin.mjs file empirical/protocols/FCS-K0.protocol.json --reference <DOI> --filed-at <date>`. La commande renseigne `"status": "filed"` et `registry` dans le JSON, champs qui n'entrent pas dans l'empreinte ; elle remplace la ligne de statut ci-dessus par « DÉPOSÉ LE … / FILED ON … », vérifie que l'empreinte est inchangée et refuse d'écraser un dépôt déjà consigné.
3. Committer ces deux fichiers et pousser (commandes : `OSF-K0-FILING.md`, partie D).
4. Ne collecter les séances réelles qu'**après** le dépôt ; si OSF n'affiche que le jour de l'enregistrement, à partir du lendemain.

## Références / References (DOI vérifiés sur Crossref le 20 octobre 2026, sauf mention)

- Bowman, S. D., DeHaven, A. C., Errington, T. M., Hardwicke, T. E., Mellor, D. T., Nosek, B. A., & Soderberg, C. K. (2016). *OSF Prereg Template*. MetaArXiv. https://doi.org/10.31222/osf.io/epgjd (DOI vérifié le 21 octobre 2026 sur la notice RePEc/IDEAS et dans la documentation du paquet R `preregr`, Crossref n'étant pas joignable ce jour-là.)
- Gao, P., & Ganguli, S. (2015). On simplicity and complexity in the brave new world of large-scale neuroscience. *Current Opinion in Neurobiology*, 32, 148–155. https://doi.org/10.1016/j.conb.2015.04.003
- Kriegeskorte, N., Mur, M., & Bandettini, P. (2008). Representational similarity analysis – connecting the branches of systems neuroscience. *Frontiers in Systems Neuroscience*, 2, 4. https://doi.org/10.3389/neuro.06.004.2008
- Lambeta, M., et al. (2020). DIGIT: A novel design for a low-cost compact high-resolution tactile sensor with application to in-hand manipulation. *IEEE Robotics and Automation Letters*, 5(3), 3838–3845. https://doi.org/10.1109/LRA.2020.2977257
- Torgerson, W. S. (1952). Multidimensional scaling: I. Theory and method. *Psychometrika*, 17(4), 401–419. https://doi.org/10.1007/BF02288916
