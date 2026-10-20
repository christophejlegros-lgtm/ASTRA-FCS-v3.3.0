# ASTRA : téléologie fonctionnelle du résultat et utilité sous contraintes

**Proposition philosophique et extension logicielle — v3.3.0-rc.2 — 19 octobre 2026**

> **Révision rc.2.** Cette version corrige la rc.1 sur cinq points, détaillés dans
> [`REVUE-v3.3.0-rc.1.md`](REVUE-v3.3.0-rc.1.md) : la lecture de Cummins (§2), le rendu des
> formules (§3, §6), l'application effective par le code de trois règles que le texte se
> bornait à énoncer (§5, §6, §10), la qualification de l'enveloppe d'utilité (§6) et
> l'appareil bibliographique (§11).

Statut : préversion locale, développée à partir de l’archive ASTRA-FCS-v3.2.0. Ce texte propose une orientation d’ASTRA ; il ne présente pas une théorie de la conscience empiriquement confirmée. Les expériences historiques E1/E2 restent distinctes de cette extension.

## 1. Thèse centrale

**Une fonction d’ASTRA se justifie par sa contribution évaluée à une fin explicitement déclarée, pour des bénéficiaires identifiés, dans un contexte déterminé et sous des contraintes qui limitent les moyens admissibles.**

Le but rend la fonction intelligible ; le résultat permet d’en éprouver la réalisation ; l’utilité exprime une appréciation normative de ce résultat. Ces relations ne sont pas des identités. Un résultat peut correspondre au but par hasard ; une fonction peut échouer malgré une conception pertinente ; une performance utile à un groupe peut nuire à un autre.

La question directrice devient : « À quoi cette fonction sert-elle, pour qui, selon quelle preuve et à quel coût ? » La réponse doit rester révisable. Une fonction sans contribution démontrée peut demeurer une hypothèse de conception ; elle ne reçoit pas automatiquement une justification parce qu’elle existe dans le code.

Cette téléologie est **attribuée et instrumentale** : les concepteurs déclarent les fins, les utilisateurs les discutent, le logiciel calcule des évaluations conditionnelles. Elle n’implique aucune intention intérieure du système. Le futur ne cause pas rétroactivement le présent : une représentation actuelle d’un objectif peut guider une action actuelle, dont les conséquences seront ensuite confrontées à cet objectif.

## 2. Fondements philosophiques et position critique

Rosenblueth, Wiener et Bigelow (1943) proposent une analyse du comportement orienté vers un but et de la rétroaction. Nous en retenons l’idée d’une correction guidée par l’écart à une référence. Notre extension calcule des écarts de conformité ; elle n’implémente pas elle-même une boucle de commande.

Cummins (1975) analyse une fonction par la contribution d’une capacité à celle d’un système organisé. Cette approche invite à décomposer ASTRA : mesurer, modéliser, comparer et rendre compte doivent avoir des contributions identifiables. Une utilité déclarée ne remplace cependant pas l’explication causale de ces contributions.

Il faut toutefois mesurer ce que l’on emprunte à Cummins. Son analyse fonctionnelle a été proposée en rupture avec la lecture reçue (Hempel, Nagel), selon laquelle attribuer une fonction à un élément servirait à expliquer sa présence. Elle répond à la question « comment le système exerce-t-il cette capacité ? », non à la question « à quoi sert ce composant ? ». Elle est **relative à la capacité que l’analyste choisit d’expliquer**, et Cummins rejette expressément l’idée que la fonction d’un élément explique sa présence ; c’est pourquoi on la classe parmi les conceptions systémiques, non téléologiques, de la fonction. La conception étiologique, celle de Wright (1973), fait au contraire de la fonction l’effet en raison duquel le composant est là. La « fonction assignée » de cette extension ne relève ni de l’une ni de l’autre. C’est une **fonction de conception, attribuée** : la contribution qu’un responsable déclare attendre d’un composant au regard d’une capacité qu’il a choisie. L’analyse de Cummins sert à l’**évaluer** (le composant contribue-t-il, et comment ?), non à la fonder. La téléologie reste donc attribuée de part en part ; aucune finalité n’est lue dans le mécanisme.

La proposition articule ainsi trois questions différentes : quelle fin est poursuivie, comment le système peut la réaliser, et pourquoi cette fin mérite d’être poursuivie. Rosenblueth, Wiener et Bigelow éclairent la forme de la première (une référence, un écart, une correction) sans dire quelle fin choisir ; Cummins éclaire la deuxième. Ni l’un ni l’autre ne fournit une morale permettant de répondre à la troisième.

| Notion | Définition adoptée pour ASTRA | Erreur à éviter |
|---|---|---|
| But | État souhaité déclaré avant l’évaluation | Redéfinir la réussite après avoir vu les résultats |
| Fonction assignée | Contribution attendue d’un composant au regard d’une capacité déclarée (fonction de conception, attribuée) | Confondre description de conception et contribution prouvée ; expliquer la présence d’un composant par sa fonction |
| Mécanisme | Organisation causale produisant une capacité | Déduire le mécanisme d’une bonne performance |
| Résultat | Valeurs rapportées avec contexte, horizon et provenance | Confondre prévision, simulation et observation |
| Efficacité | Atteinte des critères du but | En déduire automatiquement l’efficience ou la légitimité |
| Efficience | Rapport entre résultat et ressources engagées | Oublier les coûts déplacés vers d’autres acteurs |
| Utilité | Valeur attribuée au résultat selon un modèle explicite | Traiter une préférence conventionnelle comme une mesure naturelle |
| Admissibilité | Respect des contraintes déclarées | Compenser une interdiction par une meilleure moyenne |

« Fonction utilitaire » ne signifie donc pas nécessairement « utilitarisme moral ». Une fonction peut être utile sans que la somme de ses avantages justifie tous ses moyens. Le choix présent est un pluralisme sous contraintes : on distingue les bénéfices, on rend les arbitrages visibles et on peut refuser certaines compensations.

## 3. Articulation avec le fonctionnalisme contraint par le substrat

Le FCS demande quelles propriétés du support permettent ou limitent une fonction. La téléologie demande pour quelles fins cette fonction est retenue et comment sa réussite sera jugée. Les deux axes se complètent sans se démontrer mutuellement.

On peut représenter un programme d’étude par :

> **R = F(S, A, E, I)**  et  **V = U(R | B, H, N)**

où S désigne le substrat, A l’architecture, E l’environnement, I l’intervention, R le résultat, B les bénéficiaires, H l’horizon temporel et N les conventions normatives. F est ici une relation de recherche à identifier, pas une équation empirique déjà estimée. U est un modèle de valeur déclaré.

Deux substrats peuvent produire une performance similaire tout en différant par leur consommation, leur robustesse, leur stabilité temporelle ou leurs exigences de maintenance. Ces différences peuvent modifier leur utilité. Elles n’établissent pas, à elles seules, une différence d’expérience subjective.

Pour soutenir une thèse substantielle du FCS, il faut identifier une propriété du substrat, intervenir sur elle, contrôler les facteurs concurrents et prévoir un résultat discriminant. Ajouter le mot « téléologique » à une performance ne satisfait aucune de ces exigences.

## 4. Le contrat de finalité

L’extension introduit un contrat partagé par les évaluations :

- **Responsabilité** : identifiant et responsable du contrat (`id`, `owner`).
- **Finalité et fonction** : objectif général et contribution assignée (`purpose`, `function`).
- **Périmètre** : contexte d’évaluation et horizon (`context`, `horizon`).
- **Critères** : description, bénéficiaire, unité, direction et seuil pour chaque résultat recherché.
- **Contraintes** : limites prioritaires, exprimées avec les mêmes champs.
- **Valeur facultative** : ancres, poids et justification du modèle d’utilité.

Le responsable devrait dater et figer le contrat avant d’examiner les données. Cette version ne fournit ni horodatage opposable, ni stockage des contrats, ni approbation des parties prenantes. Un identifiant n’est pas une preuve de préenregistrement.

Les coûts peuvent apparaître comme objectifs à minimiser ou comme contraintes. Les effets sur des bénéficiaires différents doivent rester des critères distincts lorsque leur compensation serait contestable. Une dimension omise n’est ni nulle, ni négligeable : elle est hors du calcul.

## 5. Sémantique des résultats et de l’incertitude

Un résultat porte un statut `observed`, `simulated` ou `predicted`, une source, un contexte, un horizon et des intervalles pour les critères renseignés. Ces informations sont **déclarées par l’appelant**. Le serveur ne consulte pas la source et ne certifie pas qu’une observation a eu lieu.

Les bornes ne sont pas automatiquement des intervalles de confiance. Elles peuvent représenter une plage de sensibilité, une incertitude instrumentale ou une enveloppe de simulation. Leur interprétation doit être décrite dans le protocole externe. Une valeur ponctuelle s’écrit avec deux bornes égales ; elle n’affirme pas l’absence d’incertitude réelle.

Pour une quantité à minimiser avec seuil t et intervalle [l,h] :

- `pass` si h ≤ t ;
- `fail` si l > t ;
- `unknown` dans les autres cas, y compris une donnée absente.

Pour une quantité à maximiser : `pass` si l ≥ t ; `fail` si h < t ; `unknown` sinon. L’égalité au seuil est acceptée. Les cibles centrales se représentent par deux critères, limite inférieure et limite supérieure, avec des identifiants distincts ; aucun mode de cible implicite n’est ajouté.

L’admissibilité vaut `rejected` dès qu’une contrainte échoue ; sinon `undetermined` si l’une reste inconnue ; sinon `admissible`. Sans contrainte, le résultat est admissible **au sens du contrat vide**, ce qui ne certifie aucune sécurité générale. Depuis la rc.2, le rapport le dit : il porte `admissibilityBasis` (`declared-constraints` ou `empty-contract`) et le nombre de contraintes déclarées, et son interprétation le rappelle lorsque l’ensemble est vide.

Aucun critère ni aucune contrainte ne peut porter sur la conscience, la sentience ou la phénoménalité. Un identifiant, une description ou une unité qui les nomme fait refuser le contrat, conformément aux interdictions 1 et 2 du programme FCS. Le rapport reprend en outre la finalité, la fonction et le responsable du contrat. Le garde-fou d’énonciation du serveur les examine donc comme toute autre sortie : une finalité rédigée comme « montrer qu’ASTRA est conscient » est bloquée (`LINT_FAILED`). L’atteinte des buts est calculée séparément : `met`, `not_met`, `undetermined`. Un but atteint sous contrainte violée reste inadmissible.

## 6. Utilité : convention explicite et limitée

Le module propose un modèle additif facultatif, destiné à des évaluations instrumentales dont les compromis sont justifiés :

> **uᵢ(x) = min(1, max(0, (x − wᵢ) / (bᵢ − wᵢ)))**  et  **U(x) = Σᵢ αᵢ · uᵢ(xᵢ)**, avec αᵢ > 0 et Σᵢ αᵢ = 1.

w et b sont les ancres « pire » et « meilleure » pour le critère ; elles doivent respecter sa direction. Les poids décrivent la valeur d’un déplacement entre les ancres : ils ne doivent pas être interprétés comme de simples votes d’importance indépendants des échelles. Les saturations à 0 et 1 sont des conventions, à contrôler par analyse de sensibilité.

La validité d’un tel modèle suppose notamment que les compromis entre dimensions puissent être représentés par une forme additive. Le champ `rationale` rend la justification obligatoire, mais le logiciel ne prouve ni cette hypothèse ni la comparabilité interpersonnelle des valeurs. Il ne faut pas introduire les rangs ordinaux FCS dans cette formule comme s’ils étaient des grandeurs cardinales. Depuis la rc.2, le module l’interdit : un critère dont l’unité nomme une position ordinale (rang, strate, niveau, classe, degré, score, indice…) peut porter un seuil et entrer dans la comparaison de Pareto, mais un terme d’utilité qui le vise fait refuser le contrat. Le test d’unité est celui de l’interdiction 4 (`isOrdinalUnit`, exporté de `negative-heuristic.ts`).

Pour des intervalles, le module fournit une borne inférieure et une borne supérieure de valeur. U étant additive et monotone par terme, ces bornes sont **exactes** sur le pavé formé par les intervalles déclarés : elles sont atteintes en un de ses sommets. Elles ne deviennent conservatrices que si l’on dispose d’une information conjointe, une dépendance entre dimensions, que le pavé ignore. Ce n’est pas une espérance probabiliste. Aucun calcul de probabilité ou d’aversion au risque n’est implémenté.

L’utilité est absente si une contrainte est violée ou inconnue, ou si un objectif manque. Un objectif manqué peut néanmoins recevoir une valeur partielle : la valeur et l’atteinte du seuil restent deux informations différentes. Les valeurs sont toujours étiquetées `conditional: true`.

## 7. Comparer sans imposer artificiellement un gagnant

Les alternatives partagent le même contrat, le même contexte, le même horizon et la même catégorie de provenance. La comparaison refuse de mélanger observation et simulation. Ce contrôle d’étiquettes ne prouve toutefois pas que les protocoles ou populations sont réellement comparables.

La dominance de Pareto est robuste aux intervalles fournis : A domine B si le cas le moins favorable de A n’est inférieur au cas le plus favorable de B pour aucun objectif, et lui est strictement supérieur pour au moins un. La direction de préférence est inversée pour une quantité à minimiser.

Les alternatives inadmissibles ou incomplètes sont exclues de cette comparaison, mais conservées dans le rapport. Les résultats non dominés constituent un ensemble de candidats : ce ne sont pas des optima démontrés. Un recouvrement d’intervalles peut empêcher de conclure ; une égalité ne crée aucune dominance. La valeur additive est affichée séparément et ne force aucun classement total.

## 8. Exemple reproductible

Le dossier `examples/teleology/` contient un contrat et trois alternatives **synthétiques**. Leur fonction assignée consiste à prédire des événements sur un banc d’essai, en limitant l’erreur et la consommation.

| Alternative | Erreur | Énergie | Lecture attendue |
|---|---:|---:|---|
| sobre | 0,10–0,15 | 4–5 J | Objectif atteint, contrainte satisfaite |
| imprecise | 0,30–0,35 | 4–5 J | Objectif manqué, contrainte satisfaite |
| excessive | 0,01–0,02 | 12–13 J | Meilleure précision, mais contrainte violée |

Le seuil d’erreur est 0,20 ; le plafond énergétique est 10 J. La première alternative domine la deuxième sur l’objectif déclaré. La troisième est exclue malgré sa précision. Le rapport `comparison-output.json` est calculé par le module compilé à partir de `comparison-input.json` ; les chiffres ne sont pas issus d’une expérience biologique.

Après `npm ci` et `npm run build`, le script suivant régénère le rapport :

```powershell
node examples/teleology/replay.mjs
```

Avec `--check`, le script vérifie sans rien écrire que le rapport enregistré est celui que le module calcule ; la CI l’exécute, et un test compare le rapport au calcul.

L’API TypeScript exporte `assess(input)` et `compare(input)` depuis `src/engine/teleology/index.ts`. Les trois outils MCP sont `teleology_framework`, `teleology_assess` et `teleology_compare`. Ils sont en lecture seule et passent par le garde-fou global des assertions. Ils ne transmettent aucune commande à un dispositif. Le serveur expose désormais 75 outils, 16 ressources et 10 prompts.

Les critères portent des identifiants uniques ; leurs unités doivent correspondre exactement, sans conversion automatique. Les nombres doivent être finis et compris entre −10¹² et 10¹² ; cette borne est une limite de calcul, pas une loi physique. Les champs inconnus sont refusés par les schémas du moteur. Aucun résultat n’est inféré d’une liste vide d’observations.

## 9. Programme empirique pour tester cette philosophie

1. **Analyse conceptuelle et délibération** : séparer finalités, fonctions, bénéficiaires et contraintes ; recueillir les désaccords sur les compensations. Livrable : contrat motivé et versionné.
2. **Validation de mesure** : éprouver fidélité, sensibilité, invariances et domaine de validité des indicateurs. Livrable : cartes de mesure et cas où l’indicateur échoue.
3. **Comparaison expérimentale** : comparer une fonction active, une ablation et un témoin pertinent sur des données retenues à l’avance. Fixer l’unité expérimentale, les exclusions et le plan d’analyse avant acquisition.
4. **Identification causale** : contrôler les différences de substrat, d’architecture et de ressources. Une amélioration prédictive seule ne démontre pas une contribution constitutive.
5. **Robustesse et sensibilité** : varier contextes, horizons, ancres, poids et modèles d’incertitude. Publier les inversions de préférence, plutôt que retenir seulement le réglage favorable.
6. **Évaluation des conséquences** : documenter bénéfices, coûts, effets différés et distribution entre groupes ; employer des observations qualitatives lorsque la réduction à un score serait abusive.
7. **Révision contradictoire** : soumettre contrats et résultats à une équipe indépendante. Définir à l’avance ce qui conduirait à abandonner la fonction, son indicateur ou sa justification.

Ces méthodes ne sont pas toutes implémentées. Le module fournit un instrument de décision conditionnelle ; les plans expérimentaux, études qualitatives, analyses causales et réplications restent à mener. Leur coexistence évite qu’un seul indicateur tienne lieu de preuve universelle.

## 10. Objections et corrections nécessaires

**« Tout système matériel a des contraintes ; la thèse est triviale. »** L’objection est fondée tant que le FCS ne spécifie aucune dépendance discriminante. Il faut annoncer quelles modifications du support doivent modifier quelle capacité, à architecture ou ressources contrôlées autant que possible.

**« Un bon résultat justifie le moyen. »** L’implémentation rejette cette implication : les contraintes précèdent la valeur. Mais ce sont les humains qui doivent définir des contraintes pertinentes ; leur validation numérique ne remplace pas une justification éthique.

**« Maximiser l’indicateur maximise la finalité. »** Cette relation doit être éprouvée hors des données ayant servi à choisir l’indicateur. On recherche notamment des cas où celui-ci augmente pendant que le résultat souhaité se dégrade. Le module n’empêche pas la manipulation des entrées.

**« Une fonction orientée vers un but prouve une intention vécue. »** La direction fonctionnelle du comportement ne suffit pas à établir cette conclusion. L’extension n’emploie ni l’utilité ni l’atteinte des buts comme mesure de phénoménalité. Depuis la rc.2, ce n’est plus une déclaration seulement : un contrat dont un critère porte sur la conscience est refusé, et une finalité qui l’affirmerait est bloquée par le garde-fou (§5).

**« Un score commun résout les conflits de valeur. »** Il encode un arbitrage, sans le justifier. En cas de désaccord sur les ancres ou poids, conserver plusieurs modèles et rendre les décisions sensibles aux conventions explicites.

**« Le logiciel valide la philosophie. »** Les tests vérifient des règles de calcul et leur intégration. La recevabilité du cadre dépend aussi d’arguments conceptuels, de la qualité des mesures et de confrontations empiriques distinctes.

## 11. Références primaires et statut de la proposition

- Rosenblueth, A., Wiener, N. et Bigelow, J. (1943). « Behavior, Purpose and Teleology ». *Philosophy of Science*, 10(1), 18–24. DOI : https://doi.org/10.1086/286788 *(DOI relevé sur une copie archivée, non sur une page d’éditeur, le 19 octobre 2026)*.
- Cummins, R. (1975). « Functional Analysis ». *The Journal of Philosophy*, 72(20), 741–764 (pagination de la notice PhilPapers, https://philpapers.org/rec/CUMFA ; d’autres notices donnent 741–765). *Aucun DOI n’a pu être vérifié ; aucun n’est donc indiqué.* Le lien de la rc.1 renvoyait à une copie hébergée sur une page de cours ; il est remplacé par la notice bibliographique.
- Wright, L. (1973). « Functions ». *The Philosophical Review*, 82(2), 139–168. *(Notice PhilPapers ; DOI non vérifié, donc non indiqué.)* Ajouté en rc.2 pour la conception étiologique que la fonction assignée n’adopte pas (§2).

Le contrat, les règles d’admissibilité, le modèle d’utilité et la comparaison par intervalles sont des choix de cette extension ; leur détail ne doit pas être attribué aux deux auteurs cités. Le noyau proposé est une **téléologie fonctionnelle sous contraintes de substrat et de valeur**, ouverte à la réfutation de ses hypothèses et à la révision de ses fins.


## Addendum rc.4 — migration et limites de la validation

L'utilité additive exige désormais `scale: "cardinal"` pour chaque objectif concerné.
Les valeurs `ordinal` et `unspecified`, ainsi que l'absence de déclaration, restent
acceptées pour les seuils et Pareto, mais interdisent l'utilité. La déclaration ne
constitue pas une preuve de cardinalité ; elle doit être défendue dans `utility.rationale`.
Le contrôle lexical des unités demeure une précaution imparfaite, susceptible de faux
positifs et de contournements. Une unité nommée « points » ne prouve aucune propriété métrique.
Les poids dont la somme est acceptée à 10⁻⁹ près sont normalisés par leur somme effective.
Les bornes de valeur restent dans [0,1].

Chaque rapport contient `contractSnapshot` : contexte, horizon, seuils, bénéficiaires,
ancres et poids utilisés. Ce relevé permet la relecture ; ce n'est ni une signature,
ni une authentification des données, ni une preuve d'antériorité.

Les données du magasin de simulation FCS portent `simulated` ; les nombres transmis
par l'appelant portent `reported`. Le mode `live` n'active aucune preuve d'acquisition.
`auditBasis: "substrate-type-model"` indique que les verdicts concernent la classification
théorique du type de substrat. `specimenVerified: false` interdit de les présenter comme
l'inspection d'un organoïde connecté. Le changement de nom vers Access ne démontre
pas davantage une conscience d'accès : il exprime un objet de recherche.
