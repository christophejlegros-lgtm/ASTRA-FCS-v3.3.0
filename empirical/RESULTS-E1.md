# Résultats E1 — Le simulateur d'organoïde d'ASTRA face à des organoïdes humains réels
# Results E1 — ASTRA's organoid simulator against real human brain organoids

**Pré-enregistrement / Preregistration :** [`PREREG-DANDI-001603.md`](PREREG-DANDI-001603.md),
SHA-256 `869d80ff4fcb71bee450c029377ff20a45a81528c3ace54fe5b42c572c356ce6`, rendu public
par le commit `eb03ad2` (23·09·2026, 19:15 CEST) **avant** la réception des données.
Le fichier de pré-enregistrement n'a pas été modifié depuis ; les écarts sont consignés
ci-dessous (§4), comme il le prévoit.

**Analyse / Analysis :** 23·09·2026, 19:20 CEST · `empirical/confront.py` ·
résultats bruts : [`results/E1.json`](results/E1.json).

© Genève 2026 Christophe Jean Legros · Assistance Multi IA

---

## 1. Verdict pré-enregistré / Preregistered verdict

# **INADÉQUAT · INADEQUATE**

Trois statistiques sur cinq sont incompatibles avec les organoïdes réels ; la règle
(« au moins 2 incompatibles ») s'applique sans ambiguïté.
Three of five statistics are incompatible with the real organoids; the rule ("at least
2 incompatible") applies unambiguously.

| # | Statistique / Statistic | Simulateur (médiane, 10 graines) | Organoïdes réels [min, max] | Verdict |
|---|---|---|---|---|
| S1 | Taux médian (Hz) | 1,918 | [0,508 ; 0,623] | **incompatible** |
| S2 | CV des ISI | 0,998 | [1,967 ; 3,457] | marginal |
| S3 | Bouffées de réseau (/min) | 0 | [4,10 ; 6,40] | **incompatible** |
| S4 | Part des spikes en bouffées | 0 | [0,105 ; 0,261] | **incompatible** |
| S5 | STTC médian (Δt = 20 ms) | 0,00002 | [0,030 ; 0,089] | marginal |

### Par organoïde / Per organoid

| Organoïde | Unités (actives) | T (s) | S1 | S2 | S3 | S4 | S5 |
|---|---|---|---|---|---|---|---|
| sub-HO6 | 50 (50) | 599,91 | 0,508 | 3,457 | 6,40 | 0,261 | 0,089 |
| sub-HO7 | 30 (30) | 599,85 | 0,623 | 2,695 | 4,40 | 0,143 | 0,057 |
| sub-HO8 | 35 (35) | 599,90 | 0,618 | 1,967 | 4,10 | 0,105 | 0,030 |

Les dix graines du simulateur restent toutes hors des intervalles réels : S1 ∈ [1,76 ; 2,24],
S2 ∈ [0,994 ; 1,007], S3 = 0, S5 ∈ [−0,0004 ; 0,0002].

## 2. Lecture / Reading

**FR.** Les organoïdes réels déchargent de façon irrégulière (CV 2 à 3,5), en bouffées de
réseau récurrentes (4 à 6,4 par minute, regroupant 10 à 26 % des spikes) et avec une
synchronie par paires faible mais positive. Le simulateur produit exactement ce que la
lecture de son code annonçait (§6 du pré-enregistrement) : des processus de Poisson
indépendants (CV ≈ 1), sans bouffée ni synchronie, à un taux environ trois fois trop
élevé. La prédiction a priori de l'auditeur est confirmée ; elle aurait pu être démentie
si les organoïdes avaient montré une activité proche d'un Poisson indépendant.

**EN.** The real organoids fire irregularly (CV 2 to 3.5), in recurrent network bursts
(4 to 6.4 per minute, gathering 10 to 26 % of spikes) and with weak but positive pairwise
synchrony. The simulator produces exactly what reading its code predicted (preregistration
§6): independent Poisson processes (CV ≈ 1), with no bursts and no synchrony, at a rate
about three times too high. The auditor's a-priori prediction is confirmed; it could have
been refuted had the organoids shown near-independent Poisson activity.

**Portée / Scope.** Le verdict porte sur l'activité **spontanée** du simulateur face à trois
organoïdes d'un seul jeu de données, dans une fenêtre de 10 minutes. Il ne dit rien de
l'activité évoquée, ni des autres composants d'ASTRA, ni des proxys de conscience, qui ne
sont pas opérationnalisables sur ces données (pré-enregistrement §7).

## 3. Analyse exploratoire (post hoc, sans incidence sur le verdict)
## Exploratory analysis (post hoc, no bearing on the verdict)

**Question :** l'échec tient-il au réglage du taux ou à la structure du modèle ?
**Procédé :** taux de base du simulateur ramené de 2,0 à 0,5944 Hz, pour que sa médiane
coïncide avec celle des organoïdes ; tout le reste inchangé.
Résultats bruts : [`results/exploratory/E1x_rate_matched.json`](results/exploratory/E1x_rate_matched.json).

| # | Simulateur recalé | Verdict |
|---|---|---|
| S1 | 0,571 Hz | compatible |
| S2 | 0,994 | marginal |
| S3 | 0 | **incompatible** |
| S4 | 0 | **incompatible** |
| S5 | −0,0005 | marginal |

**Toujours INADÉQUAT.** Le recalage corrige le taux mais ne fait apparaître ni bouffée ni
synchronie : l'échec est **structurel**. Le modèle ne comporte aucun couplage entre
électrodes en activité spontanée ; aucun réglage de paramètres existants ne peut produire
une activité de réseau. *Still INADEQUATE: the failure is structural, not parametric.*

## 4. Écarts et précisions / Deviations and clarifications

1. **Durée d'enregistrement.** Les fichiers ne comportent pas d'`obs_intervals`. La durée a
   été déterminée par la règle de repli inscrite dans `confront.py` **avant** la réception
   des données (du premier au dernier spike), soit 599,85 à 599,91 s. Le texte du
   pré-enregistrement disait seulement « durée enregistrée » : la précision est donc
   déclarée ici. L'effet sur les statistiques est négligeable (écart inférieur à 0,2 s
   sur 600 s).
2. **Verdict S2 proche de la frontière.** La valeur simulée (0,998) dépasse de peu la borne
   marginale (1,967 / 2 = 0,984). Avec une borne légèrement plus stricte, S2 serait
   incompatible ; le verdict global resterait INADÉQUAT dans les deux cas.
3. **Granularité.** Les trains réels sont des unités triées et curées (30 à 50 par
   organoïde) ; les trains simulés sont les 128 électrodes. Cette asymétrie était déclarée
   (pré-enregistrement §3).
4. **Ajout postérieur aux données.** Un quatrième argument optionnel (`baselineRateHz`) a
   été ajouté à `sim_export.ts` pour la seule analyse exploratoire (§3). L'analyse
   pré-enregistrée l'exécute sans cet argument, avec la configuration par défaut.

## 5. Données et reproductibilité / Data and reproducibility

| Fichier (DANDI 001603) | SHA-256 |
|---|---|
| `sub-HO6_ses-20250924T002106.nwb` | `2c28348b94804475f471a59a0bb1697bb1fe0cf28158d3eecab7f24034239a52` |
| `sub-HO7_ses-20250924T002328.nwb` | `34c80fcd8f558dd361c2aeded67596e2ee3b2b1bd75c847deab9b93ddec7488f` |
| `sub-HO8_ses-20250924T002134.nwb` | `95825eeca47e5448b3027bd7c05618dbb1587659c4eff94bbc07978b6b3cc41a` |

Données : DANDI Archive, dandiset 001603, CC-BY-4.0, doi:10.48324/dandi.001603/0.260923.0623 ;
Van der Molen et al. (2025), *Nature Neuroscience*, doi:10.1038/s41593-025-02111-0.
Les fichiers ne sont pas redistribués dans ce dépôt ; ils se téléchargent depuis DANDI.

Rejouer (Node ≥ 20, Python 3 avec numpy et h5py) :

```bash
python3 empirical/test_confront.py            # validation du banc sur données synthétiques (17 contrôles)
python3 empirical/run_e1.py sub-HO6_*.nwb sub-HO7_*.nwb sub-HO8_*.nwb
```

Le simulateur est déterministe (graines 1 à 10) ; les exports simulés (`*.sim.json`,
environ 27 Mo chacun) sont régénérés par la commande et ne sont pas versionnés.

## 6. Conséquences pour ASTRA / Consequences for ASTRA

- **Documentation.** Le simulateur ne doit plus être présenté comme un « modèle d'organoïde
  biophysiquement plausible » : pour l'activité spontanée, il est empiriquement réfuté sur
  ces données. Formulation recevable : « générateur de trains de Poisson indépendants à
  l'interface de la NeuroPlatform v2, adapté aux tests d'intégration, non à la
  modélisation de l'activité d'organoïdes ».
- **Piste de révision.** Une version candidate devrait introduire un couplage de réseau
  (par exemple un processus auto-excitateur partagé produisant des bouffées) et un taux
  de base de l'ordre de 0,6 Hz, **puis être soumise à une nouvelle épreuve pré-enregistrée
  sur d'autres organoïdes** (par exemple sub-HO1 à sub-HO5 du même jeu), et non aux trois
  qui ont servi à la réviser.

## 7. Addendum du 9 octobre 2026 — portée des règles de décision · Addendum of 9 October 2026 — scope of the decision rules

*Ajouté en v3.2.0 à la suite de l'analyse épistémologique du 9 octobre 2026 (§4.1). Le
pré-enregistrement, le code gelé, les valeurs et le verdict ci-dessus sont inchangés.*
*Added in v3.2.0 after the epistemological analysis of 9 October 2026 (§4.1). The
preregistration, the frozen code, the values and the verdict above are unchanged.*

**FR.**
1. **Nature des règles.** Les verdicts comparent une médiane simulée à l'intervalle
   [min, max] des organoïdes, puis à une bande élargie (facteur 2 ; ± 0,05 pour S5). Ce
   sont des **règles descriptives de compatibilité**, ni des intervalles de confiance ni des
   tests d'équivalence. Leur pré-déclaration réduit la flexibilité analytique ; elle ne
   démontre pas que les seuils ont la bonne sensibilité ou spécificité.
2. **Échelle de l'épreuve.** Trois organoïdes, une session chacun, dix minutes : l'unité
   biologique est l'organoïde (n = 3). Les dix graines mesurent la variabilité du
   générateur, non des réplications biologiques.
3. **Dépendance des statistiques.** S3, S4 et S5 dépendent tous de l'existence de bouffées
   synchrones : les trois incompatibilités ne sont pas trois preuves indépendantes, mais
   trois expressions d'un même défaut structurel (absence de couplage), ce que le
   diagnostic du §3 disait déjà.
4. **Portée du verdict.** INADÉQUAT limite l'usage du modèle de Poisson pour l'activité
   spontanée ; il ne réfute ni les autres modules d'ASTRA ni le programme FCS, et il ne
   porte sur aucun proxy de conscience (§7 du pré-enregistrement).
5. **Suite.** E3 (`PREREG-E3-DRAFT.md`, brouillon) traite l'organoïde comme unité et
   pré-déclare erreurs prédictives, calibration et incertitudes ; la règle catégorielle
   y devient une sortie secondaire.

**EN.**
1. **Nature of the rules.** The verdicts compare a simulated median with the [min, max]
   range over organoids, then with a widened band (factor 2; ± 0.05 for S5). These are
   **descriptive compatibility rules**, neither confidence intervals nor equivalence tests.
   Declaring them in advance reduces analytic flexibility; it does not show that the
   thresholds have the right sensitivity or specificity.
2. **Scale of the test.** Three organoids, one session each, ten minutes: the biological
   unit is the organoid (n = 3). The ten seeds measure the generator's variability, not
   biological replicates.
3. **Dependence among statistics.** S3, S4 and S5 all depend on the existence of
   synchronous bursts: the three incompatibilities are not three independent pieces of
   evidence but three expressions of one structural defect (no coupling), as the §3
   diagnosis already said.
4. **Reach of the verdict.** INADEQUATE limits the use of the Poisson model for spontaneous
   activity; it refutes neither ASTRA's other modules nor the FCS programme, and it bears
   on no consciousness proxy (§7 of the preregistration).
5. **Next.** E3 (`PREREG-E3-DRAFT.md`, draft) treats the organoid as the unit and
   pre-declares predictive errors, calibration and uncertainties; the categorical rule
   becomes a secondary output there.
