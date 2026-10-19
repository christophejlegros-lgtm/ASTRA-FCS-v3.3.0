/**
 * ASTRA × FCS — Inter-rater agreement on the ordinal codings (v3.2.0)
 * ═══════════════════════════════════════════════════════════════════
 * Analysis of 9 October 2026, §6: the ~100 ms window, the causal distance and
 * the ablation degrees "must receive an independent biological justification,
 * with sensitivity analysis and agreement between raters". Agreement between
 * the transcribed table and the code checks a transcription; it says nothing
 * about whether independent experts would code the seventeen pairs the same
 * way. This module supplies the instrument for that second question:
 *
 *   codingTemplate()   — a blank coding sheet (labels, roles, definitions of
 *                        the sub-criteria and degrees; no published values),
 *                        so that raters code blind to the table;
 *   krippendorffAlpha  — Krippendorff's α for nominal, ordinal or interval
 *                        data, missing values allowed (Hayes & Krippendorff
 *                        2007, doi:10.1080/19312450709336664);
 *   agreementReport    — α per sub-criterion across raters, each rater's
 *                        agreement with the source table, and whether each
 *                        rater's coding reproduces the eight published strata.
 *
 * No acceptability threshold for α is built in: it is a convention to be
 * declared in the coding protocol BEFORE the codings are collected.
 *
 * © 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
 */

import { PAIRS, ROLE_DEFINITIONS, ABLATION_DEGREES, type SpeciesFunctionPair } from './taxonomy.js';
import { stratify, dominates, tauRank, EPISODE_WINDOW_ORDINALISATION } from './stratification.js';

export type AlphaMetric = 'nominal' | 'ordinal' | 'interval';

/**
 * Krippendorff's α. `data[r][u]` is rater r's value for unit u, or null when
 * missing. Units with fewer than two values are not pairable and are ignored.
 * Returns null when no unit is pairable or when expected disagreement is 0.
 */
export function krippendorffAlpha(data: ReadonlyArray<ReadonlyArray<number | null>>, metric: AlphaMetric = 'ordinal'): number | null {
  const nUnits = data.length > 0 ? data[0].length : 0;
  const values = [...new Set(data.flat().filter((v): v is number => v !== null && Number.isFinite(v)))].sort((a, b) => a - b);
  if (values.length === 0) return null;
  const idx = new Map(values.map((v, i) => [v, i]));
  const V = values.length;
  const o: number[][] = Array.from({ length: V }, () => new Array<number>(V).fill(0));
  for (let u = 0; u < nUnits; u++) {
    const vs = data.map((row) => row[u]).filter((v): v is number => v !== null && Number.isFinite(v));
    const m = vs.length;
    if (m < 2) continue;
    for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) if (i !== j) o[idx.get(vs[i])!][idx.get(vs[j])!] += 1 / (m - 1);
  }
  const nc = o.map((row) => row.reduce((a, b) => a + b, 0));
  const n = nc.reduce((a, b) => a + b, 0);
  if (n <= 1) return null;
  const delta2 = (c: number, k: number): number => {
    if (metric === 'nominal') return c === k ? 0 : 1;
    if (metric === 'interval') return (values[c] - values[k]) ** 2;
    const [lo, hi] = c <= k ? [c, k] : [k, c];
    let s = 0;
    for (let g = lo; g <= hi; g++) s += nc[g];
    return (s - (nc[lo] + nc[hi]) / 2) ** 2;
  };
  let Do = 0, De = 0;
  for (let c = 0; c < V; c++) {
    for (let k = 0; k < V; k++) {
      const d = delta2(c, k);
      Do += o[c][k] * d;
      De += nc[c] * nc[k] * d;
    }
  }
  Do /= n;
  De /= n * (n - 1);
  if (De === 0) return null;
  return 1 - Do / De;
}

// ── Coding sheet ──────────────────────────────────────────────────

export interface PairCoding {
  pairId: string;
  d: number | null;
  /** Lower bound of the τ range as a decimal exponent (s); ranked with the declared reduction. */
  tauLowerLog10?: number | null;
  /** Alternatively, a τ rank coded directly (0 / 1 / 2). */
  tauRank?: number | null;
  ablation: number | null;
}

export interface RaterCodings { rater: string; codings: PairCoding[] }

/** Blank coding sheet: what a rater needs, and nothing of the published values. */
export function codingTemplate() {
  return {
    instructionsEn:
      'Code each species–function pair on the three sub-criteria WITHOUT consulting document IV §3 or the ASTRA table. ' +
      'Leave a field null when you cannot code it. Return one sheet per rater.',
    instructionsFr:
      'Coder chaque couple espèce–fonction sur les trois sous-critères SANS consulter le document IV §3 ni la table d\'ASTRA. ' +
      'Laisser un champ vide (null) lorsque le codage est impossible. Une feuille par évaluateur.',
    subCriteria: {
      d: 'Causal distance to the carrier, in steps mediated by a distinct entity (ligand → receptor, receptor → second messenger, gene → transcript, transcript → protein). Mobile charge = 0; a coefficient or variable of the carrier\'s equations = 1. Integer 0–4.',
      tauLowerLog10: 'Lower bound of the time constant τ, as a decimal exponent in seconds; τ is the longer of the class\'s action on the carrier and of its own physiological variation. Integer.',
      ablation: Object.fromEntries(Object.entries(ABLATION_DEGREES).map(([k, v]) => [k, v.en])),
    },
    pairs: PAIRS.map((p) => ({
      pairId: p.id, labelEn: p.labelEn, labelFr: p.labelFr, role: p.role, roleDefinitionEn: ROLE_DEFINITIONS[p.role].en,
      d: null, tauLowerLog10: null, ablation: null,
    })),
  };
}

// ── Report ────────────────────────────────────────────────────────

function rankOf(c: PairCoding): number | null {
  if (c.tauRank !== undefined && c.tauRank !== null) return c.tauRank;
  if (c.tauLowerLog10 === undefined || c.tauLowerLog10 === null) return null;
  let r = 0;
  for (const cut of EPISODE_WINDOW_ORDINALISATION.cutsLog10) if (c.tauLowerLog10 > cut) r++;
  return r;
}

export interface AgreementReport {
  raters: string[];
  units: number;
  alpha: { d: number | null; tauRank: number | null; ablation: number | null; metric: AlphaMetric };
  /** Each rater against the source table (α over two "raters": source and this rater). */
  perRater: Array<{
    rater: string;
    coded: number;
    alphaWithSource: { d: number | null; tauRank: number | null; ablation: number | null };
    /** Only when the rater coded all 17 pairs on all three sub-criteria. */
    stratification: { strataCount: number; reproducesPublished: boolean; divergenceCount: number } | null;
    /** Share of the 136 unordered pairs on which the dominance relation agrees with the source. */
    dominanceAgreement: number | null;
  }>;
  noteEn: string;
  noteFr: string;
}

export function agreementReport(ratings: readonly RaterCodings[], metric: AlphaMetric = 'ordinal'): AgreementReport {
  const ids = PAIRS.map((p) => p.id);
  const lookup = ratings.map((r) => new Map(r.codings.map((c) => [c.pairId, c])));
  const column = (get: (c: PairCoding) => number | null) =>
    lookup.map((m) => ids.map((id) => { const c = m.get(id); return c ? get(c) : null; }));
  const source = {
    d: PAIRS.map((p) => p.d as number),
    tauRank: PAIRS.map((p) => tauRank(p)),
    ablation: PAIRS.map((p) => p.ablation as number),
  };
  const dCol = column((c) => c.d), tCol = column(rankOf), aCol = column((c) => c.ablation);

  const perRater = ratings.map((r, i) => {
    const m = lookup[i];
    const complete = ids.every((id) => {
      const c = m.get(id);
      return c && c.d !== null && rankOf(c) !== null && c.ablation !== null;
    });
    let stratification: AgreementReport['perRater'][number]['stratification'] = null;
    let dominanceAgreement: number | null = null;
    if (complete) {
      // Rebuild the table from the rater's coding; τ is represented by a range whose
      // lower bound lands in the coded rank under the declared reduction.
      const lowerForRank = [-2, 0, 1];
      const table: SpeciesFunctionPair[] = PAIRS.map((p) => {
        const c = m.get(p.id)!;
        const lo = c.tauLowerLog10 ?? lowerForRank[Math.max(0, Math.min(2, rankOf(c)!))];
        return { ...p, d: c.d as SpeciesFunctionPair['d'], ablation: c.ablation as SpeciesFunctionPair['ablation'], tauLog10: [lo, Math.max(lo, p.tauLog10[1])] as const };
      });
      const st = stratify(table);
      stratification = { strataCount: st.strata.length, reproducesPublished: st.reproducesPublished, divergenceCount: st.divergences.length };
      let agree = 0, total = 0;
      for (let a = 0; a < PAIRS.length; a++) {
        for (let b = a + 1; b < PAIRS.length; b++) {
          total++;
          const s1 = dominates(PAIRS[a], PAIRS[b]).dominates ? 1 : dominates(PAIRS[b], PAIRS[a]).dominates ? -1 : 0;
          const s2 = dominates(table[a], table[b]).dominates ? 1 : dominates(table[b], table[a]).dominates ? -1 : 0;
          if (s1 === s2) agree++;
        }
      }
      dominanceAgreement = +(agree / total).toFixed(4);
    }
    const r4 = (x: number | null) => (x === null ? null : +x.toFixed(4));
    return {
      rater: r.rater,
      coded: r.codings.length,
      alphaWithSource: {
        d: r4(krippendorffAlpha([source.d, dCol[i]], metric)),
        tauRank: r4(krippendorffAlpha([source.tauRank, tCol[i]], metric)),
        ablation: r4(krippendorffAlpha([source.ablation, aCol[i]], metric)),
      },
      stratification,
      dominanceAgreement,
    };
  });

  const r4 = (x: number | null) => (x === null ? null : +x.toFixed(4));
  return {
    raters: ratings.map((r) => r.rater),
    units: ids.length,
    alpha: {
      d: ratings.length >= 2 ? r4(krippendorffAlpha(dCol, metric)) : null,
      tauRank: ratings.length >= 2 ? r4(krippendorffAlpha(tCol, metric)) : null,
      ablation: ratings.length >= 2 ? r4(krippendorffAlpha(aCol, metric)) : null,
      metric,
    },
    perRater,
    noteEn:
      'α across raters requires at least two raters; agreement with the source table is reported per rater. No ' +
      'acceptability threshold is built in: declare it in the coding protocol before collecting the codings. ' +
      'Agreement among raters supports the reliability of the coding, not the biological validity of the cuts.',
    noteFr:
      'L\'α inter-évaluateurs requiert au moins deux évaluateurs ; l\'accord avec la table source est donné par évaluateur. ' +
      'Aucun seuil d\'acceptabilité n\'est intégré : le déclarer dans le protocole de codage avant la collecte. ' +
      'L\'accord entre évaluateurs étaye la fidélité du codage, non la validité biologique des découpages.',
  };
}
