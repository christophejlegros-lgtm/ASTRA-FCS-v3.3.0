# Canaux somatosensoriel et intéroceptif, test de retrait de la thèse kinesthésique

**ASTRA-FCS v3.3.0-rc.5 (pré-version)** · © Genève 2026 Christophe Jean Legros · Assistance Multi IA
Version anglaise : [SOMATOSENSORY-INTEGRATION.en.md](SOMATOSENSORY-INTEGRATION.en.md) · Revue critique et corrections : [REVUE-SENSORS.md](REVUE-SENSORS.md) · Préenregistrements : [FCS-K0, pilote robot](empirical/PREREG-KINAESTHETIC-K0-PILOT.md) · [FCS-K1, participants humains](empirical/PREREG-KINAESTHETIC-K1.md)

## 1. Ce que la couche rend testable

La thèse kinesthésique appartient à la ceinture du programme. Sa condition de retrait est la suivante (document II §4.2, `withdrawal.ts`) : *si les effets de dimensionnalité sous rupture de clôture (§6.3) apparaissent pour des manipulations de la congruence intéroceptive et non pour des manipulations de la congruence sensorimotrice, la première clôture est intéroceptive, et le niveau II est redéfini.*

Avant la rc.5, ASTRA ne pouvait pas éprouver cette condition. Il n'avait ni canal somatosensoriel, ni canal intéroceptif séparé, ni manipulation de congruence, ni analyse capable d'établir une **absence** d'effet. La rc.5 fournit ces quatre éléments, avec des garde-fous qui empêchent une simulation d'ASTRA de compter comme preuve.

## 2. La boucle

```
          copie d'efférence (t_e, commande)
  ┌────────────────────────────────────────────┐
  │                                            ▼
commande ──▶ corps instrumenté ──▶ lecture somatosensorielle (t, domaine d'horloge)
  │            (simulé ou rapporté)        │  SA1 FA1 FA2 SA2 COLD WARM NOCI SPINDLE TENDON
  │                                        ▼
  │                          [manipulation sensorimotrice : délai, gain, inversion, remappage, gigue]
  │                                        ▼
  └──▶ modèle direct ŷ = W·[1, u, y₋₁] ──▶ comparateur : e = y − ŷ  (résidu = exafférence estimée)
                                                            │
                         clôture opérationnelle M3 ◀────────┘  (informativité de la commande contre substitut décalé)

  variables internes (température d'actionneur, charge, …  |  milieu de culture : T, pH, O₂, glucose)
         ▼
  [manipulation intéroceptive : gain autour de la consigne, décalage, découplage, délai]
         ▼
  canal intéroceptif SÉPARÉ : erreur homéostatique, marge de viabilité, erreur de prédiction
  (jamais dans la fusion extéroceptive ; aucun signal physique partagé avec le canal somatosensoriel)
```

## 3. Modules

| Fichier | Rôle |
|---|---|
| `src/engine/somatosensory.ts` | Lecture somatosensorielle validée (rejet des NaN, des forces négatives et des domaines d'horloge manquants). Analogues fonctionnels des classes afférentes. Indicateurs de seuil protecteur. Code de fréquence déclaré. |
| `src/engine/interoception.ts` | Variables déclarées (consigne, plage viable). Erreur homéostatique, marge de viabilité, prédiction homéostatique apprise. Aucun défaut fourni pour les cultures. Contrôle de séparation des canaux. |
| `src/engine/reafference.ts` | Copie d'efférence, modèle direct NLMS avec a priori de persistance, appariement par latence attendue L̂, comparateur, clôture opérationnelle M3 avec substitut. |
| `src/engine/congruence.ts` | Les deux familles de manipulation sur flux horodatés, l'espace de conditions validé, un flux aléatoire local. |
| `src/engine/body-loop.ts` | Calibration, gel, manipulation. Erreurs des deux canaux par condition (contrôle de manipulation). |
| `src/engine/body-sim.ts` | Doigt à une articulation simulé, servant uniquement à éprouver la chaîne. Toutes ses données sont `simulated`. |
| `src/engine/body-probes.ts` | Mouvements-sondes du pilote FCS-K0 et observations par condition. Les réponses combinent les erreurs des **deux** canaux, chacune centrée-réduite. |
| `src/engine/dimensionality.ts` | Matrice de dissimilarité, MDS classique (Torgerson 1952), rapport de participation (Gao & Ganguli 2015), loi de Student, pente des moindres carrés. |
| `src/engine/fcs/kinaesthetic-withdrawal.ts` | Protocole, empreinte SHA-256, éthique, analyse, contrôles synthétiques. Branché sur `withdrawal.ts`. |
| `src/server-body-tools.ts` | 7 outils MCP en lecture seule, 1 ressource, 1 prompt. |

## 4. Choix de conception, énoncés plutôt que supposés

1. **Une classe nomme un rôle, pas une équivalence physiologique.** SA2, l'étirement cutané, est réafférent, car l'étirement de la peau porte une information kinesthésique (Edin & Johansson 1995 ; Collins et al. 2005). Il est donc manipulé avec les articulations. Une matrice tactile optique, qui fonctionne par images, ne peut pas fournir FA2 ; le module le signale au lieu d'inventer une vibration. Le seuil de chaleur par défaut (43 °C) suit la plage d'activation de TRPV1 (Vriens et al. 2014). Les autres seuils sont des valeurs provisoires, à remplacer par celles de la fiche technique.
2. **La thermique porte sur le contact.** Un capteur chauffé qui mesure le flux distingue un métal d'un bois à la même température, ce qu'un capteur passif ne peut pas faire. Les classes COLD et WARM combinent une composante statique, une composante dynamique et le flux.
3. **La latence est calibrée, puis figée.** La commande émise en t_e est comparée au retour dont le système dispose en t_e + L̂. Si l'on appariait chaque commande avec « l'échantillon suivant », un délai uniforme allongerait seulement la latence et le comparateur ne le verrait jamais.
4. **La clôture est définie contre un substitut.** La boucle est close si la commande réelle prédit le retour mieux que la même commande décalée circulairement d'une demi-session : l'autocorrélation est conservée, la correspondance détruite. Il faut aussi que l'appariement réussisse dans au moins 90 % des cas et que la latence médiane ne dépasse pas 100 ms. Ces seuils sont déclarés et modifiables. Le critère livre une frontière, non une grandeur. Il porte sur les distinctions (a) et (b) du niveau II, jamais sur (c).
5. **Les deux familles sont séparées de trois façons.** Une condition n'appartient qu'à une famille. Aucun signal physique n'appartient aux deux canaux : un courant moteur utilisé comme effort (TENDON) ne peut pas servir en même temps de consommation intéroceptive. Enfin, la fusion extéroceptive refuse les trames intéroceptives à l'exécution.
6. **Le délai intéroceptif pur est presque invisible.** Une série intéroceptive retardée mais cohérente reste prévisible à partir de son propre passé, puisque la régulation autonome n'a ni « commande discrète ni réafférence spécifique » (document II §4.2). Le gabarit de protocole emploie donc un gain autour de la consigne et un découplage, et le contrôle de manipulation est obligatoire.

## 5. Le test de retrait

**Mesure.** Pour chaque unité (organoïde, séance ou sujet) et chaque condition, on construit une matrice de dissimilarité sur des items-sondes. On en tire la dimensionnalité effective, c'est-à-dire le rapport de participation du spectre MDS. On calcule ensuite, par unité, la pente de cette dimensionnalité sur le niveau gradué (0 = congruent, 1 = rupture maximale de la famille), puis l'intervalle (1 − 2α) de cette pente sur l'ensemble des unités.

**Lecture d'une famille.** Une famille est « équivalente » (effet absent) si l'intervalle de la pente **et** celui du contraste de chaque niveau avec la ligne de base tombent dans ±SESOI. Cette garde de monotonie empêche une réponse en U inversé, dont la pente est proche de 0, d'être lue comme une absence. Sinon, elle est en « augmentation » si la borne inférieure dépasse 0, ou dépasse la SESOI si le critère d'effet minimal a été choisi. Elle est en « diminution » ou « non concluante » dans les autres cas.

**Contrôles.** Pour chaque famille, deux conditions doivent être remplies :

- *manipulation* : la pente de l'erreur de prédiction du canal propre doit être positive ;
- *spécificité* : elle doit dépasser celle de l'autre canal.

**Motifs.** On en tire quatre motifs : intéroceptif seul, sensorimoteur seul, les deux, aucun. Toute autre configuration est « indéterminée », avec ses raisons. Une **diminution** de dimensionnalité est une anomalie au regard de §6.3 ; elle est examinée d'abord au rang 1 de l'ordre de révision.

**Effet sur `withdrawal.ts`.** Seul le motif « intéroceptif seul » retire la thèse. « Sensorimoteur seul » la maintient en soutenant le choix de la première clôture. « Les deux » et « aucun » la maintiennent sans départager. Le motif est transmis avec le booléen `dimensionalityFromInteroception`, et des valeurs incohérentes entre les deux ne sont pas utilisées.

**Conditions confirmatoires.** Toutes sont exigées ; sinon, l'analyse reste exploratoire :

- protocole déclaré confirmatoire (`role: "confirmatory"` ; un pilote ne fixe jamais de résultat) ;
- protocole déposé sur un registre horodaté ;
- empreinte SHA-256 inchangée ;
- aucun paramètre ouvert (unité, effectif minimal, α, SESOI, critère d'effet) ;
- espace de conditions valide ;
- canaux disjoints ;
- éthique non bloquante ;
- toutes les observations datées **après** le dépôt et d'origine `reported`.

**Les simulations d'ASTRA n'apportent pas de preuve.** Elles ne fixent jamais un résultat de retrait.

## 6. Avec du matériel réel

- **Acquisition.** Il faut un microcontrôleur, un seul domaine d'horloge, et un horodatage matériel pour la commande comme pour le retour. Le réflexe protecteur reste local, et le MCP sert à la supervision et à l'analyse.
- **Ligne à retard.** En expérience vivante, la ligne à retard appartient au micrologiciel d'acquisition, dont la latence est connue. `congruence.ts` en est la référence et la voie hors ligne.
- **Déclaration des sources.** Déclarez `sourceSignals` pour chaque canal. Les données envoyées à ASTRA sont marquées `reported` : ASTRA ne les vérifie pas et ne les promeut jamais en mesures.
- **Culture vivante.** Les plages viables (température, pH, O₂, glucose) sont celles du laboratoire. Une référence d'approbation éthique est requise, et les seuils de bien-être du moniteur s'appliquent. Les canaux de seuil protecteur ne sont pas délivrés à la culture sans justification déclarée.
- **Voie biohybride.** `afferentRates` fournit un code de fréquence linéaire déclaré, pour l'injection dans le SNN ou la planification de stimulation sur MEA. Le nombre d'électrodes du dispositif limite la carte somatotopique : il faut le lire dans la documentation du dispositif, non le supposer.

## 7. Outils MCP

| Outil | Fonction |
|---|---|
| `soma_encode` | Encode une lecture en classes afférentes, indicateurs de seuil et code de fréquence. |
| `intero_encode` | Calcule les erreurs homéostatiques, la viabilité et les erreurs de prédiction. |
| `kin_closure` | Évalue la clôture opérationnelle M3 d'une séance simulée ou rapportée. |
| `kin_manipulation_check` | Calibre, fige, manipule, puis rend les erreurs des deux canaux par condition. |
| `kin_protocol` | Renvoie le gabarit, ou fige un protocole : empreinte, paramètres ouverts, éthique. |
| `kin_analyse` | Analyse les observations sous protocole : familles, motif, résultat de retrait. |
| `kin_validate` | Exécute les contrôles synthétiques positifs et négatifs de l'analyse. |

Ressource : `astra://kinaesthetic/protocol-template`. Prompt : `kinaesthetic-withdrawal-test`.

## 8. Limites

- La transposition de la statistique du §6.3, des matrices phénoménales aux matrices de réponses de substrat, est une question ouverte (C8 de `REVIEW.md`).
- Le corps simulé est élémentaire.
- Le raccordement du canal intéroceptif au contrôleur homéostatique de la boucle de second ordre n'est pas réalisé, délibérément, car il couplerait les deux familles.
- La dimensionnalité effective n'est un degré de rien de phénoménal (interdictions 1 et 2).

Références, avec leurs DOI vérifiés : [REVUE-SENSORS.md](REVUE-SENSORS.md) §6.
