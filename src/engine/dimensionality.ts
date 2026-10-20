/**
 * ASTRA — Effective dimensionality of representational matrices (v3.3.0-rc.5)
 * ═══════════════════════════════════════════════════════════════════════════
 * The observable of FCS level II is stated in document II §6.3: under rupture
 * of closure, dimensions that are coupled under closure should separate, which
 * "se lit dans la matrice de dissimilarité … comme une augmentation de la
 * dimensionnalité effective". The document fixes a direction of variation, not
 * a value. This module supplies the polynomial machinery and nothing else:
 *
 *   patterns ──(1 − r, or Euclidean)──▶ RDM  (Kriegeskorte, Mur & Bandettini 2008)
 *   RDM ──(classical MDS, Torgerson 1952: B = −½ J D⁽²⁾ J)──▶ eigenvalues λ
 *   λ⁺ ──▶ participation ratio PR = (Σλ⁺)² / Σ(λ⁺)²   (Gao & Ganguli 2015)
 *
 * Cost: O(n²·d) for the RDM, O(n³) per Jacobi sweep for the eigenvalues —
 * polynomial, as document I §7 requires of any admissible observable.
 *
 * What PR is NOT: a degree of anything phenomenal. It is a property of a matrix
 * of distances between responses (FCS prohibitions 1 and 2). Negative MDS
 * eigenvalues (a non-Euclidean RDM, common with correlation distance) are
 * reported, not hidden: `negativeMassFraction` says how much was discarded.
 *
 * Also here, because the withdrawal analysis needs them and the repository has
 * no statistics dependency: Student's t distribution (CDF and quantile through
 * the regularised incomplete beta function), and the OLS slope.
 *
 * © 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
 */

export type DissimilarityMetric = 'correlation' | 'euclidean';

function assertFiniteMatrix(m: readonly (readonly number[])[], what: string): void {
  for (const row of m) for (const v of row) {
    if (!Number.isFinite(v)) throw new RangeError(`${what}: non-finite value`);
  }
}

/** Pearson correlation of two equal-length vectors; null when either is constant. */
export function pearson(a: readonly number[], b: readonly number[]): number | null {
  if (a.length !== b.length || a.length < 2) throw new RangeError('pearson: vectors must have equal length ≥ 2');
  const n = a.length;
  let ma = 0, mb = 0;
  for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; }
  ma /= n; mb /= n;
  let sab = 0, saa = 0, sbb = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - ma, db = b[i] - mb;
    sab += da * db; saa += da * da; sbb += db * db;
  }
  if (saa === 0 || sbb === 0) return null;
  return sab / Math.sqrt(saa * sbb);
}

/**
 * Representational dissimilarity matrix from response patterns (one row per
 * condition or probe item). `correlation` = 1 − Pearson r (constant pattern →
 * RangeError, since its distance is undefined); `euclidean` = L2 distance.
 */
export function rdmFromPatterns(patterns: readonly (readonly number[])[], metric: DissimilarityMetric = 'correlation'): number[][] {
  const n = patterns.length;
  if (n < 3) throw new RangeError('rdmFromPatterns: at least 3 patterns are required');
  const d = patterns[0].length;
  if (d < 2) throw new RangeError('rdmFromPatterns: patterns need at least 2 features');
  for (const p of patterns) if (p.length !== d) throw new RangeError('rdmFromPatterns: ragged patterns');
  assertFiniteMatrix(patterns, 'rdmFromPatterns');
  const D = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      let v: number;
      if (metric === 'euclidean') {
        let s = 0;
        for (let k = 0; k < d; k++) { const t = patterns[i][k] - patterns[j][k]; s += t * t; }
        v = Math.sqrt(s);
      } else {
        const r = pearson(patterns[i], patterns[j]);
        if (r === null) throw new RangeError(`rdmFromPatterns: pattern ${i} or ${j} is constant — correlation distance undefined`);
        v = 1 - r;
      }
      D[i][j] = D[j][i] = v;
    }
  }
  return D;
}

/**
 * Dissimilarity matrix from pairwise similarity JUDGEMENTS (document II §6.2;
 * FCS-K1): one judgement per unordered pair of the `items` configurations,
 * similarity rescaled to [0, 1] by the caller, dissimilarity = 1 − similarity.
 * Every pair must be judged exactly once (a repeated pair is averaged only if
 * the protocol says so — here it is refused, so that nothing is silently pooled).
 */
export function rdmFromSimilarityJudgements(
  items: number,
  judgements: ReadonlyArray<{ i: number; j: number; similarity: number }>,
): number[][] {
  if (!(Number.isInteger(items) && items >= 3)) throw new RangeError('rdmFromSimilarityJudgements: at least 3 items');
  const D = Array.from({ length: items }, () => new Array<number>(items).fill(NaN));
  for (let k = 0; k < items; k++) D[k][k] = 0;
  for (const { i, j, similarity } of judgements) {
    if (!(Number.isInteger(i) && Number.isInteger(j) && i >= 0 && j >= 0 && i < items && j < items && i !== j)) {
      throw new RangeError(`rdmFromSimilarityJudgements: invalid pair (${i}, ${j})`);
    }
    if (!(Number.isFinite(similarity) && similarity >= 0 && similarity <= 1)) {
      throw new RangeError(`rdmFromSimilarityJudgements: similarity of (${i}, ${j}) must lie in [0, 1]`);
    }
    if (!Number.isNaN(D[i][j])) throw new RangeError(`rdmFromSimilarityJudgements: pair (${i}, ${j}) judged twice`);
    D[i][j] = D[j][i] = 1 - similarity;
  }
  const missing: string[] = [];
  for (let i = 0; i < items; i++) for (let j = i + 1; j < items; j++) if (Number.isNaN(D[i][j])) missing.push(`(${i}, ${j})`);
  if (missing.length) throw new RangeError(`rdmFromSimilarityJudgements: ${missing.length} pair(s) not judged: ${missing.slice(0, 5).join(', ')}`);
  return D;
}

/** Checks that a matrix is a square, symmetric, zero-diagonal, non-negative dissimilarity matrix. */
export function validateRdm(D: readonly (readonly number[])[]): string[] {
  const problems: string[] = [];
  const n = D.length;
  if (n < 3) problems.push('fewer than 3 conditions');
  for (let i = 0; i < n; i++) {
    if (!Array.isArray(D[i]) || D[i].length !== n) { problems.push(`row ${i} is not of length ${n}`); continue; }
    for (let j = 0; j < n; j++) {
      const v = D[i][j];
      if (!Number.isFinite(v)) problems.push(`D[${i}][${j}] is not finite`);
      else if (v < 0) problems.push(`D[${i}][${j}] is negative`);
    }
    if (Number.isFinite(D[i][i]) && Math.abs(D[i][i]) > 1e-12) problems.push(`D[${i}][${i}] is not zero`);
  }
  if (problems.length === 0) {
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      if (Math.abs(D[i][j] - D[j][i]) > 1e-9 * Math.max(1, Math.abs(D[i][j]))) problems.push(`D is not symmetric at (${i},${j})`);
    }
  }
  return problems;
}

/**
 * Eigenvalues of a real symmetric matrix by the cyclic Jacobi method.
 * Returned in descending order. Adequate for the matrix sizes of a condition
 * space (n ≲ 100); not a general-purpose eigensolver.
 */
export function symmetricEigenvalues(M: readonly (readonly number[])[], maxSweeps = 100, tol = 1e-12): number[] {
  const n = M.length;
  const a = M.map((r) => r.slice());
  for (let sweep = 0; sweep < maxSweeps; sweep++) {
    let off = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += a[p][q] * a[p][q];
    if (off < tol * tol) break;
    for (let p = 0; p < n; p++) {
      for (let q = p + 1; q < n; q++) {
        const apq = a[p][q];
        if (Math.abs(apq) < 1e-300) continue;
        const theta = (a[q][q] - a[p][p]) / (2 * apq);
        const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1);
        const s = t * c;
        for (let k = 0; k < n; k++) {
          const akp = a[k][p], akq = a[k][q];
          a[k][p] = c * akp - s * akq;
          a[k][q] = s * akp + c * akq;
        }
        for (let k = 0; k < n; k++) {
          const apk = a[p][k], aqk = a[q][k];
          a[p][k] = c * apk - s * aqk;
          a[q][k] = s * apk + c * aqk;
        }
      }
    }
  }
  return a.map((r, i) => r[i]).sort((x, y) => y - x);
}

export interface DimensionalityResult {
  /** Participation ratio of the positive classical-MDS eigenvalues, in [1, n − 1]. */
  participationRatio: number;
  /** All eigenvalues of B = −½ J D⁽²⁾ J, descending. */
  eigenvalues: number[];
  /** |Σλ⁻| / (Σλ⁺ + |Σλ⁻|): share of the spectrum discarded as non-Euclidean. */
  negativeMassFraction: number;
  conditions: number;
  method: 'classical-MDS participation ratio';
}

/**
 * Effective dimensionality of a dissimilarity matrix: participation ratio of
 * the positive eigenvalues of its classical-MDS Gram matrix. A matrix whose
 * conditions lie on one axis gives PR = 1; k orthogonal axes of equal spread
 * give PR = k.
 */
export function effectiveDimensionality(D: readonly (readonly number[])[]): DimensionalityResult {
  const problems = validateRdm(D);
  if (problems.length) throw new RangeError(`effectiveDimensionality: invalid RDM — ${problems.slice(0, 3).join('; ')}`);
  const n = D.length;
  const D2 = D.map((r) => r.map((v) => v * v));
  const rowMean = D2.map((r) => r.reduce((s, v) => s + v, 0) / n);
  const grand = rowMean.reduce((s, v) => s + v, 0) / n;
  const B = D2.map((r, i) => r.map((v, j) => -0.5 * (v - rowMean[i] - rowMean[j] + grand)));
  const eig = symmetricEigenvalues(B);
  const scale = Math.max(1e-300, Math.max(...eig.map(Math.abs)));
  const pos = eig.filter((l) => l > 1e-10 * scale);
  const neg = eig.filter((l) => l < -1e-10 * scale);
  const sp = pos.reduce((s, v) => s + v, 0);
  const sp2 = pos.reduce((s, v) => s + v * v, 0);
  const sn = Math.abs(neg.reduce((s, v) => s + v, 0));
  if (sp <= 0) throw new RangeError('effectiveDimensionality: degenerate RDM (all conditions identical)');
  return {
    participationRatio: (sp * sp) / sp2,
    eigenvalues: eig,
    negativeMassFraction: sn / (sp + sn),
    conditions: n,
    method: 'classical-MDS participation ratio',
  };
}

// ── Statistics ────────────────────────────────────────────────────

/** Ordinary least-squares slope of y on x; null when x is constant. */
export function olsSlope(x: readonly number[], y: readonly number[]): number | null {
  if (x.length !== y.length || x.length < 2) throw new RangeError('olsSlope: need ≥ 2 paired values');
  const n = x.length;
  const mx = x.reduce((s, v) => s + v, 0) / n;
  const my = y.reduce((s, v) => s + v, 0) / n;
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; }
  return sxx === 0 ? null : sxy / sxx;
}

function logGamma(z: number): number {
  // Lanczos approximation (g = 7, n = 9), accurate to ~1e-15 for z > 0.
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1;
  let x = c[0];
  for (let i = 1; i < 9; i++) x += c[i] / (z + i);
  const t = z + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

/** Continued fraction for the incomplete beta function (modified Lentz). */
function betacf(a: number, b: number, x: number): number {
  const FPMIN = 1e-300;
  let c = 1, d = 1 - ((a + b) * x) / (a + 1);
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 300; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((a - 1 + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; h *= d * c;
    aa = (-(a + m) * (a + b + m) * x) / ((a + m2) * (a + 1 + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-15) break;
  }
  return h;
}

/** Regularised incomplete beta function I_x(a, b). */
export function regularisedBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const lbt = logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x);
  const bt = Math.exp(lbt);
  return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b;
}

/** Student's t cumulative distribution function. */
export function studentTCdf(t: number, df: number): number {
  if (!(df > 0)) throw new RangeError('studentTCdf: df must be > 0');
  const x = df / (df + t * t);
  const tail = 0.5 * regularisedBeta(x, df / 2, 0.5);
  return t >= 0 ? 1 - tail : tail;
}

/** Student's t quantile (inverse CDF) by bisection on the CDF; |error| < 1e-10. */
export function studentTQuantile(p: number, df: number): number {
  if (!(p > 0 && p < 1)) throw new RangeError('studentTQuantile: p must lie in (0, 1)');
  if (p === 0.5) return 0;
  let lo = -1e3, hi = 1e3;
  for (let i = 0; i < 200; i++) {
    const mid = 0.5 * (lo + hi);
    if (studentTCdf(mid, df) < p) lo = mid; else hi = mid;
    if (hi - lo < 1e-12) break;
  }
  return 0.5 * (lo + hi);
}

export interface MeanInterval {
  n: number;
  mean: number;
  sd: number;
  /** Two-sided (1 − 2α) interval: the interval of the two one-sided tests. */
  lower: number;
  upper: number;
  level: number;
}

/** Mean of a sample with its (1 − 2α) t interval — the TOST interval (Lakens 2017). */
export function tInterval(values: readonly number[], alpha: number): MeanInterval {
  const n = values.length;
  if (n < 2) throw new RangeError('tInterval: at least 2 units are required');
  if (!(alpha > 0 && alpha < 0.5)) throw new RangeError('tInterval: alpha must lie in (0, 0.5)');
  const mean = values.reduce((s, v) => s + v, 0) / n;
  const sd = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1));
  const q = studentTQuantile(1 - alpha, n - 1);
  const half = (q * sd) / Math.sqrt(n);
  return { n, mean, sd, lower: mean - half, upper: mean + half, level: 1 - 2 * alpha };
}
