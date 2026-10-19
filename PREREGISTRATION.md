# Pré-enregistrement — prédictions de niveau substrat du FCS
# Preregistration — substrate-level predictions of FCS

**Statut / Status : BROUILLON NON DÉPOSÉ / UNFILED DRAFT** — à compléter par l'auteur puis à
déposer (OSF Registries ou équivalent horodaté) **avant** toute session sur tissu vivant.
To be completed by the author, then filed (OSF Registries or an equivalent time-stamped
registry) **before** any session on living tissue.

© Genève 2026 Christophe Jean Legros · Assistance Multi IA

> **v3.2.0 (9 octobre 2026) — point 4 du programme minimal de consolidation.** Ajouts :
> §2bis (prédictions des modèles concurrents), §2ter (portée d'une confirmation), §3bis
> (issues → champs `fcs_withdrawal` → rang de révision), §4bis (gabarit du plan d'analyse,
> dont la règle « réglée / indéterminée »), §4ter (spécificité de l'intervention H3b), §6
> (contrôle de complétude). Les hypothèses H1–H3 et l'ordre de révision ne sont pas
> modifiés. Les nouvelles cases restent **À FIXER** ou marquées **PROPOSITION** : ce sont
> des décisions de l'auteur. `npm run prereg:check` refuse le dépôt tant qu'il en reste.
> *v3.2.0 additions: rival-model predictions, scope of a confirmation, outcome mapping,
> analysis-plan template, intervention specificity, readiness check. H1–H3 and the
> revision order are unchanged; new cells remain TO BE SET or PROPOSITION.*

---

## 0. Pourquoi ce document / Why this document

ASTRA ne traite aujourd'hui que des données simulées. Le jour où une donnée vivante le
traversera, elle ne vaudra comme épreuve que si la prédiction a été fixée avant elle.
Ce document fixe ce qui peut l'être à partir de la série FCS (document I v1.5, §4.3 ;
document IV v1.3, §4 ; document II v1.4, §6.2) et **marque explicitement comme
« À FIXER » tout paramètre que ces documents ne donnent pas**. Aucune valeur numérique <!-- prereg-check: ignore -->
n'y est inventée.

ASTRA handles only simulated data today. When living data first passes through it, that
data will count as a test only if the prediction was fixed beforehand. This document
fixes what the FCS series allows, and **explicitly marks as "TO BE SET" every parameter <!-- prereg-check: ignore -->
those documents do not supply**. No numerical value is invented here.

Chaque hypothèse est reliée au champ correspondant de l'évaluateur
`fcs_withdrawal` (`src/engine/fcs/withdrawal.ts`), de sorte que l'issue observée s'y
saisit telle quelle.

## 1. Portée / Scope

| | |
|---|---|
| Niveau visé | **I — substrat** (hypothèse du champ, ceinture) ; **IV** seulement via l'auxiliaire de pont (H3) |
| Hors portée | la contrainte de substrat (noyau) — non révisable dans le programme ; toute revendication phénoménale |
| Préparation de référence | tranche longitudinale d'hippocampe, paradigme de Chiang et al. (2019), doi:10.1113/JP276904 |
| Texte de référence des protocoles | document IV v1.3, §4 (dispositif osmotique, confondants, contrôles) |

## 2. Hypothèses / Hypotheses

### H1 — Autonomie causale de la propagation par le champ (dispositif 1)

- **FR.** Sous blocage synaptique complet, une activité périodique lente se propage à
  travers une coupure complète de la tranche, et cette propagation est abolie par un
  champ d'opposition.
- **EN.** Under complete synaptic blockade, slow periodic activity propagates across a
  complete cut of the slice, and this propagation is abolished by an opposing field.
- **Ce que H1 établit / What H1 establishes :** l'autonomie causale du champ comme voie
  de propagation (niveau I). **Ce qu'elle n'établit pas :** l'indépendance des
  observables de champ et de décharge, ni aucune signature de conscience.
- **Champ ASTRA :** `ephapticPropagationUnderBlockade`.

### H2 — Variation avec le rapport courant/champ (dispositif 2, osmotique)

- **FR.** Sous blocage synaptique, sur la même préparation, l'efficacité de la
  propagation varie avec la fraction volumique de l'espace extracellulaire dans le sens
  prédit par la résistivité : sa **réduction la facilite**, son **expansion l'entrave**,
  à potassium extracellulaire et volume cellulaire contrôlés.
- **EN.** Under synaptic blockade, on the same preparation, propagation efficacy varies
  with the extracellular volume fraction in the direction predicted by resistivity: its
  **reduction facilitates**, its **expansion hinders**, with extracellular potassium and
  cell volume controlled.
- **Confondants déclarés (document IV §4) :** libération vésiculaire sous hypertonicité ;
  variation des concentrations extracellulaires ; régulation du volume cellulaire — dont
  deux mesurables sans être supprimables. Leur mesure fait partie du protocole.
- **Champ ASTRA :** `efficacyVariesWithVolumeFraction`.

### H3 — Auxiliaire de pont (niveau I → niveau IV)

- **FR.** Chez l'animal non anesthésié, les variations physiologiques du couplage par le
  champ covarient avec les signatures de niveau IV au cours du cycle veille-sommeil
  (H3a), et une **intervention locale** sur son gain, à composition ionique mesurée,
  déplace les marqueurs locaux de ces signatures (H3b).
- **EN.** In the non-anaesthetised animal, physiological variations of field coupling
  covary with level-IV signatures across the sleep–wake cycle (H3a), and a **local
  intervention** on its gain, with ionic composition measured, shifts the local markers
  of those signatures (H3b).
- **Règle d'interprétation pré-enregistrée :** la covariation seule (H3a) **ne tranche
  pas** — la composition ionique varie avec l'état de vigilance (Ding et al., 2016,
  doi:10.1126/science.aad4821) et une cause commune neuromodulatrice peut agir en amont.
  Seule H3b porte la valeur du volet.
- **Champs ASTRA :** `bridgeCovariation` (H3a), `bridgeLocalIntervention` (H3b).

## 2bis. Modèles concurrents et prédictions différentielles / Rival models and differential predictions

Un succès n'est discriminant que s'il est **moins attendu sous une alternative explicite**.
Pour chaque hypothèse, les rivaux ci-dessous sont une **PROPOSITION** de l'assistance : la
liste, les manipulations discriminantes et les observables qui les tranchent sont à
valider par l'auteur avant dépôt. Aucune valeur numérique n'y est donnée.
*A success discriminates only if it is less expected under an explicit alternative. The
rivals below are a PROPOSITION to be validated by the author; no numerical value is given.* <!-- prereg-check: ignore -->

| Hyp. | Rival | Prédiction sous l'hypothèse | Prédiction sous le rival | Manipulation ou mesure discriminante |
|---|---|---|---|---|
| H1 | R1a — transmission synaptique résiduelle (blocage incomplet) | propagation insensible à un renforcement du blocage | propagation diminuée par un renforcement du blocage | vérification de la complétude du blocage (réponses synaptiques évoquées absentes) ; relation dose–effet du blocage — À FIXER |
| H1 | R1b — pont tissulaire résiduel (coupure incomplète) | propagation abolie par le champ d'opposition | propagation insensible au champ d'opposition | vérification histologique de la coupure ; écartement des berges — À FIXER |
| H1 | R1c — diffusion chimique extracellulaire (K⁺ notamment) | propagation sensible à la polarité du champ appliqué | propagation insensible au champ, dépendante de la diffusion | inversion de polarité du champ ; mesure du K⁺ extracellulaire au front — À FIXER |
| H1 | R1d — artefact de stimulation ou d'enregistrement | abolition dépendante de l'état du tissu | « abolition » présente aussi sur tissu inactif | condition simulée (sham) ; tissu inactivé — À FIXER |
| H2 | R2a — modification générale de l'excitabilité par l'osmolarité | effet sur la propagation au-delà de l'effet sur l'excitabilité locale | effet entièrement expliqué par l'excitabilité locale | excitabilité locale mesurée et introduite comme covariable — À FIXER |
| H2 | R2b — concentration extracellulaire (K⁺) modifiée par le volume | effet persistant à K⁺ apparié | effet suivant le K⁺ mesuré | K⁺ mesuré et apparié entre conditions — À FIXER |
| H2 | R2c — libération vésiculaire sous hypertonicité (confondant déclaré) | effet symétrique réduction / expansion, dans le sens de la résistivité | effet limité au sens hypertonique | comparaison des deux sens de la manipulation — À FIXER |
| H3a | R3a — cause commune neuromodulatrice (état de vigilance) | covariation résiduelle à état apparié | covariation annulée à état apparié | marqueurs d'état comme covariables ; c'est H3b qui tranche |
| H3b | R3b — effet non spécifique de l'intervention (excitabilité, transmission résiduelle, volume cellulaire) | déplacement des marqueurs propre à la modification du gain de couplage | déplacement reproduit par une intervention témoin aux effets non spécifiques appariés | intervention témoin ; mesures de spécificité (§4ter) — À FIXER |

## 2ter. Portée d'une confirmation / What a confirmation would establish

**FR.** Même une confirmation robuste de H1 et H2 établirait une **efficacité causale du
couplage par le champ dans la préparation étudiée** (niveau I). Elle ne démontrerait pas sa
nécessité pour la conscience. Le passage aux signatures d'accès (H3, auxiliaire de pont),
puis à la portée phénoménale de ces signatures, sont **deux inférences supplémentaires**,
dont aucune n'est éprouvée ici. Les pré-enregistrements E1/E2 (trains de spikes
d'organoïdes) et le présent brouillon (niveau substrat) ne sont pas interchangeables.

**EN.** Even a robust confirmation of H1 and H2 would establish a **causal efficacy of field
coupling in the preparation studied** (level I), not its necessity for consciousness. The
step to access signatures (H3, bridge auxiliary), then to the phenomenal reach of those
signatures, are **two further inferences**, neither tested here. E1/E2 (organoid spike
trains) and this draft (substrate level) are not interchangeable.

## 3. Ordre de révision déclaré / Declared revision order

En cas d'issue défavorable, la révision suit l'ordre commun aux documents I, II et IV,
fixé **avant** les données :

```
1 procédure d'inférence et auxiliaires de mesure
2 auxiliaire de pont
3 hypothèse de grain (M2)
4 critère d'individuation (M3)
5 thèse kinesthésique
6 hypothèse du champ
```

Conséquence opérationnelle : un échec de H3 révise d'abord l'auxiliaire de pont, pas
l'hypothèse du champ ; un échec de H1 ou de H2, **après contrôle des auxiliaires de
mesure (rang 1)**, porte sur l'hypothèse du champ. Une issue non réglée reste
« indéterminée » et n'est jamais comptée comme négative.

## 3bis. Issues, champs ASTRA et révisions / Outcomes, ASTRA fields and revisions

Chaque issue se saisit dans `fcs_withdrawal` sous trois valeurs seulement : `true`
(issue positive réglée), `false` (issue négative réglée), `null` (indéterminée — jamais
comptée comme négative). La règle qui décide entre les trois est celle du §4bis.

| Hypothèse | Champ | `true` | `false` | Révision déclenchée par `false` |
|---|---|---|---|---|
| H1 | `ephapticPropagationUnderBlockade` | propagation sous blocage, abolie par le champ d'opposition | pas de propagation par le champ | rang 1 contrôlé d'abord, puis hypothèse du champ (rang 6) |
| H2 | `efficacyVariesWithVolumeFraction` | efficacité variant dans le sens prédit | efficacité indépendante de la fraction volumique | rang 1 contrôlé d'abord, puis hypothèse du champ (rang 6) |
| H3a | `bridgeCovariation` | covariation | pas de covariation | ne tranche pas seule (règle pré-enregistrée) |
| H3b | `bridgeLocalIntervention` | déplacement des marqueurs locaux | pas de déplacement | auxiliaire de pont (rang 2), si H3a est aussi `false` |

Toute révision consécutive est consignée comme un enregistrement de révision
(`fcs_withdrawal`, champ `revisions`) : donnée qui la motive, prédiction nouvelle,
épreuve encore susceptible de l'invalider (Lakatos 1978, doi:10.1017/CBO9780511621123).

## 4. Paramètres à fixer par l'auteur / Parameters to be set by the author

Les documents sources ne fixent pas ces valeurs ; elles **doivent** l'être avant dépôt.

| Paramètre | H1 | H2 | H3 |
|---|---|---|---|
| Espèce, âge, préparation exacte | À FIXER | À FIXER | À FIXER |
| Agents et concentrations du blocage synaptique ; critère de complétude | À FIXER | À FIXER | — |
| Observable primaire et sa définition opératoire (p. ex. vitesse, probabilité de franchissement) | À FIXER | À FIXER | À FIXER |
| Niveaux de fraction volumique et méthode de mesure | — | À FIXER | À FIXER |
| Signatures de niveau IV retenues et leur mesure | — | — | À FIXER |
| Taille d'échantillon et sa justification (analyse de puissance) | À FIXER | À FIXER | À FIXER |
| Test statistique, seuil de décision, correction pour comparaisons multiples | À FIXER | À FIXER | À FIXER |
| Critères d'exclusion (tranches, animaux, enregistrements) | À FIXER | À FIXER | À FIXER |
| Règle d'arrêt | À FIXER | À FIXER | À FIXER |
| Critère d'issue « réglée » vs « indéterminée » | À FIXER | À FIXER | À FIXER |

## 4bis. Plan d'analyse statistique — gabarit / Statistical analysis plan — template

La structure ci-dessous est une **PROPOSITION** ; chaque case de valeur reste **À FIXER**.
*The structure below is a PROPOSITION; every value cell remains TO BE SET.* <!-- prereg-check: ignore -->

| Élément | H1 | H2 | H3a | H3b |
|---|---|---|---|---|
| Quantité estimée (estimand) | différence de l'observable primaire, champ d'opposition vs sans champ, sous blocage | pente de l'efficacité en fonction de la fraction volumique | association couplage–signatures IV au cours du cycle | différence des marqueurs IV, intervention vs témoin |
| Unité statistique | tranche, emboîtée dans l'animal — À FIXER | tranche, emboîtée dans l'animal — À FIXER | animal — À FIXER | site d'intervention, emboîté dans l'animal — À FIXER |
| Modèle | modèle à effets mixtes — PROPOSITION | modèle à effets mixtes — PROPOSITION | modèle à effets mixtes avec covariables d'état — PROPOSITION | modèle à effets mixtes — PROPOSITION |
| Plus petit effet d'intérêt (SESOI) | À FIXER | À FIXER | À FIXER | À FIXER |
| Seuil (α) et correction multiple | À FIXER | À FIXER | À FIXER | À FIXER |

**Règle « réglée / indéterminée » — PROPOSITION.** Sur l'effet estimé, dans le sens
prédit par l'hypothèse :
- **positive réglée (`true`)** : l'intervalle bilatéral à 1 − α exclut 0 **dans le sens
  prédit** ;
- **négative réglée (`false`)**, dans deux cas :
  - l'intervalle bilatéral à 1 − α exclut 0 **dans le sens contraire** à la prédiction (un
    effet inverse établi réfute la prédiction ; le classer « indéterminé » immuniserait
    l'hypothèse) ;
  - l'intervalle à 1 − 2α est entièrement contenu dans [−SESOI, +SESOI] : équivalence
    établie par deux tests unilatéraux au niveau α (TOST ; Lakens 2017,
    doi:10.1177/1948550617697177) ;
- **indéterminée (`null`)** : tout autre cas — en particulier un intervalle qui contient 0
  et déborde la zone d'équivalence.

Sans SESOI fixé, aucune issue négative par équivalence ne peut être déclarée : un résultat
non significatif reste `null`. C'est ce qui sépare une absence d'effet démontrée d'une
absence de démonstration. *(Règle corrigée après relecture indépendante : la première
version laissait un effet inverse significatif en « indéterminé » et utilisait un
intervalle à 1 − α pour l'équivalence.)*

## 4ter. Spécificité de l'intervention (H3b) / Specificity of the intervention (H3b)

Un déplacement des marqueurs n'est attribuable au gain de couplage que si l'intervention
ne l'explique pas autrement. Contrôles à prévoir — **À FIXER** (lesquels, comment mesurés,
avec quel seuil) :
- altération générale de l'excitabilité (seuil, fréquence de décharge locale) ;
- transmission synaptique résiduelle dans la zone d'intervention ;
- volume cellulaire et composition ionique (mesurée, conformément à H3b) ;
- intervention témoin aux effets non spécifiques appariés (sham).

## 5. Engagements / Commitments

1. Déposer ce document, complété, sur un registre horodaté avant la première session.
2. Publier toutes les issues, favorables, défavorables ou indéterminées.
3. Saisir chaque issue dans `fcs_withdrawal` telle quelle et publier le rapport produit.
4. Signaler tout écart au protocole déposé, avec sa justification.
5. Toute expérimentation animale ou sur tissu humain relève d'une approbation éthique
   institutionnelle réelle ; le moniteur « IRB » d'ASTRA, qui opère sur des biomarqueurs
   synthétiques, n'en tient pas lieu.

## 6. Contrôle de complétude avant dépôt / Readiness check before filing

```bash
npm run prereg:check     # liste chaque « À FIXER » et « PROPOSITION » restant ; refuse tant qu'il en reste
```

Le document ne peut être déposé qu'une fois ce contrôle passé, puis sa ligne de statut
remplacée par la référence du registre. *Filing is possible only once the check passes;
then replace the status line by the registry reference.*

## Références

- Chiang, C.-C., Shivacharan, R. S., Wei, X., Gonzalez-Reyes, L. E., & Durand, D. M. (2019). *J. Physiol.*, 597(1), 249–269. doi:10.1113/JP276904
- Ding, F., O'Donnell, J., Xu, Q., Kang, N., Goldman, N., & Nedergaard, M. (2016). *Science*, 352(6285), 550–555. doi:10.1126/science.aad4821
- Kleiner, J., & Hoel, E. (2021). Falsification and consciousness. *Neurosci. Conscious.*, niab001. doi:10.1093/nc/niab001
- Lakatos, I. (1978). *The Methodology of Scientific Research Programmes* (J. Worrall & G. Currie, eds.). Cambridge University Press. doi:10.1017/CBO9780511621123
- Lakens, D. (2017). Equivalence tests: A practical primer for t tests, correlations, and meta-analyses. *Social Psychological and Personality Science*, 8(4), 355–362. doi:10.1177/1948550617697177
- Série FCS : document I v1.5, document II v1.4, document IV v1.3 (6 octobre 2026 ; §4 inchangé depuis la v1.2), synthèse S-1.6 (6 octobre 2026), dossier `FCS v1.5/` de ce dépôt.
