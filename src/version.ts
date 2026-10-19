/**
 * ASTRA — Version unique (source de vérité)
 * © 2026 Christophe Jean Legros — Geneva
 *
 * Doit rester synchronisée avec package.json "version".
 * Consommée par server.ts, sse-server.ts et http-server.ts afin
 * d'éliminer les chaînes de version divergentes (2.0.0 / 2.2.0 / 2.9.0).
 *
 * v3.3.0-rc.3 — the name and the definition join the version here (ASTRA_IDENTITY);
 * `check:identity` now also tests the name. Counts unchanged.
 * v3.3.0-rc.2 — corrections of rc.1 after critical review (REVUE-v3.3.0-rc.1.md); counts unchanged.
 *
 * v3.2.0 — `scripts/check-identity.mjs` (npm run check:identity, CI) vérifie
 * que package.json, package-lock.json, CITATION.cff, .zenodo.json, le
 * gate CI, README.md, REVIEW.md et CHANGELOG.md portent la même version et
 * les mêmes effectifs que ce fichier. Le nom du dépôt GitHub (…-FCS-v3.1.0)
 * n'est PAS un identifiant de version : voir RELEASE.md.
 */
export const ASTRA_VERSION = '3.3.0-rc.3';

/**
 * Effectifs MCP attendus. Les effectifs réels sont comptés à l'enregistrement
 * (lint-guard.ts → capabilityCounts) ; les tests et le gate CI comparent les
 * deux, et check-identity compare la documentation à ces valeurs.
 */
export const EXPECTED_CAPABILITIES = Object.freeze({ tools: 75, resources: 16, prompts: 10 });

/**
 * Identity of the cited object: name, expansion and definition (v3.3.0-rc.3).
 *
 * One source of truth, as for the version. `scripts/check-identity.mjs` checks that:
 *   · the expansion, stripped of its declared function words, is exactly the
 *     sequence of `initials`, and their first letters spell `acronym`
 *     (a multi-word unit such as « Agent Orchestré » is declared as one unit,
 *     so the reading the acronym requires is stated, not assumed);
 *   · README.md, package.json, CITATION.cff, .zenodo.json and the dashboard carry
 *     the current name, and the withdrawn expansions appear only where their
 *     withdrawal is recorded;
 *   · the name, the definitions and the summaries clear `lintClaim` and `lintFcs`,
 *     and the name contains no term of the phenomenal vocabulary
 *     (teleology `PHENOMENAL_TERMS`), which the withdrawn expansions do contain.
 *
 * Expansions: EN chosen after the naming analysis of 19 October 2026 (Access, in
 * the sense of Block 1995, replaces Awareness); FR as stated by the author.
 */
export const ASTRA_IDENTITY = deepFreeze({
  acronym: 'ASTRA',
  /** Canonical identifier for citation and indexing (disambiguates from other "ASTRA" software). */
  id: 'ASTRA-FCS',
  name: {
    en: 'Agent-orchestrated Simulation Testbed for Research on Access',
    fr: "Agent Orchestré de Simulation et Test de Recherche sur l'Access",
  },
  initials: {
    en: ['Agent-orchestrated', 'Simulation', 'Testbed', 'Research', 'Access'],
    fr: ['Agent Orchestré', 'Simulation', 'Test', 'Recherche', 'Access'],
  },
  functionWords: {
    en: ['for', 'on'],
    fr: ['de', 'et', 'sur', "l'"],
  },
  definition: {
    en: 'ASTRA-FCS is a research instrument — an MCP server orchestrated by agents — that simulates neural ' +
      'substrates (spiking networks, organoid surrogates) and analyses their functional correlates of access, ' +
      "in Block's (1995) sense, under substrate constraints. Its indices are declared proxies, not " +
      'measurements, and its models are confronted with real data under preregistered protocols. It ' +
      'evaluates, under explicit constraints, the ends assigned to it, having none of its own, and it ' +
      'neither measures, detects nor attributes phenomenal consciousness.',
    fr: "ASTRA-FCS est un instrument de recherche — un serveur MCP orchestré par des agents — qui simule des " +
      "substrats neuronaux (réseaux impulsionnels, substituts d'organoïdes) et en analyse les corrélats " +
      "fonctionnels de l'accès, au sens de Block (1995), sous la contrainte du substrat. Ses indices sont des " +
      "proxys déclarés, non des mesures, et ses modèles sont confrontés à des données réelles selon des " +
      "protocoles préenregistrés. Il évalue sous contraintes explicites les fins qu'on lui assigne, sans en " +
      "avoir de propres, et il ne mesure, ne détecte ni n'attribue aucune conscience phénoménale.",
  },
  summary: {
    en: 'Agent-orchestrated MCP testbed for simulating and auditing functional correlates of access under ' +
      'substrate constraints — proxies, not measurements.',
    fr: "Banc d'essai MCP orchestré par des agents : simulation et audit des corrélats fonctionnels de " +
      "l'accès sous contrainte de substrat — proxys, non mesures.",
  },
  withdrawn: [
    {
      expansion: 'Autonomous Sentient Thoughtful Reasoning Agent',
      withdrawnIn: '3.1.0',
      reason: 'Claimed sentience; "Autonomous" and "Agent" were false as well (no actuator).',
    },
    {
      expansion: 'Agent-orchestrated Simulation Testbed for Research on Awareness',
      withdrawnIn: '3.3.0-rc.3',
      reason: '"Awareness" is read as phenomenal consciousness in clinical usage and is rejected by the ' +
        "project's own phenomenal vocabulary (teleology PHENOMENAL_TERMS).",
    },
  ],
} as const);

function deepFreeze<T>(o: T): T {
  if (o && typeof o === 'object') {
    for (const v of Object.values(o as Record<string, unknown>)) deepFreeze(v);
    Object.freeze(o);
  }
  return o;
}
