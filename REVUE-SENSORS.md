# ASTRA-FCS : analyse critique de « SENSORS.pdf » et corrections appliquées dans la rc.5

**20 octobre 2026. Revue technique et épistémologique réalisée avec une assistance d'IA.**
Ce travail n'est pas une évaluation externe par les pairs. Il ne valide pas empiriquement la thèse kinesthésique et ne valide aucun capteur.

## 1. Objets examinés

1. **`SENSORS.pdf`.** Trois pages au format A4, produites par LibreOffice le 20 octobre 2026 à 14 h 36. Le document répond à la question des capteurs qui donneraient à ASTRA des fonctions kinesthésiques proches de celles de la peau. Les lignes 85 à 90 du texte extrait contiennent le code source d'un diagramme Mermaid, avec les identifiants d'une interface conversationnelle. Le document est donc la transcription d'une réponse d'assistant, non un texte rédigé pour la publication.
2. **Ma propre réponse antérieure à la même question**, donnée dans la même session. Ses erreurs sont relevées au §4.
3. **L'arbre `v3.3.0-rc.4`.** C'est la base sur laquelle les corrections ont été implémentées. Avant toute modification, la suite complète passait à 425 sur 425, et les contrôles d'identité, de fichiers gelés et de manifeste étaient conformes.

## 2. Appréciation générale

**`SENSORS.pdf` est une bonne réponse d'ingénierie à une question que le programme FCS pose autrement.**

Plusieurs points du document sont justes et ont été repris :

- il distingue la sensibilité cutanée, la proprioception et le traitement ;
- il signale que la peau contribue à la kinesthésie ;
- il cantonne Koniku à la chimiosensation et reste prudent sur sa documentation ;
- il fait de la copie de la commande la condition de l'adaptation sensorimotrice ;
- il garde la régulation rapide sur le microcontrôleur, les appels MCP servant à superviser et à analyser ;
- il conclut que l'ensemble ne suffirait « pas à établir une sensation vécue, une douleur ou une conscience ».

Les défauts sont d'un autre ordre. Le document demande quels capteurs reproduisent des fonctions. Le programme demande quelles mesures permettraient de **retirer** la thèse kinesthésique si elle est fausse. La condition de retrait est la suivante : « effets de dimensionnalité obtenus par manipulation de la congruence intéroceptive, non sensorimotrice » (document II §4.2, `withdrawal.ts`). Le document rend cette condition intestable de trois façons. Il ne prévoit aucun canal intéroceptif. Il propose de valider par ablation plutôt que par manipulation graduée. Il ne traite pas la preuve d'une absence d'effet.

## 3. Constats et corrections

| Réf. | Nature | Constat dans `SENSORS.pdf` | Correction appliquée (rc.5) |
|---|---|---|---|
| S1 | Majeur, épistémologique | Aucun canal intéroceptif. Le rival déclaré du critère M3, la clôture intéroceptive (Damasio & Carvalho 2013 ; Seth 2013), ne peut pas être éprouvé. | `interoception.ts` est séparé sur trois plans. Le type `channel: 'interoceptive'` n'est jamais un `ModalityEmbedding`, et la fusion le refuse à l'exécution. Les variables sont déclarées avec une consigne et une plage viable. La prédiction est homéostatique. `checkChannelSeparation` signale tout signal physique revendiqué par les deux canaux. |
| S2 | Majeur, méthodologique | La validation proposée consiste à « retirer temporairement une modalité » pour mesurer « sa contribution réelle ». L'interdiction 5 du programme s'y oppose : un effet d'ablation permissif n'établit pas un rôle constitutif. Seule une intervention qui modifie la classe sans supprimer les conditions générales de fonctionnement peut trancher. | `congruence.ts` implémente des manipulations **graduées** de la congruence, selon le document II §6.2. Côté sensorimoteur : délai, gain, inversion, remappage spatial et gigue. Côté intéroceptif : délai, gain autour de la consigne, décalage et découplage par relecture mélangée. Une condition appartient à une seule famille, et `validateConditionSpace` le vérifie. L'ablation reste un contrôle, pas un critère. |
| S3 | Majeur, logique | Le document ne distingue pas un effet absent d'un effet non démontré. La condition de retrait a pourtant deux volets : un effet sous manipulation intéroceptive, **et** l'absence d'effet sous manipulation sensorimotrice. | L'absence est établie par équivalence : l'intervalle (1 − 2α) doit tomber dans ±SESOI (Lakens 2017). Le critère de présence (`effectCriterion` : supériorité ou effet minimal) est à préenregistrer. Sans SESOI, aucun motif n'est dérivé (voir R1). |
| S4 | Majeur, mesure | Aucun contrôle de manipulation. Si une manipulation n'a pas atteint le système, son effet nul ne décide rien. | `body-loop.ts` calibre sur un bloc congruent, fige les modèles, puis manipule. Il enregistre ensuite l'erreur de prédiction **des deux canaux**. L'analyse exige qu'une famille élève l'erreur de son propre canal (contrôle de manipulation) et l'élève davantage que celle de l'autre canal (contrôle de spécificité). Sinon, le verdict est « indéterminé ». |
| S5 | Modéré, temporalité | Le document évoque une « acquisition horodatée » sans en tirer les conséquences. | Chaque échantillon porte un domaine d'horloge, et le comparateur refuse d'apparier deux domaines. Les délais s'appliquent aux horodatages matériels, non à l'horloge du serveur. La latence attendue L̂ est calibrée sur le bloc congruent puis figée : l'estimer sur un flux retardé absorberait le délai à l'essai. Le choix du document de laisser le MCP hors de la boucle rapide est conservé. |
| S6 | Modéré, conceptuel | Les capteurs d'étirement exigent, selon le document, de distinguer la déformation due au mouvement de celle due au contact. Le problème est bien posé, mais sa solution n'est pas nommée. | La solution est le principe de réafférence (von Holst & Mittelstaedt 1950), avec un modèle direct (Wolpert, Ghahramani & Jordan 1995). Dans `reafference.ts`, le résidu du modèle alimenté par la copie d'efférence estime l'exafférence. |
| S7 | Modéré, conceptuel | « La peau contribue elle-même à la kinesthésie » : c'est exact (Edin & Johansson 1995 ; Collins et al. 2005), mais la conséquence n'est pas tirée. | L'étirement cutané (SA2) est classé **réafférent**. Le délai déplace la lecture entière, et le gain s'applique aux articulations comme à l'étirement. Aucun indice cutané ne reste ainsi congruent à côté d'articulations manipulées. |
| S8 | Modéré, thermique | Le document note l'inertie du TMP117 ou d'une thermistance, ce qui est exact. Il omet le principal : la perception thermique d'un matériau dépend du flux échangé au contact. Un capteur passif à température ambiante ne distingue pas le métal du bois à la même température. | `ThermalContact` déclare `heated` et `heatFluxWm2`. Les classes COLD et WARM combinent une composante statique, une composante dynamique et le flux ; une note est émise si un flux est fourni par un capteur non chauffé. |
| S9 | Mineur | Koniku : le constat est juste et concorde avec le code, dont l'encodeur olfactif est déclaré simulé depuis la v3.1.0. | Aucune modification du code. Le canal chimique reste extéroceptif. |
| S10 | Mineur, appareil | Les références sont réduites à des étiquettes inutilisables : « Wiley Online Library », « XELA Robotics », « TI.com », « Technology », « pubmed.ncbi.nlm.nih.gov ». | Elles sont remplacées au §6 par des références dont le DOI a été vérifié sur Crossref le 20 octobre 2026. Les documentations des fabricants restent des sources valables pour les spécifications, non pour les affirmations scientifiques. |
| S11 | Mineur, édition | Le code source du diagramme Mermaid est déversé dans le texte (lignes 85 à 90) et le diagramme est perdu. | Le schéma de la boucle figure en texte dans `SOMATOSENSORY-INTEGRATION.*.md`. |
| S12 | Omission | Aucun canal de seuil protecteur, et rien sur l'éthique des substrats vivants, alors que le programme inclut des organoïdes. | La classe NOCI est un indicateur de seuil, sans vocabulaire de ressenti. `checkDeliveryEthics` bloque l'analyse confirmatoire si des manipulations visent une culture vivante ou des sujets humains sans référence d'approbation. Avec une culture, les seuils de bien-être du moniteur s'appliquent. |
| S13 | Omission | La section « réseaux neurologiques » ne mentionne ni la voie biohybride (MEA, CL1, FinalSpark) ni la voie neuromorphique, qui sont celles du programme. | `afferentRates` fournit un code de fréquence déclaré, destiné à l'injection dans le SNN ou à la planification de stimulation. Le goulot du nombre d'électrodes est rappelé au §4. |

**R1, défaut trouvé dans ma propre implémentation, puis corrigé.** Dans la première version de l'analyse, l'absence de SESOI laissait encore dériver un motif. Un intervalle minuscule mais strictement positif était alors lu comme une « augmentation ». Sous un plan « intéroceptif seul », l'analyse concluait à tort « both », ce qui aurait maintenu la thèse. Un test l'a révélé. Désormais, sans SESOI, aucun motif n'est dérivé (test de régression sur trois graines).

## 4. Corrections à ma réponse antérieure

- **« Le sens thermique réagit au flux de chaleur. »** La formule était trop forte. Les thermorécepteurs codent la température cutanée et sa vitesse de variation (Vriens, Nilius & Voets 2014). Le flux détermine comment un contact fait varier cette température. Le code suit la formulation corrigée : composantes statique et dynamique, flux en option.
- **« 64 électrodes permettent la carte somatotopique d'un doigt. »** Ce chiffre valait pour la grille 8 × 8 de votre décodeur CL1, pas pour toutes les plateformes. Le simulateur NeuroPlatform d'ASTRA modélise 128 électrodes. Pour un dispositif réel, le nombre d'électrodes doit être lu dans sa documentation ; il ne doit pas être supposé.
- **La symétrie des deux familles de manipulation était supposée à tort.** L'implémentation a montré qu'un **délai** intéroceptif pur reste presque invisible pour un prédicteur homéostatique : une série retardée mais cohérente reste prévisible à partir de son propre passé. C'est la conséquence attendue d'une régulation sans « commande discrète ni réafférence spécifique » (document II §4.2). Les manipulations intéroceptives doivent donc rompre la correspondance avec l'état réel (gain, découplage) ou porter sur une charge déclarée. Le contrôle de manipulation est indispensable, et le gabarit de protocole n'utilise pas de délai intéroceptif.
- **La condition de retrait était énoncée sans ses deux volets.** Elle l'est désormais, avec l'équivalence pour l'absence.
- **Le raccordement au contrôleur homéostatique était présenté comme naturel.** Il n'est **pas** câblé, et c'est délibéré : le raccorder ferait entrer l'intéroception dans la boucle d'actuation et lierait les deux familles. C'est une décision de conception qui revient à l'auteur.

## 5. Ce que la rc.5 n'établit pas

- Aucun capteur ni aucune plateforme réelle n'est connecté. Le doigt de `body-sim.ts` est volontairement élémentaire et ne prétend décrire aucun dispositif.
- Les observations simulées éprouvent la chaîne d'analyse, non la thèse. Elles ne fixent jamais de résultat de retrait, quel que soit le protocole.
- La dimensionnalité effective est une propriété d'une matrice de distances. Ce n'est un degré de rien de phénoménal (interdictions 1 et 2).
- Le document II §6.3 énonce sa prédiction sur des matrices **phénoménales**, issues de jugements de similarité. ASTRA calcule la même statistique sur des réponses de substrat. La recevabilité de cette transposition est soumise aux relecteurs (question C8 de `REVIEW.md`).
- La critique du délai intéroceptif porte sur une famille de prédicteurs, non sur les organismes.

## 6. Références

Tous les DOI ont été résolus sur Crossref le 20 octobre 2026. Kriegeskorte et al. (2008) figure déjà dans `src/engine/fcs/references.ts`.

- Collins, D. F., Refshauge, K. M., Todd, G., & Gandevia, S. C. (2005). Cutaneous receptors contribute to kinesthesia at the index finger, elbow, and knee. *Journal of Neurophysiology*, 94, 1699–1706. https://doi.org/10.1152/jn.00191.2005
- Damasio, A., & Carvalho, G. B. (2013). The nature of feelings: evolutionary and neurobiological origins. *Nature Reviews Neuroscience*, 14(2), 143–152. https://doi.org/10.1038/nrn3403
- Edin, B. B., & Johansson, N. (1995). Skin strain patterns provide kinaesthetic information to the human central nervous system. *The Journal of Physiology*, 487, 243–251. https://doi.org/10.1113/jphysiol.1995.sp020875
- Gao, P., & Ganguli, S. (2015). On simplicity and complexity in the brave new world of large-scale neuroscience. *Current Opinion in Neurobiology*, 32, 148–155. https://doi.org/10.1016/j.conb.2015.04.003
- Kim, Y., et al. (2018). A bioinspired flexible organic artificial afferent nerve. *Science*, 360(6392), 998–1003. https://doi.org/10.1126/science.aao0098
- Kriegeskorte, N., Mur, M., & Bandettini, P. (2008). Representational similarity analysis – connecting the branches of systems neuroscience. *Frontiers in Systems Neuroscience*, 2, 4. https://doi.org/10.3389/neuro.06.004.2008
- Lakens, D. (2017). Equivalence tests: A practical primer for t tests, correlations, and meta-analyses. *Social Psychological and Personality Science*, 8(4), 355–362. https://doi.org/10.1177/1948550617697177
- Proske, U., & Gandevia, S. C. (2012). The proprioceptive senses. *Physiological Reviews*, 92(4), 1651–1697. https://doi.org/10.1152/physrev.00048.2011
- Seth, A. K. (2013). Interoceptive inference, emotion, and the embodied self. *Trends in Cognitive Sciences*, 17(11), 565–573. https://doi.org/10.1016/j.tics.2013.09.007
- Torgerson, W. S. (1952). Multidimensional scaling: I. Theory and method. *Psychometrika*, 17(4), 401–419. https://doi.org/10.1007/BF02288916
- von Holst, E., & Mittelstaedt, H. (1950). Das Reafferenzprinzip. *Naturwissenschaften*, 37(20), 464–476. https://doi.org/10.1007/BF00622503
- Vriens, J., Nilius, B., & Voets, T. (2014). Peripheral thermosensation in mammals. *Nature Reviews Neuroscience*, 15(9), 573–589. https://doi.org/10.1038/nrn3784
- Wolpert, D. M., Ghahramani, Z., & Jordan, M. I. (1995). An internal model for sensorimotor integration. *Science*, 269(5232), 1880–1882. https://doi.org/10.1126/science.7569931
- Woo, S.-H., et al. (2015). Piezo2 is the principal mechanotransduction channel for proprioception. *Nature Neuroscience*, 18(12), 1756–1762. https://doi.org/10.1038/nn.4162
