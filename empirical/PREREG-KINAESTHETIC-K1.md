# Préenregistrement FCS-K1 : test de retrait de la thèse kinesthésique (participants humains)
# Preregistration FCS-K1 — Withdrawal test of the kinaesthetic thesis (human participants)

**Statut / Status : COMPLET SAUF TROIS ÉLÉMENTS EN ATTENTE, BROUILLON NON DÉPOSÉ / COMPLETE EXCEPT THREE PENDING ITEMS, UNFILED DRAFT.** <!-- prereg-check: ignore -->
Toutes les décisions de l'auteur sont arrêtées (20 octobre 2026, v3.3.0-rc.5). Restent trois valeurs qui attendent un événement extérieur, marquées dans le texte et comptées par `npm run prereg:check` : le laboratoire hôte, la référence d'approbation éthique, et l'effectif fixé par la règle du §8 à l'issue du pilote humain.
All the author's decisions are taken. Three values await an external event (host laboratory, ethics approval, sample size from the pilot rule). The protocol is frozen, hashed and filed only once all three are known.

- Protocole machine : [`protocols/FCS-K1.protocol.json`](protocols/FCS-K1.protocol.json). `minUnits` et `ethicsReference` y valent `null` jusqu'à ces événements.
- L'empreinte SHA-256 sera calculée au gel (`npm run kin:protocol -- empirical/protocols/FCS-K1.protocol.json --strict`) et citée lors du dépôt sur OSF Registries.

© Genève 2026 Christophe Jean Legros · Assistance Multi IA

---

## 0. Ordre des opérations / Order of operations

1. Laboratoire hôte, puis approbation éthique couvrant le pilote et l'étude.
2. Pilote humain de 10 participants, exclus de K1 (§8).
3. Effectif fixé par la règle du §8.
4. Renseignement de `minUnits` et `ethicsReference`, puis gel du protocole et calcul de l'empreinte.
5. Dépôt sur OSF Registries, en citant l'empreinte.
6. Collecte, toujours postérieure au dépôt.
7. Analyse, puis transmission du résultat à `fcs_withdrawal`.

## 1. Question et condition / Question and condition

La condition de retrait est celle du document II §4.2 (`src/engine/fcs/withdrawal.ts`) : *si les effets de dimensionnalité sous rupture de clôture (§6.3) apparaissent pour des manipulations de la congruence intéroceptive et non pour des manipulations de la congruence sensorimotrice, la première clôture est intéroceptive, et le niveau II est redéfini.*

La lecture préenregistrée tient en deux volets, combinés par intersection-union : chaque volet est testé au niveau α, et l'erreur de la conclusion conjointe reste au plus α (Berger 1982).

- **Effet intéroceptif** : par supériorité, la borne inférieure de l'intervalle à 90 % de la pente moyenne dépasse 0.
- **Absence d'effet sensorimoteur** : par équivalence (Lakens 2017), la pente **et** chaque contraste de niveau tombent dans ±SESOI.

*Two legs, intersection–union: interoceptive effect by superiority; sensorimotor absence by equivalence of the slope and of every level contrast within ±SESOI.*

## 2. Participants et site / Participants and site

- Adultes volontaires, sans trouble moteur de la main ni trouble cardiaque connu, après consentement éclairé. Ils peuvent se retirer à tout moment.
- Laboratoire hôte et dispositif : **EN ATTENTE** (laboratoire disposant d'un casque de réalité virtuelle, d'un suivi de main et d'un ECG synchronisés).
- Référence d'approbation éthique : **EN ATTENTE**. Tant qu'elle manque, `kin_protocol` renvoie `BLOCK` et aucune analyse confirmatoire n'est possible.
- Unité d'analyse : le participant (`subject`). Effectif : **EN ATTENTE**, fixé par la règle du §8.

## 3. Dispositif / Apparatus

- Casque de réalité virtuelle montrant une main virtuelle à la place de la main droite cachée. Le doigt du participant est suivi et anime le doigt virtuel, d'après la main mobile de Kalckert & Ehrsson (2012).
- Un ECG détecte les ondes R. La main virtuelle pulse vers le rouge à chaque battement, d'après le paradigme cardio-visuel de Suzuki et al. (2013).
- Une photodiode placée sur l'affichage vérifie le minutage réel de chaque délai et de chaque déphasage.
- Un domaine d'horloge unique : le suivi, l'ECG et la photodiode sont horodatés par la même acquisition. Les délais et les déphasages sont produits par le logiciel de stimulation et vérifiés par la photodiode.
- Canal somatosensoriel : `hand-motion-tracker`. Canal intéroceptif : `ecg`. La photodiode est un signal de vérification ; elle n'appartient à aucun canal.

## 4. Conditions et ordre / Conditions and order

| Condition | Famille | Niveau | Manipulation |
|---|---|---|---|
| `congruent` | base | 0 | délai de 0 ms ; pulsation synchrone |
| `sm-delay-100` | sensorimotrice | 0,2 | délai visuo-moteur de 100 ms ; pulsation synchrone |
| `sm-delay-200` | sensorimotrice | 0,4 | délai visuo-moteur de 200 ms |
| `sm-delay-300` | sensorimotrice | 0,6 | délai visuo-moteur de 300 ms |
| `sm-delay-500` | sensorimotrice | 1 | délai visuo-moteur de 500 ms, qui abolit propriété et agentivité selon Kalckert & Ehrsson (2012), et la propriété selon Kalckert & Ehrsson (2017) |
| `cv-phase-25` | intéroceptive | 1/3 | pulsation déphasée de 25 % de l'intervalle R-R ; délai visuo-moteur de 0 ms |
| `cv-phase-50` | intéroceptive | 2/3 | pulsation déphasée de 50 % de l'intervalle R-R |
| `cv-decoupled` | intéroceptive | 1 | pulsation au rythme enregistré d'une autre personne |

- **Deux blocs**, un par famille, dans un ordre contrebalancé entre participants : les numéros impairs commencent par le bloc sensorimoteur.
- **Dans chaque bloc**, les niveaux suivent un carré latin (5 × 5 pour le bloc sensorimoteur, 4 × 4 pour le bloc intéroceptif), et la condition congruente est mesurée une fois.
- **Les deux mesures congruentes sont regroupées** : leur moyenne sert de ligne de base aux deux familles.
- **Six configurations de mouvement par niveau** : deux doigts (index, majeur) × trois rythmes de tapotement (0,5 Hz, 1,5 Hz, irrégulier), d'environ 40 s chacune, dans un ordre tiré au hasard.

## 5. Mesures / Measures

- **Matrice de chaque niveau.** Après les six configurations, le participant juge de mémoire la similarité de l'expérience pour les 15 paires, sur une échelle visuelle analogique de 0 à 100, ramenée à [0, 1]. La dissimilarité vaut 1 − similarité (`rdmFromSimilarityJudgements`), conformément au document II §6.2. Le protocole déclare `dissimilarity: "judged-similarity"`.
- **Dimensionnalité effective** : rapport de participation du spectre MDS classique (Torgerson 1952 ; Gao & Ganguli 2015). La part non euclidienne est rapportée.
- **Effet par participant** : pente des moindres carrés de la dimensionnalité sur le niveau, ligne de base regroupée incluse, et contraste de chaque niveau avec la ligne de base.
- **Contrôle de manipulation.** Après chaque niveau, deux jugements de synchronie de 0 à 100 : « le mouvement de la main virtuelle suivait-il le vôtre ? » et « la pulsation suivait-elle votre cœur ? ». On en tire deux asynchronies, 1 − note/100 pour chacune : la première alimente `sensorimotorError`, la seconde `interoceptiveError`. Une famille passe le contrôle si la pente de l'asynchronie de son propre canal est positive (borne inférieure > 0) et dépasse celle de l'autre canal (contrôle de spécificité).

## 6. Analyse / Analysis

- α unilatéral de 0,05 (intervalles à 90 %) ; SESOI de 0,25 en rapport de participation par étendue complète du niveau, soit un quart de la séparation complète d'un axe ; critère de présence : supériorité.
- **Lecture d'une famille**, appliquée dans cet ordre :
  1. équivalence de la pente **et** de chaque contraste de niveau : effet « absent » ;
  2. borne inférieure de la pente au-dessus de 0 : « augmentation » ;
  3. borne supérieure sous 0 : « diminution », une anomalie imputée au rang 1 de l'ordre de révision ;
  4. sinon : « non concluant ».

  Une pente équivalente avec un niveau non équivalent se lit « non concluant » : c'est la garde de monotonie.
- **Motifs** :
  - intéroceptif seul : thèse retirée ;
  - sensorimoteur seul : thèse maintenue, et choix de la première clôture soutenu ;
  - les deux : thèse maintenue, sans départage ;
  - aucun : thèse maintenue, mais anomalie de la prédiction du §6.3, envoyée au rang 1.

  Un contrôle échoué, une famille non concluante ou une diminution rendent le motif « indéterminé ».
- **Exécution** : `npm run kin:analyse -- empirical/protocols/FCS-K1.protocol.json <observations.json> --sha256 <empreinte déposée>`, avec le code de la version citée ici.

## 7. Exclusions / Exclusions

Les exclusions sont techniques seulement (décision du 20 octobre 2026).

- **Un niveau est exclu** si la photodiode mesure un écart de plus d'une image d'affichage par rapport au délai ou au déphasage déclaré, ou si plus de 10 % des ondes R ne sont pas détectées pendant ce niveau.
- **Un participant sans ligne de base valide**, ou sans aucun niveau valide dans une famille, est exclu de cette famille : l'analyse l'écarte en le motivant.
- **Aucune exclusion selon les réponses du participant**, y compris l'absence d'illusion en condition congruente : ce serait conditionner sur l'effet de la clôture.

## 8. Pilote humain et règle d'effectif / Human pilot and sample-size rule

- **Pilote** : 10 participants, sous la même procédure ; leurs données sont exclues de K1. Le pilote estime deux écarts-types entre participants : σ̂ₚ, celui des pentes, et σ̂꜀, celui des contrastes par niveau. Pour chacun, on prend le maximum sur les familles et sur les niveaux.
- **Règle** (décision du 20 octobre 2026) : on calcule r = max(σ̂ₚ, σ̂꜀) / SESOI.
  - si r ≤ 1,5 : n = 40 ;
  - si r ≤ 2 : n = 60 ;
  - au-delà : pas de K1 sans révision consignée (`RevisionRecord`).
- **Justification** : la simulation de la règle de décision avec le code de l'analyse (20 octobre 2026 ; 3 000 tirages par case ; effet égal à la SESOI) donne, pour la pente, une puissance conjointe d'au moins 0,90 à n = 40 si σ/SESOI ≤ 1,5, et d'environ 0,90 à n = 60 si σ/SESOI ≤ 2. La garde par niveau abaisse peu la puissance de l'équivalence : à n = 40, elle reste de 0,98 lorsque l'écart-type par niveau égale la SESOI, contre 1,00 avec la pente seule.

## 9. Risques déclarés / Declared risks

1. **Contrôle de manipulation intéroceptif.** L'asynchronie cardio-visuelle est souvent mal perçue, et la précision intéroceptive se distingue de la conscience intéroceptive (Garfinkel et al. 2015). Si le contrôle échoue, le verdict est « indéterminé », ce qui est l'issue honnête dans ce cas.
2. **Réponse non monotone** : la garde la classe « non concluante » au lieu de conclure à une fausse absence.
3. **Main virtuelle.** Kalckert & Ehrsson utilisaient une main physique ; la généralisation à une main virtuelle est une hypothèse auxiliaire.
4. **Jugements de mémoire.** Ils introduisent un bruit que le pilote quantifie au travers de σ̂꜀.

## 10. Ce que K1 ne décide pas / What K1 does not decide

K1 départage deux clôtures d'une boucle. Il n'attribue d'expérience à aucun substrat et ne quantifie aucun degré (interdictions 1 et 2). La matrice est ici phénoménale au sens du document II §6.2, puisqu'elle provient de jugements de similarité ; la question C8 de `REVIEW.md`, qui porte sur la transposition à des réponses de substrat, ne s'y pose donc pas.

## 11. Dépôt / Filing

1. Renseigner les trois éléments en attente dans ce document et `minUnits` et `ethicsReference` dans le JSON. Vérifier que `npm run kin:protocol -- empirical/protocols/FCS-K1.protocol.json --strict` répond « ready to file: yes » et que `npm run prereg:check` ne compte plus de marqueur dans ce fichier.
2. Sur OSF Registries, utiliser le modèle « OSF Preregistration ». Joindre ce document et le JSON, et citer l'empreinte SHA-256.
3. Après le dépôt, renseigner `"status": "filed"` et `registry` (sans effet sur l'empreinte), remplacer la ligne de statut par « DÉPOSÉ LE <date> / FILED ON <date> », puis committer.

## Références / References (DOI vérifiés sur Crossref le 20 octobre 2026)

- Berger, R. L. (1982). Multiparameter hypothesis testing and acceptance sampling. *Technometrics*, 24(4), 295–300. https://doi.org/10.1080/00401706.1982.10487790
- Gao, P., & Ganguli, S. (2015). On simplicity and complexity in the brave new world of large-scale neuroscience. *Current Opinion in Neurobiology*, 32, 148–155. https://doi.org/10.1016/j.conb.2015.04.003
- Garfinkel, S. N., Seth, A. K., Barrett, A. B., Suzuki, K., & Critchley, H. D. (2015). Knowing your own heart: Distinguishing interoceptive accuracy from interoceptive awareness. *Biological Psychology*, 104, 65–74. https://doi.org/10.1016/j.biopsycho.2014.11.004
- Kalckert, A., & Ehrsson, H. H. (2012). Moving a rubber hand that feels like your own: A dissociation of ownership and agency. *Frontiers in Human Neuroscience*, 6, 40. https://doi.org/10.3389/fnhum.2012.00040
- Kalckert, A., & Ehrsson, H. H. (2017). The onset time of the ownership sensation in the moving rubber hand illusion. *Frontiers in Psychology*, 8, 344. https://doi.org/10.3389/fpsyg.2017.00344
- Kriegeskorte, N., Mur, M., & Bandettini, P. (2008). Representational similarity analysis – connecting the branches of systems neuroscience. *Frontiers in Systems Neuroscience*, 2, 4. https://doi.org/10.3389/neuro.06.004.2008
- Lakens, D. (2017). Equivalence tests: A practical primer for t tests, correlations, and meta-analyses. *Social Psychological and Personality Science*, 8(4), 355–362. https://doi.org/10.1177/1948550617697177
- Suzuki, K., Garfinkel, S. N., Critchley, H. D., & Seth, A. K. (2013). Multisensory integration across exteroceptive and interoceptive domains modulates self-experience in the rubber-hand illusion. *Neuropsychologia*, 51(13), 2909–2917. https://doi.org/10.1016/j.neuropsychologia.2013.08.014
- Torgerson, W. S. (1952). Multidimensional scaling: I. Theory and method. *Psychometrika*, 17(4), 401–419. https://doi.org/10.1007/BF02288916
