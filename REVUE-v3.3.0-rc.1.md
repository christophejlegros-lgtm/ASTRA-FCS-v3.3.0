# Revue critique de la v3.3.0-rc.1 et corrections appliquées (v3.3.0-rc.2)

**Objet examiné.** Archive `ASTRA-FCS-v3.3.0-rc.1.zip` (448 fichiers) et document
d'accompagnement `AT.pdf`, « ASTRA : téléologie fonctionnelle du résultat et utilité sous
contraintes » (6 pages, contenu identique à `TELEOLOGY.fr.md` de la rc.1).
**Objet produit.** ASTRA v3.3.0-rc.2, vérifiable par `MANIFEST.sha256`.
**Date.** 19 octobre 2026.
**Nature.** Revue et corrections réalisées avec l'assistance d'un système d'IA. Ce document
n'est ni une revue externe ni une évaluation par les pairs, et ne compte pas comme telle
(`REVIEW.md`).

© Genève 2026 Christophe Jean Legros · Assistance Multi IA

---

## 1. Jugement d'ensemble

La rc.1 est recevable comme instrument de **décision conditionnelle**. Elle évalue des
résultats déclarés au regard de fins déclarées, et elle le fait sous trois disciplines
justes :

- les contraintes passent avant la valeur ;
- l'absence ou le recouvrement de preuve reste `unknown` ;
- aucun classement total n'est imposé.

Le texte est d'une probité remarquable sur ses limites : provenance déclarée et non
vérifiée, bornes qui ne sont pas des intervalles de confiance, contrat vide, absence
d'horodatage opposable.

Son défaut principal tient à l'écart entre ce que le texte **affirme** et ce que le code
**fait**. Trois règles de portée épistémique y sont énoncées sans être appliquées, alors
que le programme FCS a précisément pour méthode de les rendre exécutables :

1. aucun rang ordinal dans l'utilité ;
2. aucune fin portant sur la phénoménalité ;
3. le garde-fou sur ce que l'extension énonce.

S'y ajoutent une lecture inexacte de Cummins, des formules non rendues dans le PDF et
des métadonnées citables partiellement faussées.

Tous les contrôles automatiques de la rc.1 passaient (401/401 tests, identité, fichiers
gelés, manifeste, référence dorée, bancs empiriques), **et pourtant** ces écarts étaient
présents. Le constat vaut pour la méthode : un contrôle vert ne prouve que ce qu'il teste.

## 2. Vérification de l'archive telle que reçue

Re-exécution indépendante de l'auto-déclaration de `validation/TELEOLOGY-VALIDATION.json`,
qui mentionnait Node 24.19, `npm ci` non relancé et la matrice CI non exécutée. Les
contrôles ont été conduits sous Node 22.22, avec Python 3.13, h5py et numpy.

| Contrôle | Résultat sur la rc.1 |
|---|---|
| `npm ci` · `npm run build` · `npm run lint` | succès · 0 erreur · 0 erreur |
| `npm test` (CLI tsx) | 401 / 401 · 78 suites |
| `check:identity` · `check:frozen` · `manifest:check` | cohérent · 12/12 inchangés · 447 fichiers vérifiés |
| `golden:check` · `test_confront.py --strict` · `test_e3.py` | à jour · 17 PASS · 22 PASS |
| smoke stdio | `v3.3.0-rc.1: 75 tools · 16 resources · 10 prompts` |

## 3. Constats sur le code

**F1 — L'interdiction 4 est annoncée (§6) mais non appliquée (majeur).** Le texte dit qu'il
« ne faut pas introduire les rangs ordinaux FCS dans cette formule ». Or un contrat dont le
critère a l'unité `stratum` et un terme d'utilité est accepté : pour une valeur 3 et des
ancres 0 → 8, le module rend U = 0,375. Le test d'unité ordinale existe déjà dans le dépôt
(`mayAggregate`, `negative-heuristic.ts`) ; il n'était pas appelé.

**F2 — Les interdictions 1 et 2 sont annoncées (§10) mais non appliquées (majeur).** Un
contrat dont le critère s'intitule `consciousness_level` et se décrit comme « Degree of
consciousness of ASTRA » est évalué `met`, et le rapport franchit le garde-fou. Deux raisons
à cela : l'identifiant à tiret bas échappe aux motifs du linter, et la description n'est
jamais restituée. La phrase « l'extension n'emploie ni l'utilité ni l'atteinte des buts
comme mesure de phénoménalité » décrivait une intention, non une propriété.

**F3 — La finalité échappait au garde-fou (majeur).** `purpose`, `function` et `owner` ne
figuraient pas dans les rapports. Le garde-fou n'examinant que les sorties, une finalité
rédigée comme « Prove that ASTRA is conscious » passait sans examen.

**F4 — L'admissibilité du contrat vide n'était pas signalée (modéré).** Le texte précise
qu'elle « ne certifie aucune sécurité générale », mais le rapport ne le disait pas : il
portait `admissible` sans autre marque.

**F5 — L'exemple n'était pas contrôlé (modéré).** Le texte affirme que
`comparison-output.json` est « calculé par le module compilé », mais rien ne garantissait
que le fichier enregistré corresponde au calcul courant.

**Points corrects, vérifiés.**

- La sémantique trivalente, égalité au seuil comprise, est correctement implémentée.
- Les règles d'admissibilité et d'atteinte sont séparées, et une contrainte violée annule
  l'utilité.
- La dominance d'intervalles est correcte : elle est transitive, et une égalité ne crée
  aucune dominance.
- Le refus de mélanger les provenances est correct.
- La validation stricte des schémas (champs inconnus, unités, contextes, intervalles
  inversés, identifiants) est correcte.

## 4. Constats sur les métadonnées et l'identité de l'objet

**F6 — Attribution historique faussée dans les métadonnées citables (majeur).**
`CITATION.cff` et `.zenodo.json` indiquaient que les proxys sont « checked by validation
controls (v3.3.0-rc.1) ». Ces contrôles datent de la v3.2.0 : un remplacement aveugle de la
chaîne de version a réécrit l'histoire. Le résumé ne mentionnait pas non plus l'extension.

**F7 — Date de publication périmée (modéré).** `date-released: 2026-10-09` est la date de
la v3.2.0, alors que la version est passée à rc.1.

**F8 — README incohérent (modéré).** Quatre problèmes :

- une section en français était insérée au-dessus du sous-titre ;
- la table des familles n'était pas mise à jour (12 + 60 = 72, alors que l'en-tête
  annonçait 75) ;
- des effectifs étaient périmés (diagramme, annotations, fabrique : 72 ; tests : 393) ;
- l'ancre `#mcp-tools-70` était cassée.

`check:identity` ne contrôle pas ces passages ; ils exigent une relecture.

**F9 — L'extension échappait au protocole de relecture (modéré).** `REVIEW.md` ne posait
aucune question sur elle.

**F10–F11 — Défauts mineurs.**

- Le commentaire de la CI listait des effectifs sans les trois nouveaux outils.
- Les annotations étaient rangées sous le commentaire « Proxy validation ».
- Les nouveaux fichiers n'avaient pas d'en-tête.
- `scripts/verify-anteriority.sh` avait perdu son bit d'exécution (100755 → 100644).

**F12 — Deux objets pour une même ligne de version (décision de l'auteur).** Une v3.3.0
distincte a été livrée plus tôt le même jour. Elle comporte une autre couche téléologique,
`telos_*` (79 outils), dans `TELOS-INTEGRATION.fr.md` / `.en.md`. Selon `RELEASE.md`, un
identifiant désigne un seul objet. Selon SemVer, une `3.3.0-rc.N` est une candidate à
**la** 3.3.0. Si les deux arbres circulent, « 3.3.0 » et « 3.3.0-rc.N » désignent des
conceptions différentes, ce que la consolidation du 9 octobre a voulu rendre impossible.
Trois issues sont possibles :

- **(a)** fusionner les deux extensions dans une 3.3.0 unique. Elles sont
  complémentaires : contrat déclaratif sur résultats rapportés d'un côté, délibération
  contrefactuelle et registre de résultats de l'autre ;
- **(b)** renuméroter l'une, par exemple 3.4.0 ;
- **(c)** en abandonner une.

Rien n'est tranché ici. La présente archive est numérotée **3.3.0-rc.2** parce qu'elle
corrige la rc.1 et qu'un identifiant publié ne se réutilise pas.

## 5. Constats sur le texte (AT.pdf / `TELEOLOGY.fr.md`)

**T1 — Cummins est mal situé (conceptuel, majeur).** L'analyse fonctionnelle de Cummins
(1975) relève des conceptions **systémiques**, non téléologiques, de la fonction. Elle a été
proposée en rupture avec la lecture reçue (Hempel, Nagel), selon laquelle attribuer une
fonction expliquerait la présence de l'élément. Elle est relative à la capacité que
l'analyste choisit d'expliquer.

La rc.1 la présente sans le dire comme l'un des deux « fondements » d'une « téléologie
fonctionnelle ». Le lecteur peut alors confondre :

- la fonction systémique (Cummins) ;
- la fonction étiologique (Wright 1973) ;
- la fonction de conception attribuée, celle que l'extension emploie réellement.

La correction situe la « fonction assignée » comme fonction de conception, attribuée, que
l'analyse de Cummins sert à **évaluer** et non à fonder. La finalité reste attribuée de part
en part.

**T2 — Formules non rendues (éditorial, majeur pour un document académique).** Dans le PDF,
les §3 et §6 affichent le source LaTeX brut (`\qquad`, `\mid`, `\operatorname{clip}`). Les
formules sont réécrites en notation Unicode, qui se rend à l'identique en Markdown, en
LibreOffice et en PDF.

**T3 — L'enveloppe d'utilité est exacte, non seulement conservatrice (précision).** U est
additive et monotone par terme. Ses bornes sur le pavé des intervalles déclarés sont donc
atteintes en un sommet du pavé : elles sont **exactes**. Elles ne deviennent conservatrices
que relativement à une information conjointe (dépendance entre dimensions) dont le pavé ne
tient pas compte.

**T4 — Appareil bibliographique (références).** Trois points :

- Cummins était cité par un lien vers une copie hébergée sur une page de cours, sans DOI. La
  notice PhilPapers donne la pagination 741–764, d'autres notices 741–765. Aucun DOI n'a pu
  être vérifié le 19 octobre 2026 : aucun n'est indiqué.
- Le DOI de Rosenblueth, Wiener et Bigelow est conservé ; il n'est attesté que par une copie
  archivée, et son statut est déclaré.
- Wright (1973) est ajouté pour la distinction de T1.

**Points forts, conservés.**

- La table des distinctions (but, fonction assignée, mécanisme, résultat, efficacité,
  efficience, utilité, admissibilité) et les erreurs qu'elle prévient.
- La lecture de « fonction utilitaire » comme pluralisme sous contraintes plutôt que comme
  utilitarisme moral.
- L'articulation prudente avec le FCS (R = F(S, A, E, I) comme relation de recherche, non
  comme loi estimée).
- Le programme empirique en sept étapes et les objections.

## 6. Corrections appliquées (rc.2)

| # | Correction | Fichiers |
|---|---|---|
| F1 | Un terme d'utilité visant un critère d'unité ordinale fait refuser le contrat. Le test est celui de l'interdiction 4 (`isOrdinalUnit`, exporté) ; seuils et Pareto restent permis. | `src/engine/teleology/index.ts`, `src/engine/fcs/negative-heuristic.ts` |
| F2 | Un critère ou une contrainte dont l'identifiant, la description ou l'unité nomme la conscience, la sentience ou la phénoménalité fait refuser le contrat (interdictions 1–2). | idem |
| F3 | Chaque rapport restitue `purpose`, `function`, `owner`, que le garde-fou examine désormais. Une finalité qui affirme la conscience d'ASTRA est bloquée (`LINT_FAILED`). | idem, `src/server-teleology-tools.ts` |
| F4 | `admissibilityBasis` (`declared-constraints` / `empty-contract`) et `constraintsDeclared`. L'interprétation le rappelle pour le contrat vide. | idem |
| F5 | `replay.mjs --check`, un test qui compare le rapport enregistré au calcul, et une étape de CI. | `examples/teleology/`, `tests/teleology.test.ts`, `ci.yml` |
| F6–F7 | Attribution « (v3.2.0) » restaurée ; résumé complété ; date mise à jour. | `CITATION.cff`, `.zenodo.json` |
| F8 | Section v3.3.0-rc.2 en anglais, avec lien vers le texte français ; table des familles (63) ; effectifs ; ancre. | `README.md` |
| F9 | Questions B7 (sémantique d'intervalles) et C7 (cohérence philosophique). | `REVIEW.md` |
| F10–F11 | Commentaire CI, rangement des annotations, en-têtes, bit d'exécution. | divers |
| T1–T4 | Lecture de Cummins, formules Unicode, enveloppe exacte, appareil ; encart de révision. | `TELEOLOGY.fr.md` |

Le module garde sa surface (75 outils, 16 ressources, 10 prompts) et son API (`assess`,
`compare`). Deux catégories de contrats, auparavant acceptées, sont désormais refusées :
ceux qui somment un critère ordinal, et ceux qui portent sur la phénoménalité. Les sorties
gagnent cinq champs (`purpose`, `function`, `owner`, `admissibilityBasis`,
`constraintsDeclared`). Le refus est volontairement étroit : un mot comme « awareness » dans
un critère légitime (« situational awareness ») le déclenche aussi, et une reformulation
suffit.

## 7. Recommandations non appliquées (décisions de l'auteur)

- **R1.** Joindre aux rapports une empreinte SHA-256 du contrat canonique. Cela rendrait
  vérifiable l'injonction de « figer le contrat » ; ce n'est pas une preuve d'antériorité.
- **R2.** Revoir la tolérance de somme des poids (10⁻⁹). Trois poids saisis comme 0,333333
  sont refusés ; préférer 10⁻⁶ ou une normalisation déclarée.
- **R3.** Étendre le refus aux **proxys** de conscience comme buts (Φ̃, GW̃, PAD̃, ignition).
  Optimiser un proxy dont les contrôles de validation montrent les défauts est le cas
  d'école de Goodhart. La rc.1 ne l'interdit pas.
- **R4.** Fournir l'analyse de sensibilité aux ancres et aux poids que le texte demande (§6,
  §9.5), par exemple une acceptabilité stochastique sur le simplexe des poids.
- **R5.** Version anglaise de `TELEOLOGY.fr.md`, le dépôt étant bilingue.
- **R6.** Résoudre F12 avant tout marquage.

## 8. Vérifications après correction

Les chiffres de vérification de la rc.2 sont ceux de `validation/RC2-VERIFICATION.json`,
produit par la même session ; le journal complet est `validation/teleology-tests.txt`.

Sources consultées pour l'appareil : notice PhilPapers de Cummins (1975),
<https://philpapers.org/rec/CUMFA> ; notice PhilArchive de Rosenblueth, Wiener et
Bigelow (1943), <https://dc2.philarchive.org/rec/ROSBPA> ; notice PhilPapers de Wright
(1973), <https://philpapers.org/rec/WRIF>.
