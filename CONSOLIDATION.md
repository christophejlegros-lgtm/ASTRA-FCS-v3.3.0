# Consolidation v3.2.0 — réponse à l'analyse épistémologique du 9 octobre 2026
# Consolidation v3.2.0 — response to the epistemological analysis of 9 October 2026

**Objet analysé :** `ASTRA-Unified-ResearchLab-MCP-FCS-v3.1.0-main.zip`, SHA-256
`ea7dc79fb359d784d36a92776cac6f66111d76db29ab997e46861afe427064b2` (contenu effectif : v3.1.1).
**Objet produit :** ASTRA v3.2.0 (ce dépôt), vérifiable par `MANIFEST.sha256`.
**Nature :** modifications réalisées avec assistance d'IA. Ce document n'est ni une revue
externe ni une évaluation par les pairs ; il ne compte pas comme tel (`REVIEW.md`).

© Genève 2026 Christophe Jean Legros · Assistance Multi IA

---

## Synthèse

L'analyse tenait ASTRA-FCS pour recevable comme prototype d'instrumentation épistémique et
comme programme de recherche explicite, non comme théorie empiriquement validée de la
conscience. La v3.2.0 ne modifie pas ce jugement et ne cherche pas à le modifier : elle
convertit chacune des exigences de l'analyse en **contrainte vérifiable** (un gate de CI,
un contrôle calculé, un champ obligatoire, un refus d'exécution), et elle **sépare
strictement** ce que le code peut établir de ce qui relève des décisions de l'auteur.

Trois résultats méritent d'être lus d'abord, parce que la validation des proxys les a fait
apparaître et qu'ils dépassent l'analyse elle-même :
1. jusqu'à la v3.1.1, `get_acm_score` lisait une instance du réseau que `snn_step` ne
   faisait jamais avancer, et GW̃ lisait un champ d'état qu'aucun moteur n'écrivait
   (valeur 0 dans toute session) — deux absences de mesure présentées comme des valeurs ;
   corrigées ;
2. Φ̃ (ACM) et GW̃ (ACM) **échouent** à leur contrôle d'ablation de connectivité : ils ne
   baissent pas quand toutes les synapses sont retirées ; leurs fiches le déclarent. Plus
   généralement, les contrôles ajoutés **ne valident aucun proxy comme mesure** : ils
   séparent les exigences satisfaites ou non des défauts déclarés et confirmés ;
3. Φ̃-RIIU vaut ≈ 0,86 sur du bruit indépendant à la dimension déployée (d = n = 64) : le
   niveau témoin n'est pas zéro, et la plage informative est étroite.

## Summary (EN)

The analysis judged ASTRA-FCS admissible as a prototype of epistemic instrumentation and an
explicit research programme, not as an empirically validated theory of consciousness.
v3.2.0 leaves that judgement intact. It turns each requirement into a checkable constraint
(CI gate, computed control, mandatory field, refusal to run) and separates what code can
establish from what remains the author's decision. Proxy validation surfaced two wiring
defects (ACM read an SNN the tools never stepped; GW̃ read a field nothing wrote — both
fixed), two declared control failures (Φ̃ and GW̃ of the ACM do not fall under connectivity
ablation), and a high witness level of Φ̃-RIIU on noise (≈ 0.86 at d = n = 64).

---

## 1. Programme minimal de consolidation (§6.1) · Minimal consolidation programme

| # | Exigence | Réalisé | Fichiers | Reste à l'auteur |
|---|---|---|---|---|
| 1 | **Stabiliser l'objet cité** : version immuable, identification cohérente, résultats reliés au commit, empreintes inspectables | Source unique (`ASTRA_VERSION`, `EXPECTED_CAPABILITIES`) ; gate `check:identity` en CI et en test ; effectifs comptés à l'enregistrement ; `MANIFEST.sha256` vérifiable ; gate `check:frozen` ; script d'antériorité qui refuse de conclure sur un même commit et rappelle que les dates git sont déclaratives ; tableau de provenance distinguant cohérence, ordre et antériorité calendaire ; tampon de provenance dans toute sortie E3 | `src/version.ts`, `scripts/check-identity.mjs`, `scripts/manifest.mjs`, `scripts/check-frozen.mjs`, `scripts/verify-anteriority.sh`, `RELEASE.md`, `empirical/PROVENANCE.md`, `tests/identity.test.ts`, `.github/workflows/ci.yml` | Étiquette signée `v3.2.0`, DOI de version Zenodo inscrit dans `CITATION.cff` ; renommer le dépôt sans numéro de version ; exécuter `verify-anteriority.sh` sur le dépôt public ; horodatage tiers des futurs pré-enregistrements |
| 2 | **Consolider le modèle d'organoïdes** : E3 sur données nouvelles, stratification âge/préparation, organoïde comme unité, modèles hiérarchiques contre contrôles de complexité comparable, erreurs prédictives, calibration et incertitudes | Brouillon de pré-enregistrement E3 ; code d'analyse (analyse strate par strate ; ABC ajusté par régression sur une banque par durée d'enregistrement ; modèle à deux niveaux sans mise en commun ; modèle regroupé à la manière d'E2 ; témoin désynchronisé à neuf paramètres ; M0 et M1-E2 simulés par le code TypeScript gelé ; CRPS équitable, couverture 80/95 %, PIT, bootstrap sur organoïdes ; métadonnées avant spikes ; refus de toute analyse confirmatoire avant dépôt et des organoïdes déjà vus) ; validation sur quatre vérités synthétiques reproductibles ; relecture exploratoire d'E2 par organoïde | `empirical/PREREG-E3-DRAFT.md`, `empirical/e3_analysis.py`, `empirical/test_e3.py`, `empirical/e2x_per_organoid.py` | Choisir le jeu de données (idéalement d'un autre laboratoire) et la règle de sélection ; définir les strates ; fixer δ et les effectifs ; valider ou remplacer les PROPOSITIONS ; déposer avant tout accès |
| 3 | **Valider les proxys** : construit, formule, invariances, domaine ; contrôles de source commune, ablations de connectivité, signaux témoins ; distinguer résultat nul, absence de mesure, insuffisance d'échantillonnage | 13 fiches ; 17 contrôles — 9 exigences (7 satisfaites, 2 en échec : A1, A3) et 8 défauts déclarés, tous confirmés ; cinq statuts de mesure ; variantes invariante d'échelle et résiduelle ; estimation d'EI avec couverture ; outil `proxy_validate` (lecture seule, flux aléatoire isolé) ; ressource `astra://proxies/cards` ; deux défauts de câblage corrigés | `src/engine/proxy-cards.ts`, `src/engine/proxy-validation.ts`, `src/engine/tcai/metrics.ts`, `src/engine/acm.ts`, `src/server-proxy-tools.ts`, `tests/proxy-validation.test.ts` | Décider de la refonte (ou du retrait) de Φ̃, GW̃ et PAD̃ de l'ACM, qui échouent ou ne lisent aucune mesure ; choisir la dimension et le tampon de Φ̃-RIIU au vu du niveau témoin |
| 4 | **Achever H1–H3** : paramètres ouverts, confondants, analyse statistique, issues de retrait, prédictions des modèles concurrents | Modèles concurrents et prédictions différentielles (§2bis) ; portée d'une confirmation (§2ter) ; issues → champs `fcs_withdrawal` → rang de révision (§3bis) ; gabarit du plan d'analyse avec règle « réglée / indéterminée » (un effet significatif contraire à la prédiction réfute ; équivalence par TOST à 1 − 2α) (§4bis) ; spécificité de l'intervention H3b (§4ter) ; contrôle de complétude | `PREREGISTRATION.md`, `scripts/prereg-check.mjs` | Les 55 marqueurs « À FIXER » / « PROPOSITION » restants (espèce, préparation, agents, observables, SESOI, effectifs, tests, exclusions, règle d'arrêt…) — 22 de plus dans le brouillon d'E3 ; aucune valeur n'a été inventée |
| 5 | **Organiser une revue indépendante** : relectures neuroscientifique, des mesures et philosophique séparées ; l'assistance multi-IA ne garantit pas l'indépendance | `REVIEW.md` en trois relectures (A, B, C) de six questions chacune ; critères d'indépendance ; absence de concertation ; modèles d'issues exigeant l'empreinte du manifeste et les déclarations ; registre `reviews/` ; déclaration explicite que les vérifications assistées par IA ne sont pas des relectures | `REVIEW.md`, `.github/ISSUE_TEMPLATE/`, `reviews/README.md` | Solliciter trois relecteurs ; fixer la période de référence des liens d'intérêt ; **déclarer les liens de l'auteur** avec les entreprises citées |

## 2. Modifications par section de l'analyse · Changes by section of the analysis

| § | Constat de l'analyse | Modification | Statut |
|---|---|---|---|
| Périmètre | Archive nommée v3.1.0, contenu v3.1.1 ; `REVIEW.md` disait v3.1.0 | Version 3.2.0 partout, vérifiée par gate ; notice sur le nom du dépôt | fait ; renommage du dépôt : auteur |
| §1 | Banc E1 interrompu sans h5py après 15 PASS ; 354 tests = assertion documentaire | SKIP motivé, ou FAIL avec `--strict` (CI) ; reproduit : 15 PASS · 2 SKIP sans h5py ; suite exécutée ici : 393/393 | fait |
| §1 | Antériorité des pré-enregistrements non authentifiée | Script d'antériorité, tableau de provenance à trois niveaux, procédure d'horodatage tiers | outillé ; vérification sur le dépôt public : auteur ou relecteur |
| §2 | Spécificité explicative de la contrainte faible | Note de portée sur le noyau ; question ouverte q1 | question laissée à l'auteur |
| §2 | Ordre des niveaux ≠ succession ou nécessité ; « proto-conscience » risque d'incorporer l'explanandum | `LEVEL_ORDER_CAUTION` ; distinctions (a) contrôle sensorimoteur, (b) soi minimal, (c) expérience ; question q2 | fait (code, docs) ; reformulation des documents I/IV : auteur |
| §2.1 | L'ordre déclaré ne suffit pas : donnée motivante, prédiction nouvelle, épreuve | Enregistrements de révision et classement lakatosien ; contrôle de l'ordre | fait |
| §2.2 | M1 sous-déterminé | L'évaluation de M1 l'énonce ; question q3 | fait |
| §3 | Garde-fou : politique d'énonciation | Champ `isConscious` → `ignitedAccess` | fait |
| §3.1 | RIIU : valeurs absolues, non « énergie » ; sensibilité à l'échelle et à la source commune ; Φ̃ ne transmet pas les propriétés de Φ | Commentaire corrigé, formule exacte ; variantes ; contrôles R1–R7 ; fiche | fait |
| §3.1 | EI : matrice observationnelle, états non observés omis | `estimateEffectiveInformation` (couverture, transitions, statut) ; contrôles E1–E5 ; fiche | fait |
| §3.2 | Conformité taxonomique ≠ diagnostic de conscience ; intervalle de décharge descriptif | Note de portée de l'audit ; intervalle déjà déclaré descriptif en v3.1.1 | fait |
| §4, §4.1 | Règles descriptives, non IC ni équivalence ; min–max élargi ; médiane des médianes ; graines ≠ réplications ; statistiques dépendantes ; âge post hoc | Addenda §7 d'E1 et E2 ; relecture par organoïde (1 cellule sur 25 dans l'enveloppe des graines) ; E3 fait de l'organoïde l'unité et rapporte la dépendance | fait ; verdicts inchangés |
| §5 | H1–H3 incomplets ; H3a/H3b ; portée d'une confirmation | §2bis, §2ter, §3bis, §4bis, §4ter du pré-enregistrement ; question q4 | structure faite ; valeurs : auteur |
| §5.1 | Pluralisme ≠ compatibilité ; COGITATE comme repère | Question q5 (épreuves discriminantes) | question laissée à l'auteur |
| §5.2 | Recevabilité polynomiale ≠ critère de vérité ; valeur de l'information ≠ réfutation d'Orch-OR | Note de portée du noyau ; niveau III qualifié ; question q6 | fait |
| §6 | Pareto présenté comme unique règle admissible | Reformulé partout (code, docs, console) : choix méthodologique | fait ; documents sources II/IV : auteur |
| §6 | Dépendance d'étiquetage ≠ échec d'IIA au sens d'Arrow | `independenceChecks` : dominance 0 violation (contraction et profil) ; ordre induit par les strates 17/2 040 et 159/10 680 | fait |
| §6 | Fenêtre ~100 ms, distance, degrés : justification indépendante, sensibilité, concordance | `episodeWindowSensitivity` (reproduction pour toute coupure dans [10⁻¹ ; 10⁰) s) ; `fcs_agreement` (α de Krippendorff, feuille aveugle) | outillé ; justification biologique et codages : auteur et relecteurs |

## 3. Ce qui n'a pas été modifié, et pourquoi · Deliberately unchanged

- **Les neuf fichiers gelés d'E1/E2** (deux pré-enregistrements, sept fichiers de code et de
  calibration) : les modifier rendrait le rejeu d'E2 non concluant. `npm run check:frozen`
  le garantit ; tout le travail d'E3 vit dans des fichiers nouveaux.
- **Les verdicts, valeurs et JSON d'E1/E2** : seuls des addenda datés ont été ajoutés.
- **Les formules des proxys de l'ACM** : elles sont documentées, signalées et contrôlées ;
  les redéfinir serait une décision théorique qui revient à l'auteur.
- **Les documents sources de la série FCS** (`FCS v1.5/`) : la reformulation de leurs
  passages sur Pareto, l'IIA, la proto-conscience et la recevabilité polynomiale revient à
  leur auteur ; le code et la documentation d'ASTRA ne les citent plus dans les termes que
  l'analyse jugeait excessifs.
- **Toute valeur expérimentale de H1–H3 et d'E3**, et la **déclaration de liens
  d'intérêt** : décisions et déclarations personnelles de l'auteur.

## 4. Actions de l'auteur · Author's checklist

1. Relire et valider ce document, puis `git tag -s v3.2.0` selon `RELEASE.md` ; inscrire le
   DOI de version dans `CITATION.cff`.
2. Renommer le dépôt GitHub sans numéro de version ; mettre à jour les liens.
3. Exécuter `bash scripts/verify-anteriority.sh` dans un clone du dépôt public et consigner
   le résultat dans `empirical/PROVENANCE.md`.
4. Compléter `PREREGISTRATION.md` et `empirical/PREREG-E3-DRAFT.md` jusqu'à ce que
   `npm run prereg:check` passe ; les déposer sur un registre horodaté avant toute donnée.
5. Décider du sort de Φ̃, GW̃ et PAD̃ de l'ACM (refonte, retrait, ou maintien déclaré).
6. Remplir la déclaration de liens d'intérêt de `REVIEW.md` et solliciter les trois
   relectures.
7. Organiser le codage aveugle des trois sous-critères (`fcs_agreement`, gabarit) par au
   moins deux spécialistes, avec un seuil d'α déclaré à l'avance.
8. Réviser, dans les documents de la série, les passages signalés. Repérés dans
   `FCS v1.5/Implementation Neurochimique FCS v1.3.html`, §2 : « la règle retenue est donc
   la seule qui satisfasse l'unanimité sans introduire de dictature » (Pareto présenté comme
   unique) et « c'est un défaut d'indépendance à l'égard des options non pertinentes, la
   condition d'Arrow… » (FR et EN) — à reformuler comme le fait désormais
   `src/engine/fcs/stratification.ts`. À vérifier aussi, dans les documents I et II :
   l'ordre des niveaux, le terme « proto-conscience » et la recevabilité polynomiale.

## 5. Vérifications effectuées · Checks performed (9 October 2026, Node 22.22, Python 3.13)

| Commande | Résultat |
|---|---|
| `npm run build` (tsc strict) | 0 erreur |
| `npm run lint` | 0 erreur |
| `npm test` | 393 / 393 · 78 suites |
| `npm run golden:check` | à jour |
| `python3 empirical/test_confront.py --strict` | 17 PASS ; sans h5py : 15 PASS · 2 SKIP (non strict) ou 2 FAIL (strict) |
| `python3 empirical/test_e3.py` | 22 PASS (graine de vérité 1) ; graines 2, 3 et 4 : 22 PASS chacune |
| `npm run check:identity` · `check:frozen` · `manifest:check` | cohérent · 12/12 inchangés (9 gelés + 3 résultats publiés) · manifeste vérifié |
| smoke stdio | `ASTRA MCP Server v3.2.0: 72 tools · 16 resources · 10 prompts` |
| α de Krippendorff | identique au paquet Python `krippendorff` (écart max 2,2·10⁻¹⁶ sur 90 cas ; exemple canonique 0,743 / 0,815 / 0,849) |

## 6. Relecture indépendante de la consolidation · Independent check of the consolidation

Avant livraison, un agent d'IA distinct, qui n'avait pas vu le travail se faire, a vérifié la
consolidation à partir du diff, en réexécutant le code et les tests. **Ce n'est pas une revue
humaine indépendante** (`REVIEW.md`) ; c'est un contrôle interne. Il a confirmé l'intégrité des
fichiers gelés et presque tous les nombres annoncés, et relevé neuf problèmes, tous traités :

| Problème relevé | Traitement |
|---|---|
| `assessRevision` rejetait une révision conforme à l'ordre déclaré | Exige un contrôle de rang 1 enregistré et daté ; nomme les rangs intermédiaires non examinés ; test de non-régression |
| README : « proxys validés », modèle hiérarchique « calibré » | Reformulé : contrôles ajoutés, aucun proxy validé comme mesure ; « calibré ou conservateur » |
| Règle de H1–H3 : effet inverse significatif classé indéterminé ; équivalence à 1 − α | Effet contraire significatif → `false` ; TOST à 1 − 2α |
| `MANIFEST.sha256` absent | Généré et vérifié ; liste fondée sur les fichiers suivis par git |
| Code E3 en écart avec le brouillon (strates, M0, M1-E2, durées mêlées) | Analyse par strate ; M0 et M1-E2 par `sim_export.ts` gelé ; banque par durée ; modèle décrit comme « sans mise en commun » |
| Contrôle de source commune : le résidu ne retombe pas exactement au niveau témoin | Textes corrigés (« vers », non « au ») ; référence = bande à source unique ; défaut déclaré dans la fiche |
| « 14 contrôles tiennent » se lisait comme un succès | Polarité exigence / défaut ; résumé séparé ; R5 scindé |
| Points mineurs (console, comptage des marqueurs, zéro analytique de la dominance, CRPS biaisé, graines non reproductibles, EI vivant non classé, JSON publiés non protégés, renommage incompatible) | Tous corrigés ou déclarés (le renommage `isConscious` → `ignitedAccess` est assumé et documenté comme incompatible) |
| Antériorité non vérifiée | Inchangé : impossible sans accès au dépôt public ; procédure et script fournis (§4, action 3) |

## Références ajoutées · References added (DOI contrôlés contre Crossref le 9 octobre 2026)

- Beaumont, M. A., Zhang, W., & Balding, D. J. (2002). Approximate Bayesian computation in population genetics. *Genetics*, 162(4), 2025–2035. doi:10.1093/genetics/162.4.2025
- Cogitate Consortium et al. (2025). Adversarial testing of global neuronal workspace and integrated information theories of consciousness. *Nature*, 642, 133–142. doi:10.1038/s41586-025-08888-1
- Gneiting, T., & Raftery, A. E. (2007). Strictly proper scoring rules, prediction, and estimation. *Journal of the American Statistical Association*, 102(477), 359–378. doi:10.1198/016214506000001437
- Hayes, A. F., & Krippendorff, K. (2007). Answering the call for a standard reliability measure for coding data. *Communication Methods and Measures*, 1(1), 77–89. doi:10.1080/19312450709336664
- Hoel, E. P., Albantakis, L., & Tononi, G. (2013). Quantifying causal emergence shows that macro can beat micro. *PNAS*, 110(49), 19790–19795. doi:10.1073/pnas.1314922110
- Lakatos, I. (1978). *The Methodology of Scientific Research Programmes* (J. Worrall & G. Currie, eds.). Cambridge University Press. doi:10.1017/CBO9780511621123
- Lakens, D. (2017). Equivalence tests: A practical primer for t tests, correlations, and meta-analyses. *Social Psychological and Personality Science*, 8(4), 355–362. doi:10.1177/1948550617697177
- Sen, A. K. (1971). Choice functions and revealed preference. *The Review of Economic Studies*, 38(3), 307–317. doi:10.2307/2296384

Repris des sources existantes sans nouveau contrôle : Block (1995), doi:10.1017/S0140525X00038188 ;
Okasha (2011), doi:10.1093/mind/fzr010 (notice Crossref non lue le 9 octobre 2026 : limitation
de débit) ; Butlin et al. (2023), arXiv:2308.08708.
