# Pré-enregistrement E3 — Un générateur hiérarchique d'activité spontanée face à des organoïdes jamais vus, stratifiés
# Preregistration E3 — A hierarchical spontaneous-activity generator against unseen, stratified organoids

**Statut / Status : BROUILLON NON DÉPOSÉ / UNFILED DRAFT** — préparé le 9 octobre 2026 (v3.2.0)
au titre du point 2 du programme minimal de consolidation de l'analyse épistémologique du
même jour. À compléter par l'auteur, puis à déposer sur un registre horodaté (OSF
Registries, Zenodo ou équivalent) **avant tout accès aux données de test**. Tant que cette
ligne de statut porte « BROUILLON NON DÉPOSÉ », `empirical/e3_analysis.py run` refuse toute
analyse confirmatoire.
To be completed by the author, then filed on a time-stamped registry **before any access
to the test data**. While this status line reads "UNFILED DRAFT", `e3_analysis.py run`
refuses any confirmatory analysis.

Marqueurs : **À FIXER** = décision de l'auteur, non prise ; **PROPOSITION** = convention <!-- prereg-check: ignore -->
d'analyse proposée, à valider ou remplacer avant dépôt. `npm run prereg:check` les compte
et refuse le dépôt tant qu'il en reste. Aucune valeur expérimentale n'est inventée ici.
Markers: **À FIXER** (TO BE SET) = the author's decision, not yet taken; **PROPOSITION** = <!-- prereg-check: ignore -->
an analysis convention proposed for validation or replacement before filing.

© Genève 2026 Christophe Jean Legros · Assistance Multi IA

---

## 0. Ce qui change par rapport à E1 et E2 / What changes from E1 and E2

| | E1 (23·09·2026) | E2 (28·09·2026) | E3 (brouillon) |
|---|---|---|---|
| Unité d'analyse | médiane sur 3 organoïdes | médiane des médianes sur 5 organoïdes | **l'organoïde**, une erreur par organoïde |
| Variabilité modélisée | graines seulement | graines seulement | **entre organoïdes** (deux niveaux) + graines |
| Résultat primaire | verdict catégoriel | verdict catégoriel | **erreurs prédictives, calibration, CRPS avec incertitude** |
| Témoins | — | modèle d'E1 | **témoin de complexité égale** (mêmes 9 paramètres, sans synchronisation partagée) + modèle regroupé + modèle d'E1 |
| Stratification | aucune | aucune (âge découvert après coup) | **âge et préparation**, lus sur les métadonnées avant tout spike |
| Origine des données de test | DANDI 001603 | DANDI 001603 | **données jamais utilisées**, idéalement d'un autre laboratoire |

## 1. Question

Un générateur phénoménologique d'activité spontanée, de la famille « bouffées de réseau »
d'E2, dont les paramètres sont tirés **par organoïde** dans une population estimée sur des
organoïdes d'entraînement, prédit-il — avec une incertitude **calibrée** — les statistiques
S1–S5 d'organoïdes humains **jamais vus**, mieux qu'un témoin de complexité égale privé de
synchronisation partagée et qu'un modèle regroupé à paramètres uniques ?

Does a phenomenological spontaneous-activity generator of E2's network-burst family, whose
parameters are drawn **per organoid** from a population estimated on training organoids,
predict — with **calibrated** uncertainty — the S1–S5 statistics of **unseen** human
organoids better than a complexity-matched control without shared timing, and better than a
pooled single-parameter model?

**Hors portée / Out of scope :** activité évoquée ; mécanismes (le modèle n'a ni synapses ni
topologie — interdiction 3 : un succès d'ajustement n'établit pas un mécanisme) ; proxys de
conscience ; hypothèses FCS de niveau I.

## 2. Données / Data

| Élément | Décision |
|---|---|
| Jeu de données de test | **À FIXER** — non utilisé dans E1/E2 ; idéalement d'un autre laboratoire. Les organoïdes HO1–HO8 de DANDI 001603 sont exclus comme données de test (`e3_analysis.py run` les refuse). |
| Critères d'éligibilité | Organoïdes cérébraux humains ; activité spontanée ; table d'unités triées ou temps de spikes par électrode ; âge et protocole de préparation disponibles dans les métadonnées. **À FIXER** : critères supplémentaires. |
| Règle de sélection | Appliquée **sur les seules métadonnées** (listing public, puis `python3 -I empirical/e3_analysis.py inspect fichiers…`, qui n'ouvre aucune table de spikes). **À FIXER** : règle exacte. |
| Données d'entraînement | **À FIXER** — peuvent inclure HO1–HO8 (déjà vus, admissibles à l'entraînement seulement) et d'autres organoïdes ; jamais un organoïde de test. |
| Partition | Par **organoïde** : plusieurs sessions d'un même organoïde restent du même côté. **À FIXER** : règle de partition. |
| Strates | Âge (métadonnée) × préparation (protocole). **À FIXER** : définition des classes d'âge et de préparation. |
| Effectifs minimaux | **PROPOSITION** : ≥ 6 organoïdes d'entraînement et ≥ 6 de test par strate (effectifs de la validation synthétique, §6) ; une strate en deçà est déclarée non estimable, sans fusion a posteriori. |
| Fenêtre | T = min(durée, 600 s), durée déterminée comme dans E1 (`obs_intervals`, sinon premier → dernier spike). |
| Exclusions | Fichier sans table d'unités exploitable (règle d'E1). **À FIXER** : toute autre exclusion. |

## 3. Modèles / Models

Tous ajustés **sur l'entraînement seulement**, **par strate**, avec le code gelé au dépôt
(`empirical/e3_analysis.py`, `empirical/confront.py`, `empirical/e2_calibrate.py`).

| Code | Modèle | Paramètres | Rôle |
|---|---|---|---|
| M2 | Bouffées de réseau **hiérarchique, sans mise en commun** : postérieur ABC par organoïde (banque de simulations à la durée de l'organoïde, ajustement par régression locale de Beaumont et al. 2002), population = mélange équipondéré des postérieurs par organoïde | 9 par organoïde | **principal** |
| M1 | Bouffées de réseau **regroupé** : un seul vecteur ajusté aux statistiques moyennes (à la manière d'E2) ; seules les graines varient | 9 | témoin : ignore la variabilité entre organoïdes |
| C1 | **Témoin de complexité égale** : mêmes 9 paramètres et mêmes marges par électrode, débuts de bouffées tirés indépendamment par électrode | 9 par organoïde | témoin : isole la synchronisation partagée |
| M0 | Modèle d'E1 (`'poisson'`, configuration par défaut) | — | plancher de référence |
| M1-E2 | Paramètres gelés d'E2 (`E2_CALIBRATED_PARAMS`), sans réajustement | — | continuité avec E2 |

Conventions d'ajustement — **PROPOSITION** : une banque de 2 000 tirages uniformes dans la
boîte d'E2 (`BOX_LO`, `BOX_HI` de `e3_analysis.py`) **par durée d'enregistrement**
(regroupée à 10 s), chaque organoïde d'entraînement étant confronté à la banque de sa durée ;
k = 25 plus proches voisins ; 100 tirages prédictifs par modèle et par durée ; graine
globale 20261009 ; statistiques transformées par g = (log S1, log S2, log(S3 + 0,1),
log(S4 + 0,01), S5). M0 et M1-E2 sont simulés par le code TypeScript gelé
(`sim_export.ts`). Variante à considérer : population paramétrique avec mise en commun
partielle (**À FIXER** : retenir ou non). L'analyse est conduite **strate par strate**
(`e3_analysis.py run --strata age,preparation`) ; une strate sous les effectifs minimaux est
déclarée non estimable, sans fusion.

## 4. Résultats primaires pré-déclarés / Pre-declared primary outcomes

Pour chaque organoïde de test j et chaque statistique k, une distribution prédictive
(tirages du modèle à la durée de j) et une observation y_jk.

1. **Erreurs prédictives par organoïde** : e_jk = g(y_jk) − médiane prédictive, rapportées
   **toutes**, organoïde par organoïde (aucune agrégation ne les remplace).
2. **Calibration** : couverture empirique des intervalles prédictifs centraux à 80 % et
   95 %, par statistique et conjointement (les cinq dans l'intervalle) ; valeurs PIT.
3. **Score** : CRPS moyen par modèle (Gneiting & Raftery 2007 ; estimateur « équitable » sur
   paires distinctes), avec intervalle bootstrap à 95 % **sur les organoïdes** ; différences
   M2 − C1 et M2 − M1.

**Règle d'interprétation — PROPOSITION (à valider avant dépôt)** :
- M2 est *prédictivement soutenu* dans une strate si (a) l'intervalle de la différence de
  CRPS M2 − C1 est entièrement négatif, **et** (b) la couverture à 95 % de M2 est
  ≥ 0,95 − δ, δ étant **À FIXER** compte tenu de l'effectif de test ;
- M1 est *sur-confiant* si sa couverture à 95 % est inférieure à celle de M2 et à 0,95 − δ ;
- toute autre configuration est rapportée telle quelle, sans verdict synthétique.

Le CRPS seul ne suffit pas : sur la vérité synthétique (§6), M1 et M2 ont des CRPS voisins
tandis que leurs couvertures diffèrent nettement. La calibration est donc co-primaire.

## 5. Résultats secondaires / Secondary outcomes

- Verdict catégoriel d'E1/E2 (règles inchangées), par strate, **à titre descriptif**.
- Matrice de dépendance (Spearman) entre statistiques : plusieurs écarts ne sont pas des
  échecs indépendants.
- Différences entre strates d'âge : **descriptives seulement** ; aucune inférence causale
  sur la maturation.
- Dispersion entre graines ; diagnostics de l'ABC (variance entre moyennes d'organoïdes,
  variance intra moyenne).

## 6. Validation préalable sur vérité synthétique / Prior validation on synthetic ground truth

`python3 empirical/test_e3.py` (22 contrôles, ≈ 1,5 min) — 6 organoïdes d'entraînement et
6 de test tirés d'une population à deux niveaux connue (dispersion entre organoïdes τ sur
quatre paramètres), T = 60 s, banque de 250 tirages par générateur, k = 15, 40 tirages
prédictifs, CRPS « équitable ». Quatre vérités, toutes reproductibles
(`--truth-seed N --tau τ`, résumé dans `results/exploratory/E3_synthetic_validation.json`) :

| Vérité | M2 hiérarchique : couv. 95 % (conjointe) | M1 regroupé : couv. 95 % (conjointe) | M1-E2 gelé (prototype Python) : couv. 95 % | M2 − C1, CRPS [IC 95 %] |
|---|---|---|---|---|
| graine 1, τ = 0,8 | 1,00 (1,00) | 0,67 (0,17) | 0,70 | −1,35 [−1,39 ; −1,31] |
| graine 2, τ = 0,8 | 0,93 (0,67) | 0,60 (0,17) | 0,73 | −1,25 [−1,28 ; −1,22] |
| graine 3, τ = 0,8 | 0,93 (0,67) | 0,70 (0,00) | 0,43 | −1,35 [−1,43 ; −1,23] |
| graine 4, τ = 0 | 1,00 (1,00) | 0,73 (0,17) | 0,93 | −1,30 [−1,36 ; −1,22] |

Lecture : le banc détecte l'absence de synchronisation partagée (C1 nettement moins bon dans
les quatre cas) ; le modèle regroupé réajusté est sur-confiant même sans dispersion entre
organoïdes, parce qu'il ignore l'incertitude d'ajustement ; les paramètres gelés d'E2,
centrés ici sur la vérité, ne sont calibrés que si les organoïdes ne varient pas (τ = 0) ;
le modèle hiérarchique sans mise en commun est calibré ou conservateur (couverture 0,93–1,00
pour une cible de 0,95). Le CRPS seul ne sépare pas M1 de M2 à n = 6 : la calibration est
co-primaire. Ce sont des propriétés du banc **sur des données dont la réponse est connue** ;
elles ne disent rien des organoïdes réels.

## 7. Portée des issues / What each outcome licenses

- **Soutien prédictif de M2** : générateur *descriptivement adéquat et calibré* pour S1–S5
  sur des organoïdes non vus de la strate et du jeu considérés. Statut : *Modélisé*. Ne dit
  rien des mécanismes, de l'activité évoquée, ni d'autres strates.
- **Échec** : les statistiques et les organoïdes en défaut sont nommés. **Aucun recalage
  sur les données de test.** Toute révision est consignée avec la donnée qui la motive, la
  prédiction nouvelle qu'elle fait et l'épreuve (E4, sur données encore jamais vues) qui
  pourrait l'invalider.
- **Dans tous les cas** : le modèle par défaut d'`OrganoidMEA` reste `'poisson'` ; les
  fichiers gelés d'E1/E2 restent inchangés (`npm run check:frozen`).

## 8. Paramètres à fixer avant dépôt / Parameters to set before filing

| Paramètre | Décision |
|---|---|
| Jeu de données de test et laboratoire | À FIXER |
| Règle de sélection sur métadonnées | À FIXER |
| Données d'entraînement | À FIXER |
| Définition des strates (âge, préparation) | À FIXER |
| Effectifs minimaux par strate | PROPOSITION (≥ 6 + ≥ 6) |
| Conventions d'ajustement (banque, k, tirages, graine) | PROPOSITION (§3) |
| Marge de calibration δ | À FIXER |
| Règle d'interprétation | PROPOSITION (§4) |
| Exclusions supplémentaires | À FIXER |
| Empreintes SHA-256 (LF) du code gelé au dépôt | À FIXER (au dépôt, via `npm run manifest`) |

## 9. Écarts / Deviations

*(vide au moment du dépôt / empty at filing)*

## Références / References

- Beaumont, M. A., Zhang, W., & Balding, D. J. (2002). Approximate Bayesian computation in population genetics. *Genetics*, 162(4), 2025–2035. doi:10.1093/genetics/162.4.2025
- Cutts, C. S., & Eglen, S. J. (2014). Detecting pairwise correlations in spike trains. *Journal of Neuroscience*, 34(43), 14288–14303. doi:10.1523/JNEUROSCI.2767-14.2014
- Gneiting, T., & Raftery, A. E. (2007). Strictly proper scoring rules, prediction, and estimation. *Journal of the American Statistical Association*, 102(477), 359–378. doi:10.1198/016214506000001437
- Trujillo, C. A., et al. (2019). Complex oscillatory waves emerging from cortical organoids model early human brain network development. *Cell Stem Cell*, 25(4), 558–569. doi:10.1016/j.stem.2019.08.002
- Van der Molen, T., et al. (2025). Preconfigured neuronal firing sequences in human brain organoids. *Nature Neuroscience*. doi:10.1038/s41593-025-02111-0
