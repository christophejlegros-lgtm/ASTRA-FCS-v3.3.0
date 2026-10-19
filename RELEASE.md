# Publier une version immuable · Publishing an immutable release

*v3.2.0 — point 1 du programme minimal de consolidation : « publier une version immuable
dont archive, package, documents et citation portent une identification cohérente ; relier
chaque résultat au commit effectivement utilisé ».*

## 1. Le constat de départ · The starting point

L'archive analysée le 9 octobre 2026 s'appelait `…-FCS-v3.1.0-main.zip` alors que
`package.json` et `src/version.ts` déclaraient 3.1.1, et `REVIEW.md` « ASTRA-FCS v3.1.0 ».
Trois causes : le **nom du dépôt** contient un numéro de version ; une archive de branche
(`-main.zip`) n'est pas une version ; plusieurs fichiers répétaient la version à la main.

Mesures prises en v3.2.0 :
- une **source unique** : `src/version.ts` (`ASTRA_VERSION`, `EXPECTED_CAPABILITIES`) ;
- un **gate** : `npm run check:identity` (CI, et `tests/identity.test.ts`) échoue si
  `package.json`, `package-lock.json`, `CITATION.cff`, `.zenodo.json`, le gate CI,
  `README.md`, `REVIEW.md` ou `CHANGELOG.md` divergent ;
- des **effectifs comptés** à l'enregistrement (`capabilityCounts`), non saisis à la main ;
- un **manifeste** `MANIFEST.sha256` de tous les fichiers, vérifiable par quiconque.

**Recommandation (action de l'auteur).** Renommer le dépôt GitHub en un nom sans numéro de
version, par exemple `ASTRA-Unified-ResearchLab-MCP-FCS`. GitHub redirige l'ancien nom ;
mettre ensuite à jour `repository-code` dans `CITATION.cff`, les liens du README et de
`REVIEW.md`. Tant que ce n'est pas fait, `check:identity` affiche une notice.

## 2. Procédure · Procedure

```bash
# 0. arbre propre, sur main
git status --porcelain            # doit être vide

# 1. version unique
#    src/version.ts, package.json (npm version --no-git-tag-version x.y.z), CITATION.cff
#    (version, date-released = date du tag), .zenodo.json, CHANGELOG.md, README (marqueur
#    <!-- astra-current-version: x.y.z -->), REVIEW.md, ci.yml (chaîne du smoke test)
npm run check:identity

# 2. vérifications complètes
npm ci && npm run build && npm run lint && npm test
npm run golden:check && python3 empirical/test_confront.py --strict && python3 empirical/test_e3.py
npm run check:frozen

# 3. manifeste, puis commit
npm run manifest && npm run manifest:check
git add -A && git commit -m "release: vX.Y.Z"

# 4. étiquette signée — jamais déplacée ni réutilisée
git tag -s vX.Y.Z -m "ASTRA vX.Y.Z"
git push origin main --tags
```

La CI vérifie `manifest:check` sur les étiquettes. Une étiquette publiée n'est **jamais**
déplacée : une correction devient une nouvelle version.

## 3. Archive et DOI · Archive and DOI

1. Créer la *release* GitHub depuis l'étiquette ; l'intégration Zenodo archive l'arbre
   étiqueté et attribue un **DOI de version** (distinct du DOI de concept).
2. Inscrire ce DOI de version dans `CITATION.cff` (`identifiers`) et dans le README, dans
   un commit postérieur (la version déposée ne peut pas contenir son propre DOI).
3. Calculer et publier l'empreinte de l'archive déposée : `sha256sum <archive>.zip`.
4. Citer toujours le DOI **de la version utilisée**, avec l'empreinte de `MANIFEST.sha256`.

## 4. Antériorité des pré-enregistrements · Anteriority of preregistrations

Un commit public ne prouve pas une date : son horodatage est déclaratif. Pour E3 et H1–H3 :
1. compléter le brouillon jusqu'à ce que `npm run prereg:check` passe ;
2. le **déposer** sur un registre horodaté (OSF Registries) ou sur Zenodo, *avant* tout
   accès aux données, puis remplacer la ligne de statut par la référence du dépôt ;
3. à défaut, publier au moins l'empreinte SHA-256 (LF) du fichier par un horodatage tiers
   (jeton RFC 3161, preuve OpenTimestamps) ;
4. consigner la référence dans `empirical/PROVENANCE.md`.

Pour E1 et E2, `bash scripts/verify-anteriority.sh` (dans un clone du dépôt **d'origine**
`ASTRA-Unified-ResearchLab-MCP-FCS-v3.1.0` ; le dépôt `ASTRA-FCS-v3.3.0`, créé en un seul
commit, ne porte pas cet historique — `empirical/PROVENANCE.md` §2bis) contrôle
l'empreinte au commit d'ajout et l'ordre dans l'historique ; il signale lui-même qu'il ne
prouve pas l'antériorité calendaire.
