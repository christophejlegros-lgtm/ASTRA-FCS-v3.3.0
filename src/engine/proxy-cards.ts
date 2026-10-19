/**
 * ASTRA — Proxy cards (v3.2.0)
 * ════════════════════════════
 * Programme minimal de consolidation, point 3: « pour chaque métrique,
 * préciser construit, formule, invariances et domaine d'emploi ».
 *
 * One card per computed proxy. A card states what the number is a function
 * of, exactly; what it is named after; which invariances hold (each checked
 * by a control of ./proxy-validation.ts, cited by id); where it may be used;
 * and which inferences it does not license. A symbol borrowed from a theory
 * (Φ̃, GW̃, PAD̃) transmits none of that theory's properties to the proxy.
 *
 * Served as the MCP resource `astra://proxies/cards`.
 *
 * © 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
 */

import type { Provenance } from './tcai/phenomenal-guard.js';

export type ProxyKind = 'descriptive-statistic' | 'engineering-index' | 'heuristic';

export interface ProxyCard {
  id: string;
  symbol: string;
  module: string;
  kind: ProxyKind;
  /** The theory the name is borrowed from. Naming is not modelling. */
  namedAfterEn: string;
  constructEn: string;
  constructFr: string;
  /** Exact formula, as implemented. */
  formula: string;
  range: string;
  inputs: Array<{ name: string; provenance: Provenance; noteEn: string }>;
  invariances: Array<{ propertyEn: string; holds: boolean; checkedBy: string | null }>;
  domainEn: string;
  domainFr: string;
  notLicensedEn: string[];
  notLicensedFr: string[];
  knownDefectsEn: string[];
  knownDefectsFr: string[];
  /** Statuses this proxy can return (see MeasurementStatus in ./tcai/metrics.ts). */
  statuses: string[];
}

const COMMON_NOT_LICENSED_EN = 'Any statement about experience: the proxy is defined by its formula (Block 1995, doi:10.1017/S0140525X00038188).';
const COMMON_NOT_LICENSED_FR = 'Tout énoncé sur l\'expérience : le proxy est défini par sa formule (Block 1995, doi:10.1017/S0140525X00038188).';

export const PROXY_CARDS: readonly ProxyCard[] = Object.freeze([
  {
    id: 'tcai.phiRIIU', symbol: 'Φ̃-RIIU', module: 'src/engine/tcai/metrics.ts (RIIUPhi)', kind: 'descriptive-statistic',
    namedAfterEn: 'Integrated information theory (Tononi); upstream learned surrogate AutoPhiSurrogate.',
    constructEn: 'Statistical dependence among the coordinates of the broadcast vector over a sliding buffer.',
    constructFr: 'Dépendance statistique entre coordonnées du vecteur diffusé, sur un tampon glissant.',
    formula: 'C = population covariance of the buffer (divisor n); Φ̃ = Σ_{a≠b}|C_ab| / (Σ_a|C_aa| + Σ_{a≠b}|C_ab|). L1 share of absolute covariances — no square is taken.',
    range: '[0, 1]; legacy API returns 0 when not computable',
    inputs: [{ name: 'workspace broadcast vector (d = 64), buffer n = 64, warm-up 8', provenance: 'endogenous', noteEn: 'Produced by ASTRA\'s own workspace.' }],
    invariances: [
      { propertyEn: 'permutation of coordinates', holds: true, checkedBy: 'R6' },
      { propertyEn: 'translation of coordinates', holds: true, checkedBy: 'R6' },
      { propertyEn: 'rescaling of one coordinate', holds: false, checkedBy: 'R5L' },
      { propertyEn: 'separates a common source from interaction', holds: false, checkedBy: 'R2' },
    ],
    domainEn: 'Comparisons of the SAME pipeline at the same n and d, read against the witness band of proxy_validate (R1).',
    domainFr: 'Comparaisons d\'une MÊME chaîne à n et d égaux, lues contre la bande témoin de proxy_validate (R1).',
    notLicensedEn: [
      'Approximation of any IIT quantity with a controlled error.',
      'Integration among components: a single common source raises it (R2).',
      'Comparison across systems or across encodings of the latent space.',
      COMMON_NOT_LICENSED_EN,
    ],
    notLicensedFr: [
      'Approximation d\'une quantité de l\'IIT avec une erreur contrôlée.',
      'Intégration entre composantes : une source commune unique l\'élève (R2).',
      'Comparaison entre systèmes ou entre codages de l\'espace latent.',
      COMMON_NOT_LICENSED_FR,
    ],
    knownDefectsEn: [
      'Positive witness level that rises with d: ≈ 0.86 on independent noise at the deployed d = n = 64 (R1); the informative range is the narrow band above it.',
      'Scale-dependent (R5). Use correlationShare for a scale-free reading, residualShare as common-source control.',
    ],
    knownDefectsFr: [
      'Niveau témoin positif croissant avec d : ≈ 0,86 sur bruit indépendant au d = n = 64 déployé (R1) ; la plage informative est l\'étroite bande au-dessus.',
      'Sensible à l\'échelle (R5). Utiliser correlationShare pour une lecture sans échelle, residualShare comme contrôle de source commune.',
    ],
    statuses: ['value', 'null-result', 'not-measured', 'insufficient-sample', 'degenerate'],
  },
  {
    id: 'tcai.phiRIIU.correlationShare', symbol: 'Φ̃-RIIU (corr.)', module: 'src/engine/tcai/metrics.ts (riiuCorrelationShare)', kind: 'descriptive-statistic',
    namedAfterEn: 'Scale-free variant introduced in v3.2.0; not an upstream quantity.',
    constructEn: 'Same share computed on the correlation matrix of the coordinates that vary.',
    constructFr: 'Même part calculée sur la matrice de corrélation des coordonnées qui varient.',
    formula: 'Φ̃_r = Σ_{a≠b}|r_ab| / (k + Σ_{a≠b}|r_ab|), over the k coordinates with non-zero variance.',
    range: '[0, 1]; null when fewer than two coordinates vary',
    inputs: [{ name: 'same buffer as Φ̃-RIIU', provenance: 'derived', noteEn: 'Deterministic function of the buffer.' }],
    invariances: [
      { propertyEn: 'rescaling of any coordinate', holds: true, checkedBy: 'R5' },
      { propertyEn: 'permutation and translation', holds: true, checkedBy: 'R6' },
      { propertyEn: 'separates a common source from interaction', holds: false, checkedBy: 'R2' },
    ],
    domainEn: 'As Φ̃-RIIU, without dependence on the units of the latent coordinates.',
    domainFr: 'Comme Φ̃-RIIU, sans dépendance aux unités des coordonnées latentes.',
    notLicensedEn: ['Integration among components (common source, R2).', COMMON_NOT_LICENSED_EN],
    notLicensedFr: ['Intégration entre composantes (source commune, R2).', COMMON_NOT_LICENSED_FR],
    knownDefectsEn: ['Same positive witness level as the L1 share.'],
    knownDefectsFr: ['Même niveau témoin positif que la part L1.'],
    statuses: ['value', 'degenerate'],
  },
  {
    id: 'tcai.phiRIIU.residualShare', symbol: 'Φ̃-RIIU (resid.)', module: 'src/engine/tcai/metrics.ts (riiuResidualShare)', kind: 'descriptive-statistic',
    namedAfterEn: 'Common-source control introduced in v3.2.0.',
    constructEn: 'Dependence left once the leading principal component of the correlation matrix is projected out.',
    constructFr: 'Dépendance restante une fois projetée hors la première composante principale de la matrice de corrélation.',
    formula: 'Standardise coordinates; v = leading eigenvector of their correlation matrix (power iteration, 200 steps, start 1/√k); residual = z − (z·v)v; Φ̃_res = correlation share of the residuals.',
    range: '[0, 1]; null when fewer than three coordinates vary',
    inputs: [{ name: 'same buffer as Φ̃-RIIU', provenance: 'derived', noteEn: 'Deterministic function of the buffer.' }],
    invariances: [
      { propertyEn: 'removes most (not all) of the excess due to one common source', holds: true, checkedBy: 'R3' },
      { propertyEn: 'keeps dependence one factor does not explain, above the single-source band', holds: true, checkedBy: 'R4' },
    ],
    domainEn: 'Control for the raw share: compare it with the single-source residual band at the same n and d, not with the raw witness band.',
    domainFr: 'Contrôle de la part brute : la comparer à la bande résiduelle à source unique, à n et d égaux, non à la bande témoin brute.',
    notLicensedEn: ['That no common source acted (a residual can survive several common sources).', COMMON_NOT_LICENSED_EN],
    notLicensedFr: ['L\'absence de toute source commune (un résidu peut survivre à plusieurs sources communes).', COMMON_NOT_LICENSED_FR],
    knownDefectsEn: ['The projection itself induces small negative correlations: a single common source leaves a residual slightly ABOVE the independent-noise level, even for large n (independent review); its reference is the single-source band.', 'Weak separation when d is close to n. A factor-model partial correlation would be a cleaner control.'],
    knownDefectsFr: ['La projection induit elle-même de faibles corrélations négatives : une source commune unique laisse un résidu légèrement AU-DESSUS du niveau du bruit indépendant, même pour n grand (relecture indépendante) ; sa référence est la bande à source unique.', 'Séparation faible lorsque d approche n. Des corrélations partielles issues d\'un modèle factoriel seraient un contrôle plus propre.'],
    statuses: ['value', 'degenerate'],
  },
  {
    id: 'tcai.effectiveInformation', symbol: 'EI', module: 'src/engine/tcai/metrics.ts (computeEffectiveInformation, estimateEffectiveInformation)', kind: 'descriptive-statistic',
    namedAfterEn: 'Effective information (Hoel, Albantakis & Tononi 2013, doi:10.1073/pnas.1314922110).',
    constructEn: 'Determinism minus degeneracy of the transitions OBSERVED along the discretised ignition trajectory.',
    constructFr: 'Déterminisme moins dégénérescence des transitions OBSERVÉES le long de la trajectoire d\'ignition discrétisée.',
    formula: 'States: min–max discretisation into 8 bins. TPM rows from observed transitions; EI = H(mean of observed rows) − mean H(observed row), bits.',
    range: '[0, log2(8) = 3] bits',
    inputs: [{ name: 'ignition trajectory (≤ 512 points)', provenance: 'endogenous', noteEn: 'ASTRA\'s own workspace ignition values.' }],
    invariances: [
      { propertyEn: 'reaches 3 bits on a deterministic 8-cycle', holds: true, checkedBy: 'E1' },
      { propertyEn: 'unbiased on short trajectories', holds: false, checkedBy: 'E2' },
      { propertyEn: 'estimand independent of the sampling regime (unvisited states)', holds: false, checkedBy: 'E3' },
      { propertyEn: 'robust to one outlier in the window', holds: false, checkedBy: 'E5' },
    ],
    domainEn: 'Description of the observed transition structure, with coverage and transition counts reported (estimateEffectiveInformation).',
    domainFr: 'Description de la structure de transition observée, avec couverture et nombres de transitions rapportés (estimateEffectiveInformation).',
    notLicensedEn: [
      'Identification of the causal structure: no intervention is performed and unvisited states are omitted.',
      'Comparison between trajectories of different lengths without the witness band (E2).',
      COMMON_NOT_LICENSED_EN,
    ],
    notLicensedFr: [
      'Identification de la structure causale : aucune intervention n\'est réalisée et les états non visités sont omis.',
      'Comparaison entre trajectoires de longueurs différentes sans la bande témoin (E2).',
      COMMON_NOT_LICENSED_FR,
    ],
    knownDefectsEn: ['Upward plug-in bias: ≈ 1.3 bits on 32 i.i.d. points, ≈ 0.07 on 512 (E2).', 'Partition redrawn by the data (E5).'],
    knownDefectsFr: ['Biais de substitution positif : ≈ 1,3 bit sur 32 points i.i.d., ≈ 0,07 sur 512 (E2).', 'Partition redessinée par les données (E5).'],
    statuses: ['value', 'insufficient-sample', 'degenerate'],
  },
  {
    id: 'tcai.gnw', symbol: 'GNW metrics', module: 'src/engine/tcai/metrics.ts (GNWMetrics)', kind: 'descriptive-statistic',
    namedAfterEn: 'Global neuronal workspace (Dehaene & Changeux).',
    constructEn: 'Counts and rates of ASTRA workspace steps whose sigmoid ignition exceeds 0.5, and of broadcast steps.',
    constructFr: 'Comptes et taux des pas du workspace d\'ASTRA dont l\'ignition sigmoïde dépasse 0,5, et des pas de diffusion.',
    formula: 'ignitionRate = #{ignition ≥ 0.5}/steps; meanIgnition = Σ ignition / steps; broadcastAvailability = #{broadcast}/steps.',
    range: '[0, 1] each; 0 when steps = 0',
    inputs: [{ name: 'workspace competition', provenance: 'endogenous', noteEn: 'ASTRA\'s own sigmoid ignition.' }],
    invariances: [{ propertyEn: 'threshold-dependent (0.5 fixed by construction)', holds: true, checkedBy: null }],
    domainEn: 'Bookkeeping of a formal access-type mechanism implemented in ASTRA.',
    domainFr: 'Comptabilité d\'un mécanisme formel de type accès implémenté dans ASTRA.',
    notLicensedEn: ['That reproducing a broadcast mechanism suffices for experience (a candidate functional realisation, not evidence of it).', COMMON_NOT_LICENSED_EN],
    notLicensedFr: ['Que reproduire un mécanisme de diffusion suffise à l\'expérience (réalisation fonctionnelle candidate, non preuve).', COMMON_NOT_LICENSED_FR],
    knownDefectsEn: ['A zero rate with zero steps is an absence of measurement, not a null result.'],
    knownDefectsFr: ['Un taux nul pour zéro pas est une absence de mesure, non un résultat nul.'],
    statuses: ['value', 'not-measured'],
  },
  {
    id: 'tcai.workspace.phiProxy', symbol: 'Φ̃ (workspace)', module: 'src/engine/tcai/global-workspace.ts (phiProxy)', kind: 'heuristic',
    namedAfterEn: 'IIT, by name only.',
    constructEn: 'Spread of the broadcast vector blended with Kuramoto synchrony.',
    constructFr: 'Dispersion du vecteur diffusé mêlée à la synchronie de Kuramoto.',
    formula: 'clamp(0.6·tanh(4·SD(broadcast)) + 0.4·syncR, 0, 1).',
    range: '[0, 1]',
    inputs: [{ name: 'broadcast vector, syncR', provenance: 'endogenous', noteEn: 'ASTRA workspace.' }],
    invariances: [{ propertyEn: 'scale of the broadcast vector', holds: false, checkedBy: null }],
    domainEn: 'Internal gating signal of the workspace.',
    domainFr: 'Signal de régulation interne du workspace.',
    notLicensedEn: ['Any information-integration reading.', COMMON_NOT_LICENSED_EN],
    notLicensedFr: ['Toute lecture en termes d\'intégration d\'information.', COMMON_NOT_LICENSED_FR],
    knownDefectsEn: ['Conventional weights 0.6/0.4 and gain 4.'],
    knownDefectsFr: ['Poids conventionnels 0,6/0,4 et gain 4.'],
    statuses: ['value'],
  },
  {
    id: 'tcai.qualiaVector', symbol: 'qualia [I, V, C]', module: 'src/engine/tcai/global-workspace.ts (PhenomenologicalMapper)', kind: 'heuristic',
    namedAfterEn: 'Upstream "qualia mapper" — the name is the port\'s, not a claim of this repository.',
    constructEn: 'Norm, goal alignment and normalised spectral entropy of the broadcast vector.',
    constructFr: 'Norme, alignement sur le but et entropie spectrale normalisée du vecteur diffusé.',
    formula: 'I = tanh(‖b‖/√n); V = cos(b, goal); C = −Σ p log p / log n with p = |b_i|/Σ|b_j|.',
    range: 'I, C ∈ [0, 1]; V ∈ [−1, 1]',
    inputs: [{ name: 'broadcast vector, goal vector', provenance: 'endogenous', noteEn: 'ASTRA workspace.' }],
    invariances: [{ propertyEn: 'C invariant to a common rescaling of b', holds: true, checkedBy: null }],
    domainEn: 'Three descriptive features of a vector.',
    domainFr: 'Trois traits descriptifs d\'un vecteur.',
    notLicensedEn: ['Any phenomenal reading of the three numbers, whatever the field name.', COMMON_NOT_LICENSED_EN],
    notLicensedFr: ['Toute lecture phénoménale des trois nombres, quel que soit le nom du champ.', COMMON_NOT_LICENSED_FR],
    knownDefectsEn: ['Field name inherited from upstream.'],
    knownDefectsFr: ['Nom de champ hérité de l\'amont.'],
    statuses: ['value'],
  },
  {
    id: 'tcai.composite', symbol: 'TCAI composite', module: 'src/engine/tcai/acm-bridge.ts (report)', kind: 'engineering-index',
    namedAfterEn: 'upstream consciousness_metrics.py.',
    constructEn: 'Conventional weighted sum of four heterogeneous proxies.',
    constructFr: 'Somme pondérée conventionnelle de quatre proxys hétérogènes.',
    formula: 'clamp(0.35·meanIgnition + 0.25·Φ̃-RIIU + 0.2·EI/3 + 0.2·unity, 0, 1).',
    range: '[0, 1]',
    inputs: [{ name: 'GNW, Φ̃-RIIU, EI, workspace unity', provenance: 'derived', noteEn: 'Inherits every defect of its terms.' }],
    invariances: [],
    domainEn: 'Regression monitoring of the simulation only.',
    domainFr: 'Suivi de non-régression de la simulation seulement.',
    notLicensedEn: ['Ranking of systems; any degree reading (FCS prohibitions 1 and 4).', COMMON_NOT_LICENSED_EN],
    notLicensedFr: ['Classement de systèmes ; toute lecture en degré (interdictions FCS 1 et 4).', COMMON_NOT_LICENSED_FR],
    knownDefectsEn: ['Its Φ̃-RIIU term sits near 0.86 on noise at the deployed d (R1); its EI term is biased on short trajectories (E2).'],
    knownDefectsFr: ['Son terme Φ̃-RIIU vaut ≈ 0,86 sur du bruit au d déployé (R1) ; son terme EI est biaisé sur trajectoire courte (E2).'],
    statuses: ['value'],
  },
  {
    id: 'acm.integrationProxy', symbol: 'Φ̃ (ACM)', module: 'src/engine/acm.ts (integrationProxyOf)', kind: 'engineering-index',
    namedAfterEn: 'Integrated information theory, by name only.',
    constructEn: 'Weighted sum of participation, mean firing rate and synaptic-weight dispersion of the stepped SNN.',
    constructFr: 'Somme pondérée de la participation, du taux moyen et de la dispersion des poids du SNN pas à pas.',
    formula: 'raw = 0.5·activeFraction + 2.0·meanRate[Hz] + 0.3·(mean per-layer SD(w) / (mean per-layer mean(w) + 0.001)); value = clamp(raw, 0, 1).',
    range: '[0, 1] after clamping; raw unbounded',
    inputs: [
      { name: 'activeFraction', provenance: 'endogenous', noteEn: 'Share of neurons with rate > 0.1 Hz.' },
      { name: 'meanRateHz', provenance: 'endogenous', noteEn: 'Enters in Hz, unnormalised.' },
      { name: 'weightCV', provenance: 'endogenous', noteEn: 'Unbounded when mean weight ≈ 0.' },
    ],
    invariances: [{ propertyEn: 'falls when connectivity is removed', holds: false, checkedBy: 'A1' }],
    domainEn: 'None as a proxy of integration; retained for continuity of the engineering index, with status \'degenerate\' while clamped.',
    domainFr: 'Aucun comme proxy d\'intégration ; conservé pour la continuité de l\'indice d\'ingénierie, au statut « degenerate » tant qu\'il est saturé.',
    notLicensedEn: ['Integration of any kind (fails the connectivity-ablation control, A1).', COMMON_NOT_LICENSED_EN],
    notLicensedFr: ['Une intégration de quelque sorte (échoue au contrôle d\'ablation de connectivité, A1).', COMMON_NOT_LICENSED_FR],
    knownDefectsEn: [
      'Unit error: a rate in Hz is added to dimensionless terms; the clamp is active on ≈ 97 % of steps (A2).',
      'Up to v3.1.1 it read an SNN instance the snn_step tool never advanced.',
      'Redesign is an author decision; this release documents and flags the defect without redefining the construct.',
    ],
    knownDefectsFr: [
      'Erreur d\'unité : un taux en Hz s\'ajoute à des termes sans dimension ; la saturation est active sur ≈ 97 % des pas (A2).',
      'Jusqu\'à la v3.1.1, il lisait une instance du SNN que l\'outil snn_step ne faisait jamais avancer.',
      'La refonte relève de l\'auteur ; cette version documente et signale le défaut sans redéfinir le construit.',
    ],
    statuses: ['value', 'not-measured', 'degenerate'],
  },
  {
    id: 'acm.broadcastProxy', symbol: 'GW̃ (ACM)', module: 'src/engine/acm.ts (broadcastProxyOf)', kind: 'engineering-index',
    namedAfterEn: 'Global workspace theory (Baars), by name only.',
    constructEn: 'Uniformity of mean firing rate across the SNN layers, gated by overall rate.',
    constructFr: 'Uniformité du taux moyen entre couches du SNN, modulée par le taux global.',
    formula: 'value = max(0, 1 − 0.5·CV(layer rates)) · min(1, mean(layer rates)/50 Hz); 0 when mean < 0.01 Hz.',
    range: '[0, 1]',
    inputs: [{ name: 'layer rates of the stepped SNN', provenance: 'endogenous', noteEn: 'Read from the engine since v3.2.0.' }],
    invariances: [{ propertyEn: 'falls when layers cannot communicate', holds: false, checkedBy: 'A3' }],
    domainEn: 'Descriptive uniformity of layer activity.',
    domainFr: 'Uniformité descriptive de l\'activité par couche.',
    notLicensedEn: ['Broadcast, ignition or competition (fails the ablation control, A3).', COMMON_NOT_LICENSED_EN],
    notLicensedFr: ['Diffusion, ignition ou compétition (échoue au contrôle d\'ablation, A3).', COMMON_NOT_LICENSED_FR],
    knownDefectsEn: ['Up to v3.1.1 it read state.loihi.ly, which no engine wrote: it returned 0 in every session — an absence of measurement reported as a value.'],
    knownDefectsFr: ['Jusqu\'à la v3.1.1, il lisait state.loihi.ly, qu\'aucun moteur n\'écrivait : il valait 0 dans toute session — une absence de mesure présentée comme une valeur.'],
    statuses: ['value', 'not-measured'],
  },
  {
    id: 'acm.arousalProxy', symbol: 'PAD̃ (ACM)', module: 'src/engine/acm.ts (arousalProxyOf)', kind: 'engineering-index',
    namedAfterEn: 'PAD model (Mehrabian), arousal axis only.',
    constructEn: 'Weighted sum of three state fields, none of which is measured.',
    constructFr: 'Somme pondérée de trois champs d\'état, dont aucun n\'est mesuré.',
    formula: '0.5·min(1, spk/2000) + 0.3·min(1, bio/100) + 0.2·min(1, nrg/5).',
    range: '[0, 1]',
    inputs: [
      { name: 'loihi.spk', provenance: 'unavailable', noteEn: 'Written by no engine; a configured value when set.' },
      { name: 'loihi.bio', provenance: 'endogenous', noteEn: 'Synthetic drift of the background loop.' },
      { name: 'loihi.nrg', provenance: 'endogenous', noteEn: 'Synthetic drift of the background loop.' },
    ],
    invariances: [{ propertyEn: 'every input is a measurement', holds: false, checkedBy: 'A4' }],
    domainEn: 'Demonstration of the composite\'s plumbing.',
    domainFr: 'Démonstration de la tuyauterie du composite.',
    notLicensedEn: ['Pleasure or dominance (not computed); arousal of any subject.', COMMON_NOT_LICENSED_EN],
    notLicensedFr: ['Plaisir ou dominance (non calculés) ; l\'éveil d\'un quelconque sujet.', COMMON_NOT_LICENSED_FR],
    knownDefectsEn: ['Reads only configured or simulated values (A4).'],
    knownDefectsFr: ['Ne lit que des valeurs configurées ou simulées (A4).'],
    statuses: ['value', 'not-measured'],
  },
  {
    id: 'acm.compositeScore', symbol: 'ACM', module: 'src/engine/acm.ts (assess)', kind: 'engineering-index',
    namedAfterEn: 'Artificial Consciousness Module (upstream name).',
    constructEn: 'Conventional weighted sum α·Φ̃ + β·GW̃ + γ·PAD̃ of three proxies lacking a common scale.',
    constructFr: 'Somme pondérée conventionnelle α·Φ̃ + β·GW̃ + γ·PAD̃ de trois proxys sans échelle commune.',
    formula: '0.40·Φ̃ + 0.35·GW̃ + 0.25·PAD̃ (weights overridable).',
    range: '[0, 1]',
    inputs: [{ name: 'the three ACM components', provenance: 'derived', noteEn: 'compositeStatus inherits not-measured / degenerate components.' }],
    invariances: [],
    domainEn: 'Regression monitoring of the simulation only.',
    domainFr: 'Suivi de non-régression de la simulation seulement.',
    notLicensedEn: ['Ranking of systems; any degree reading (FCS prohibitions 1 and 4).', COMMON_NOT_LICENSED_EN],
    notLicensedFr: ['Classement de systèmes ; toute lecture en degré (interdictions FCS 1 et 4).', COMMON_NOT_LICENSED_FR],
    knownDefectsEn: ['Two of its three terms fail their ablation controls (A1, A3); the third reads no measurement (A4).'],
    knownDefectsFr: ['Deux de ses trois termes échouent à leur contrôle d\'ablation (A1, A3) ; le troisième ne lit aucune mesure (A4).'],
    statuses: ['value', 'not-measured', 'degenerate'],
  },
  {
    id: 'acm.confidence', symbol: 'ACM confidence', module: 'src/engine/acm.ts (computeConfidence)', kind: 'heuristic',
    namedAfterEn: 'none — the word "confidence" is a misnomer kept for API stability.',
    constructEn: 'Agreement among the three ACM proxies plus their non-zero share.',
    constructFr: 'Accord entre les trois proxys ACM, plus la part de ceux qui sont non nuls.',
    formula: '100 × [0.7·max(0, 1 − 2·SD(Φ̃, GW̃, PAD̃)) + 0.3·#{proxy > 0.01}/3].',
    range: '[0, 100]',
    inputs: [{ name: 'the three ACM components', provenance: 'derived', noteEn: 'No sampling model.' }],
    invariances: [],
    domainEn: 'None as a statistical quantity.',
    domainFr: 'Aucun comme grandeur statistique.',
    notLicensedEn: ['Coverage, error rate or credibility of any estimate.'],
    notLicensedFr: ['Couverture, taux d\'erreur ou crédibilité d\'une estimation.'],
    knownDefectsEn: ['Rewards agreement between quantities that share no scale.'],
    knownDefectsFr: ['Récompense l\'accord entre grandeurs sans échelle commune.'],
    statuses: ['value'],
  },
]);

export const PROXY_CARD_BY_ID: ReadonlyMap<string, ProxyCard> = new Map(PROXY_CARDS.map((c) => [c.id, c]));
