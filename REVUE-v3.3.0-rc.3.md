# ASTRA-FCS : analyse critique de la rc.3 et corrections rc.4

**19 octobre 2026 — revue technique et épistémologique avec assistance d’IA.**
Ce travail n’est pas une évaluation externe par les pairs, une certification de sécurité ou une validation empirique du FCS.

## 1. Objet effectivement examiné

L’archive fournie `ASTRA-FCS-v3.3.0-rc.3.zip` a été comparée au dépôt :
https://github.com/christophejlegros-lgtm/ASTRA-FCS-v3.3.0

Révision distante récupérée par Git : **4c9e0e6fee15a1e3f4afbfb1a8c13943ed972054**, datée du 19 octobre 2026. La comparaison des chemins et des octets des fichiers, hors métadonnées Git et dépendances locales, ne montre **aucune différence** entre le dépôt et l’archive. Le manifeste initial vérifie 452 fichiers, plus le manifeste lui-même.

Le lecteur web n’a pas réussi à récupérer ce dépôt ; la vérification repose donc sur le clone Git et la comparaison locale, pas sur un extrait de moteur de recherche. L’équivalence établie vaut pour ce commit précis, sans présumer de modifications ultérieures.

Les mentions historiques de deux lignées 3.3.0 ne prouvent aucune divergence de l’objet présent : le dépôt désigné contient la rc.3 fournie. L’ancienne variante `telos_*`, évoquée dans la revue précédente, n’a pas été réexaminée. Aucune fusion avec elle n’est effectuée.

## 2. Appréciation générale

**ASTRA-FCS est un prototype de recherche et d’évaluation conditionnelle dont plusieurs précautions sont solides, mais dont certaines sorties dépassaient encore ce que leurs entrées permettaient d’affirmer.**

Les acquis sont concrets : distinction entre objectifs et contraintes, traitement explicite des données manquantes, refus de compensation d’une contrainte violée, comparaison de Pareto sans classement total forcé, fichiers expérimentaux gelés et traçabilité des versions. La rc.3 corrige déjà des erreurs présentes dans la rc.1 ; ces corrections sont conservées.

Le risque principal réside dans une promotion injustifiée du statut de l’information : une valeur simulée devenait une mesure ; une propriété attribuée à un type de substrat pouvait être comprise comme l’observation d’un spécimen ; une validation lexicale pouvait être prise pour un jugement scientifique. Ces trois passages demandent des contrôles différents.

Les **415 tests initiaux réussissent**, alors que les contre-exemples ci-dessous sont reproductibles. Un test vert établit seulement la conformité aux propriétés testées. Le nombre de tests n’est ni une probabilité de vérité, ni une mesure de maturité scientifique.

## 3. Constats et corrections

| Réf. | Gravité ou nature | Constat rc.3 | Correction rc.4 |
|---|---|---|---|
| R1 | Majeur | ATP/ADP transmis à l’audit étiqueté `measured`, même lorsqu’il provient de la simulation | Origines `simulated` et `reported` distinctes ; aucune authentification instrumentale implicite |
| R2 | Majeur | `mode === 'live'` suffit à produire un champ MEA « observé » | Le mode d’interface ne constitue plus une preuve d’acquisition ; canal absent dans l’état synthétique |
| R3 | Majeur, logique | Aucun couple constitutif confirmé chez l’humain entraîne une note déclarant le porteur absent, malgré `carrierPresent: true` | L’inférence d’absence est réservée au profil silicium ; ignorance et absence séparées |
| R4 | Modéré | L’API pure accepte NaN, Infinity et valeurs biologiques hors domaine | Validation de finitude, signe et bornes pertinentes avant production du profil |
| R5 | Majeur, garde-fou | `structuredContent` n’est pas examiné | Analyse du contenu structuré et retrait de l’ensemble de la réponse en cas de signalement |
| R6 | Majeur, garde-fou | Une assertion reconnaissable peut être masquée par un échappement Unicode JSON | Décodage des chaînes JSON avant examen ; prise en charge des ressources textuelles embarquées |
| R7 | Renforcement méthodologique | La cardinalité est supposée à partir du nom de l’unité ; « points » peut recouvrir un rang ordinal | Déclaration explicite `scale: "cardinal"` requise pour l’utilité, sans prétendre la vérifier empiriquement |
| R8 | Modéré, reproductibilité | Rapport sans seuils, ancres, poids, contexte et horizon complets | Ajout de `contractSnapshot` aux évaluations et comparaisons |
| R9 | Mineur, numérique | Une somme de poids légèrement supérieure à 1 est acceptée par tolérance et peut donner U > 1 | Normalisation par la somme effective des poids et bornage numérique dans [0,1] |
| R10 | Modéré, interprétation | `realised` et `carrierPresent` décrivent un type théorique sans statut assez explicite dans la sortie | Ajout de `auditBasis: "substrate-type-model"` et `specimenVerified: false` |
| R11 | Modéré, citation | Badge CI, clonage et métadonnées renvoient à l’ancien dépôt | Liens actifs principaux réorientés vers le dépôt effectivement vérifié |
| R12 | Modéré, publication | Une date de publication est portée par un candidat qui n’a pas encore été publié | Champ `date-released` non renseigné pour la rc.4 locale ; historique conservé |

Les six premiers tests de régression reproduisent des défauts de comportement sur la rc.3. Deux autres formalisent les nouvelles exigences de déclaration et de traçabilité : leur échec initial ne signifie pas que ces champs faisaient déjà partie du contrat logiciel. Deux tests supplémentaires couvrent les ressources embarquées et le dépassement numérique de l’utilité. Les dix réussissent après correction.

## 4. Analyse épistémologique

### 4.1 L’accès est un objet de recherche, pas une propriété acquise par renommage

Block distingue l’expérience phénoménale et la disponibilité d’un contenu pour le raisonnement et le contrôle de la parole ou de l’action. Cela fournit un cadre de distinction ; cela ne suffit pas à reconnaître une conscience d’accès dans toute variable diffusée à plusieurs modules [1].

La dénomination *Research on Access* est recevable comme orientation de recherche. L’évaluation demande encore une correspondance opérationnelle entre la notion théorique et les capacités mesurées : quelles informations deviennent disponibles, pour quelles opérations, dans quelles conditions, avec quelles conséquences d’ablation ? Le commentaire qui identifiait directement le routage d’une quantité à la conscience d’accès de Block a été corrigé.

La formulation française « Agent Orchestré de Simulation et Test de Recherche sur l’Access » est conservée comme choix explicite de l’auteur. Dans le texte scientifique courant, « accès » est préférable ; le test mécanique des initiales ne valide ni la qualité linguistique ni la pertinence du concept.

### 4.2 Une classification du substrat n’est pas l’inspection d’un spécimen

L’audit associe des propriétés à `organoid-mea`, `silicon-snn` et `human-wearable`. Il ne vérifie pas, par ce seul choix d’étiquette, la présence d’un tissu, sa composition neurochimique ou une connexion instrumentale. Les verdicts historiques sont maintenus pour préserver la lecture du modèle, mais leur statut est maintenant exposé dans le résultat.

La correction ne prétend pas démontrer que tous les organoïdes réalisent la liste des fonctions codées. Cette généralisation demeure une hypothèse du registre, à discuter selon les préparations et les mesures. Le rapport doit être lu comme un profil de type, non comme un certificat de conformité biologique.

Le défaut humain révèle une erreur d’inférence plus générale : « aucune observation positive » ne signifie pas « observation négative ». Il faut conserver la différence entre absence du phénomène, absence du canal et absence de données exploitables.

### 4.3 Le garde-fou est une heuristique, pas une preuve sémantique

La spécification MCP distingue les blocs de contenu et les résultats structurés [2]. Examiner seulement un texte de réponse ne couvre pas toute la surface des résultats. La rc.4 traite maintenant les résultats structurés, les textes embarqués et les chaînes JSON décodées.

Cette amélioration ne rend pas le linter complet. Les paraphrases, citations, négations complexes et ambiguïtés linguistiques restent des sources de faux négatifs ou positifs. Les images et l’audio ne font l’objet d’aucune compréhension sémantique. Le contenu des prompts ne reçoit pas automatiquement le même examen. Le champ d’erreur a donc été reformulé : il rapporte un signalement par motifs, pas la preuve que la proposition est fausse ou inadmissible.

Le contrôle lexical de la phénoménalité est une règle interne de prudence. Il ne démontre pas une impossibilité métaphysique, ni l’impossibilité générale d’utiliser des observations de troisième personne pour discuter une hypothèse sur la conscience. Le commentaire attribuant une telle exclusion au « problème difficile » a été atténué.

### 4.4 Une utilité calculée est une valeur sous conventions

La normalisation affine et l’agrégation pondérée demandent une justification des échelles et des compromis. L’unité ne suffit pas : un « score » peut parfois avoir une justification métrique, tandis qu’un nombre en « points » peut n’être qu’un classement. La nouvelle déclaration rend cette responsabilité visible ; elle n’authentifie pas la cardinalité.

Le modèle reste conditionnel aux ancres, aux poids, aux bénéficiaires, à l’horizon et aux contraintes choisis. La normalisation numérique des poids ne résout aucun conflit de valeur. Le contrat complet est maintenant joint au rapport pour rendre ces choix auditables.

La comparaison de Pareto reste utile pour signaler des compromis sans les faire disparaître dans une moyenne. Cependant, l’absence de dominance ne prouve ni égalité, ni optimalité globale. Les intervalles sont ceux fournis par l’appelant ; ils ne deviennent pas des intervalles de confiance par leur mise en forme.

### 4.5 Fonction, finalité et preuve causale

L’analyse de Cummins porte sur la contribution d’une capacité à l’organisation d’un système [3]. Une fonction assignée peut être évaluée en termes de contribution ; cette analyse ne prouve pas pourquoi la fonction existe ni que la fin choisie est souhaitable.

Pour ASTRA, trois programmes doivent rester distincts : tester la fidélité d’un simulateur, identifier une contribution causale d’un composant, et justifier les finalités d’un usage. Une bonne erreur prédictive ne tranche pas automatiquement les deux autres questions. La réussite d’E1/E2, lorsqu’elle est rapportée selon leurs règles propres, ne valide donc ni le FCS entier ni la téléologie ajoutée.

## 5. Validation réellement effectuée

Environnement de cette revue : **Node.js v24.19.0**, dépendances disponibles localement réutilisées. Une installation propre `npm ci` et la matrice distante Node 20/22 n’ont pas été exécutées dans cette revue. Les relevés historiques sous d’autres environnements restent des documents antérieurs, non des résultats de cette exécution.

| Vérification | Avant : rc.3 | Après : rc.4 |
|---|---:|---:|
| Tests du projet | 415 réussis | 425 réussis |
| Tests ajoutés à la revue | 8 échecs initiaux sur les 8 premiers scénarios | 10 réussis sur 10 |
| Compilation TypeScript | Non réexécutée séparément avant correction | Réussie |
| ESLint sur `src/` | Non réexécuté séparément avant correction | Réussi |
| Identité et effectifs | Manifeste initial vérifié | Identité cohérente : 75 outils, 16 ressources, 10 prompts |
| Fichiers gelés E1/E2 | Conservés depuis la source | 12 empreintes conformes |
| Exemple téléologique | Ancien exemple conservé dans la source Git | Régénéré et vérifié contre le module compilé |

Commande de test employée :

```powershell
$env:ASTRA_LOG_LEVEL = 'silent'
$env:TSX_TSCONFIG_PATH = 'tsconfig.test.json'
node --import tsx --test tests/*.test.ts
```

Pour l’identité : `node --import tsx scripts/check-identity.mjs`. Le chargeur TypeScript a été utilisé directement ; cela évite le mécanisme IPC du lanceur CLI `tsx` qui avait posé problème dans cet environnement. Le script habituel `npm test` conserve sa place dans la CI et inclut le nouveau fichier de régression.

Aucune nouvelle acquisition biologique, expérience E3, réplication externe ou validation de bien-être n’a été menée. Les suites empiriques Python et le contrôle doré n’ont pas été relancés pour ces changements ; leurs fichiers gelés ne sont pas modifiés. Docker et l’exposition réseau en production n’ont pas été audités ici. Le manifeste et l’archive finale font l’objet d’une vérification d’intégrité séparée.

## 6. Migration et points encore ouverts

Pour calculer une utilité, ajouter `scale: "cardinal"` à chaque objectif concerné **uniquement si cette déclaration est défendable**. Sinon, omettre l’utilité et conserver l’analyse des seuils et de Pareto. Les anciens contrats sans utilité restent acceptés.

Les consommateurs FCS doivent accepter les nouvelles provenances `simulated` et `reported`. Les valeurs externes sont déclarées, pas certifiées. Aucune valeur transmise à cet audit n’obtient désormais automatiquement le statut `measured`. Les valeurs absentes restent `unavailable`.

Les profils de substrat doivent afficher leur statut de modèle et l’absence de spécimen vérifié. Les anciens rapports JSON doivent être archivés avec leur version ; les rapports rc.4 contiennent davantage d’informations, sans changement du nombre d’outils MCP.

Priorités restantes : validation des construits d’accès ; expériences d’ablation et témoins adéquats ; justification externe des échelles d’utilité ; raccordement instrumenté avec provenance vérifiable si un usage matériel est envisagé ; évaluation indépendante des hypothèses FCS. Le durcissement réseau, l’authentification et l’isolation des sessions nécessitent une revue propre avant une exposition à des utilisateurs non fiables.

La présente correction produit un **candidat local rc.4**. Aucun commit, tag, publication Zenodo ni push GitHub n’a été effectué. Le dépôt distant reste à la révision observée lors de sa récupération.

## 7. Références et pièces de contrôle

1. Block, Ned. 1995. « On a Confusion about a Function of Consciousness ». *Behavioral and Brain Sciences* 18 (2) : 227–247. [Page de l’éditeur](https://www.cambridge.org/core/journals/behavioral-and-brain-sciences/article/abs/on-a-confusion-about-a-function-of-consciousness/061422BF0C50C5FF00927F9B6E879413). DOI : 10.1017/S0140525X00038188. La date de mise en ligne de la page ne doit pas être confondue avec l’année du volume.
2. Model Context Protocol. 2025. « Tools », spécification du 18 juin, sections *Tool Result* et *Structured Content*. https://modelcontextprotocol.io/specification/2025-06-18/server/tools. Source officielle pour la distinction des formats, pas certification de conformité du serveur.
3. Cummins, Robert. 1975. « Functional Analysis ». *The Journal of Philosophy* 72 (20) : 741–765. [Texte original](https://mechanism.ucsd.edu/bill/teaching/w10/cummins.functions.1975.pdf).
4. ASTRA-FCS, source examinée : https://github.com/christophejlegros-lgtm/ASTRA-FCS-v3.3.0/tree/4c9e0e6fee15a1e3f4afbfb1a8c13943ed972054.

Pièces livrées : `tests/audit-rc4.test.ts`, `validation/RC4-VALIDATION.json`, `validation/rc4-tests.txt`, `validation/rc4-regressions-before.txt`, `validation/rc3-baseline.txt` et `MANIFEST.sha256`. Les précédents journaux de validation conservent leur version d’origine ; ils ne constituent pas le relevé courant de la rc.4.
