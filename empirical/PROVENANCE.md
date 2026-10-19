# Provenance des résultats empiriques · Provenance of the empirical results

*v3.2.0 — point 1 du programme minimal de consolidation (analyse épistémologique du
9 octobre 2026) : relier chaque résultat au commit effectivement utilisé, et distinguer ce
qui est vérifiable dans l'objet distribué de ce qui n'y est que déclaré.*
*Point 1 of the consolidation programme: tie each result to the commit actually used, and
separate what can be checked in the distributed object from what is only declared there.*

## 1. Trois niveaux de preuve · Three levels of evidence

| Niveau | Ce qu'il établit | Comment le vérifier |
|---|---|---|
| **Cohérence interne** | les empreintes déclarées correspondent aux fichiers présents ; les JSON correspondent aux comptes rendus | `npm run check:frozen`, `npm run manifest:check`, lecture des JSON |
| **Ordre dans l'historique** | le pré-enregistrement est entré dans l'historique avant les résultats | `bash scripts/verify-anteriority.sh` dans un clone du dépôt public |
| **Antériorité calendaire** | le pré-enregistrement existait avant la réception des données | horodatage tiers : dépôt sur registre, dépôt Zenodo, jeton RFC 3161, preuve OpenTimestamps |

Les dates de commit git sont fixées par la machine de l'auteur du commit : elles ne prouvent
pas une antériorité calendaire. *Git commit dates are set by the committer's machine and do
not prove calendar anteriority.*

## 2. État au 9 octobre 2026 · Status on 9 October 2026

Vérifications faites sur l'archive `ASTRA-Unified-ResearchLab-MCP-FCS-v3.1.0-main.zip`
(SHA-256 `ea7dc79fb359d784d36a92776cac6f66111d76db29ab997e46861afe427064b2`), qui ne contient
pas d'historique git.

| Élément | Déclaré dans | Valeur déclarée | Vérifié sur l'archive | Statut |
|---|---|---|---|---|
| Pré-enregistrement E1 | `RESULTS-E1.md` | SHA-256 `869d80ff…356ce6` (LF) | identique | cohérence ✔ |
| Commit public du pré-enregistrement E1 | `RESULTS-E1.md` | `eb03ad2`, 23·09·2026 19:15 CEST | — (pas d'historique) | **déclaré, non vérifié** |
| Pré-enregistrement E2 | `RESULTS-E2.md` | SHA-256 `bc5a3d5c…e6bf54` (LF) | identique | cohérence ✔ |
| Commit public du pré-enregistrement E2 | `RESULTS-E2.md` | `1905da1`, 28·09·2026 vers 16:38 CEST | — (pas d'historique) | **déclaré, non vérifié** |
| Code gelé d'E2 (7 fichiers) | `PREREG-E2` §3 | 7 empreintes | identiques (`npm run check:frozen`) | cohérence ✔ |
| Résultats publiés (E1.json, E2.json, E2_control_poisson.json) | §3 ci-dessous | 3 empreintes | identiques ; protégés par `npm run check:frozen` depuis la v3.2.0 | cohérence ✔ |
| Données de test E2 (5 NWB) | `RESULTS-E2.md` §5 | 5 empreintes | — (NWB non redistribués) | **déclaré** ; vérifiable par quiconque télécharge DANDI 001603 v0.260923.0623 |
| Données E1 (3 NWB) | `RESULTS-E1.md` §5 | 3 empreintes | — (NWB non redistribués) | **déclaré** ; vérifiable de même |
| Valeurs et verdicts E1/E2 | `RESULTS-E1.md`, `RESULTS-E2.md` | tableaux | identiques aux JSON | cohérence ✔ |
| Antériorité calendaire E1/E2 | — | — | — | **aucun horodatage tiers à ce jour** |

## 3. Empreintes des résultats · Result hashes (SHA-256, LF)

| Fichier | SHA-256 | Produit par | Commit |
|---|---|---|---|
| `results/E1.json` | `8cd6540448c44e0419608eaf62a37326d33a106631115b31525c85336ea6773c` | `run_e1.py` (23·09·2026) | déclaré : postérieur à `eb03ad2` |
| `results/exploratory/E1x_rate_matched.json` | `bb8f58192e4339e4d33b48cf26195834a2564c80ca0743b727cddaf254858166` | `sim_export.ts` (taux exploratoire) | non déclaré |
| `results/E2_calibration.json` | `2d2c11bf952af6dbfb99ce3bb3a177b50fd809b3bd7e9673a7bcffd94cd9c72a` | `e2_calibrate.py` (HO6–HO8) | gelé par `PREREG-E2` §3 |
| `results/E2_insample_training.json` | `f7690b62a5ada7663bd449d4ddd874ec6578825bb6acc004f6ca8c94694e2c2f` | `confront.py` (HO6–HO8) | gelé par `PREREG-E2` §3 |
| `results/E2.json` | `5304ae78e3898ad6a6851baf3cbc15d0a1827a79f275b8370a81f3cc299923cd` | `run_e2.py` (28·09·2026) | déclaré : postérieur à `1905da1` |
| `results/E2_control_poisson.json` | `480cb464bac65cd74ca4ac15b1aa3b2eea75d2a6928337fd1a29f0f8efa0272a` | `run_e2.py` (28·09·2026) | déclaré : postérieur à `1905da1` |
| `results/exploratory/E2x_per_organoid.json` | voir `MANIFEST.sha256` | `e2x_per_organoid.py` (v3.2.0), à partir de `E2.json` seul | exploratoire, v3.2.0 |
| `results/exploratory/E3_synthetic_validation.json` | voir `MANIFEST.sha256` | `test_e3.py --truth-seed 1…4 --summary-out` (v3.2.0) | vérité synthétique, v3.2.0 |

Les comptes rendus `RESULTS-E1.md` et `RESULTS-E2.md` ont reçu en v3.2.0 un addendum daté
(§7) ; leurs empreintes avant addendum étaient respectivement
`6c03948f04252a671bdb452a4804be673d1db4b59e8b20f825d310dba0f8b302` et
`7c97227aa9b75b51bd5c402188c375ff58a6bdceceb7d2a0ad009af576f370da` (LF). Aucun pré-enregistrement,
aucun fichier gelé et aucun JSON de résultat n'a été modifié.

## 4. Pour les résultats futurs · For future results

- E3 : `e3_analysis.py` inscrit dans chaque sortie un tampon de provenance (commit git et
  état « propre » si le dépôt est un clone, empreintes du code exécuté et du
  pré-enregistrement, versions de Python et de NumPy, date UTC).
- Avant toute donnée : déposer le pré-enregistrement complété sur un registre horodaté, ou
  au minimum publier son empreinte par un moyen tiers (RELEASE.md §4).
- Chaque résultat cite la version étiquetée et son DOI de version, et l'empreinte de
  `MANIFEST.sha256`.
