#!/usr/bin/env python3
"""
E3 — preparation of the next confrontation of the organoid surrogate (v3.2.0).

Programme minimal de consolidation, point 2 (analysis of 9 October 2026):
  prepare E3 on data never used before, ideally from another laboratory;
  stratify by age and preparation; treat the ORGANOID as the biological unit;
  compare hierarchical models with controls of comparable complexity;
  pre-declare predictive errors, calibration and uncertainties rather than a
  single categorical verdict.

STATUS: analysis code for empirical/PREREG-E3-DRAFT.md, an UNFILED draft. It has
been validated on synthetic ground truth only (empirical/test_e3.py). It has NOT
been run on any recording. `run` refuses to produce a confirmatory result until
the preregistration is filed (see `prereg_is_filed`).

FROZEN CODE IS IMPORTED, NEVER EDITED. The S1–S5 statistics and the legacy
verdict rules come from empirical/confront.py, and the network-burst generator
from empirical/e2_calibrate.py — both hashed by PREREG-E2 §3. This file adds,
without touching them:
  · a fast path for S5 that caches each train's tiled fraction; it returns the
    same numbers as confront.statistics (checked in test_e3.py) and is used for
    simulation banks only — real recordings always go through confront.statistics;
  · a complexity-matched control: the same nine parameters with burst onsets
    drawn independently per electrode (no shared timing);
  · ABC on a simulation bank with local-linear regression adjustment
    (Beaumont, Zhang & Balding 2002, doi:10.1093/genetics/162.4.2025), a
    two-level (hierarchical) population model over per-organoid parameters,
    and a pooled model (E2-style);
  · organoid-level predictive errors, CRPS (Gneiting & Raftery 2007,
    doi:10.1198/016214506000001437), interval coverage, PIT values, and
    organoid-level bootstrap intervals;
  · metadata-only inspection (age, description) for stratification BEFORE any
    spike is read, and a provenance stamp tying every output to a commit and to
    file hashes.

Usage:
  python3 -I empirical/e3_analysis.py inspect a.nwb b.nwb ...     # subject metadata only, no spikes
  python3 -I empirical/e3_analysis.py run --train ... --test ... [--strata age,preparation] [--exploratory]

© 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
"""
from __future__ import annotations

import argparse
import datetime as _dt
import hashlib
import json
import os
import platform
import subprocess
import sys
from dataclasses import dataclass, field
from typing import Callable, Dict, List, Optional, Sequence

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import confront as C  # noqa: E402  (frozen)
import e2_calibrate as E2  # noqa: E402  (frozen)

PREREG = "empirical/PREREG-E3-DRAFT.md"
STAT_KEYS = list(C.STAT_KEYS)
PARAM_NAMES = list(E2.PARAM_NAMES)
# Same prior box as the E2 calibration (e2_calibrate.main), declared again here.
BOX_LO = np.array([2.0, 1.0, 0.05, 0.1, 0.5, 0.1, 0.2, 1.0, 0.01])
BOX_HI = np.array([10.0, 8.0, 0.6, 0.9, 6.0, 0.8, 1.5, 8.0, 0.12])
INTERVALS = (0.80, 0.95)


# ════════════════════════════════════════════════════════════════════════
# Statistics — confront.py, with a cached S5 for simulation banks
# ════════════════════════════════════════════════════════════════════════

def _sttc_cached(a, b, ta, tb, T, dt=C.STTC_DT_S):
    """confront.sttc with the two tiled fractions supplied (same arithmetic, same order)."""
    if a.size == 0 or b.size == 0:
        return float("nan")
    PA, PB = C._prop_within(a, b, dt), C._prop_within(b, a, dt)
    t1 = (PA - tb) / (1 - PA * tb) if PA * tb != 1 else 1.0
    t2 = (PB - ta) / (1 - PB * ta) if PB * ta != 1 else 1.0
    return 0.5 * (t1 + t2)


def statistics_fast(rec: "C.Recording") -> Dict[str, float]:
    """Identical to confront.statistics; S5 caches each train's tiled fraction."""
    act = C.active_trains(rec.trains, rec.window_s)
    s3, s4 = C.s3_s4_bursts(act, rec.window_s)
    top = sorted(act, key=lambda t: t.size, reverse=True)[:C.STTC_TOP_N]
    tiled = [C._tiled_fraction(t, rec.window_s, C.STTC_DT_S) for t in top]
    vals = [_sttc_cached(top[i], top[j], tiled[i], tiled[j], rec.window_s)
            for i in range(len(top)) for j in range(i + 1, len(top))]
    vals = [v for v in vals if np.isfinite(v)]
    return {
        "n_trains": len(rec.trains), "n_active": len(act),
        "S1_rate_hz": C.s1_rate(act, rec.window_s), "S2_isi_cv": C.s2_isi_cv(act),
        "S3_bursts_per_min": s3, "S4_frac_in_bursts": s4,
        "S5_sttc": float(np.median(vals)) if vals else float("nan"),
    }


# Declared transform g of the five statistics onto scales where errors are comparable.
def g_transform(s: Dict[str, float]) -> np.ndarray:
    return np.array([
        np.log(max(s["S1_rate_hz"], 1e-4)),
        np.log(max(s["S2_isi_cv"], 1e-3)),
        np.log(s["S3_bursts_per_min"] + 0.1),
        np.log(s["S4_frac_in_bursts"] + 0.01),
        s["S5_sttc"],
    ], dtype=float)


G_LABELS = ["log S1", "log S2", "log(S3+0.1)", "log(S4+0.01)", "S5"]


# ════════════════════════════════════════════════════════════════════════
# Generators
# ════════════════════════════════════════════════════════════════════════

def simulate_network_burst(p: dict, T: float, seed: int) -> List[np.ndarray]:
    """The frozen E2 prototype (e2_calibrate.simulate): shared network-burst onsets."""
    return E2.simulate(p, T, seed)


def simulate_desync(p: dict, T: float, seed: int) -> List[np.ndarray]:
    """
    Complexity-matched control: the SAME nine parameters and per-electrode
    marginals as network-burst, but every electrode draws its own burst onsets
    from its own gamma renewal process. Removes the shared timing only.
    """
    rng = np.random.default_rng(seed)
    w = np.exp(rng.normal(0, p["heterogeneity"], E2.N_ELEC))
    w /= np.median(w)
    m = p["clusterMeanSpikes"]
    mean_ibi = 60.0 / p["burstRatePerMin"]
    k = p["burstRegularity"]
    out = []
    for wi in w:
        n_cl = rng.poisson(p["bgMedianHz"] * wi * T / m)
        tr: List[float] = []
        for t0 in rng.uniform(0, T, n_cl):
            kk = rng.geometric(1.0 / m) if m > 1 else 1
            tr.extend(t0 + np.concatenate(([0.0], np.cumsum(rng.exponential(p["intraClusterIsiSec"], kk - 1)))))
        t = rng.gamma(k, mean_ibi / k)
        while t < T:
            if rng.random() < p["participation"]:
                n = rng.poisson(p["spikesPerBurst"] * wi)
                tr.extend(t + p["burstDurationSec"] * rng.random(n) ** 1.5)
            t += rng.gamma(k, mean_ibi / k)
        a = np.sort(np.asarray(tr))
        a = a[a < T]
        if a.size > 1 and np.any(np.diff(a) < E2.REFRACT):
            a = E2._drop_refractory(a)
        out.append(a)
    return out


GENERATORS: Dict[str, Callable[[dict, float, int], List[np.ndarray]]] = {
    "network-burst": simulate_network_burst,
    "desync-control": simulate_desync,
}


def sim_stats(gen: str, p: dict, T: float, seed: int) -> Dict[str, float]:
    trains = GENERATORS[gen](p, T, seed)
    return statistics_fast(C.Recording("sim", trains, T, T, "simulated", E2.N_ELEC))


# ════════════════════════════════════════════════════════════════════════
# Parameter coordinates, bank, ABC
# ════════════════════════════════════════════════════════════════════════

def to_u(theta: np.ndarray) -> np.ndarray:
    x = np.clip((theta - BOX_LO) / (BOX_HI - BOX_LO), 1e-6, 1 - 1e-6)
    return np.log(x / (1 - x))


def from_u(u: np.ndarray) -> np.ndarray:
    return BOX_LO + (BOX_HI - BOX_LO) / (1 + np.exp(-u))


def as_params(theta: np.ndarray) -> dict:
    return {n: float(v) for n, v in zip(PARAM_NAMES, theta)}


@dataclass
class Bank:
    generator: str
    T: float
    theta: np.ndarray            # N × 9
    g: np.ndarray                # N × 5
    center: np.ndarray = field(default_factory=lambda: np.zeros(5))
    scale: np.ndarray = field(default_factory=lambda: np.ones(5))

    def standardise(self, gv: np.ndarray) -> np.ndarray:
        return (gv - self.center) / self.scale


def build_bank(generator: str, T: float, n: int, seed: int) -> Bank:
    """n parameter draws, uniform over the declared box, one simulation each at window T."""
    rng = np.random.default_rng(seed)
    theta = BOX_LO + (BOX_HI - BOX_LO) * rng.random((n, len(PARAM_NAMES)))
    g = np.array([g_transform(sim_stats(generator, as_params(th), T, int(seed + 1 + i))) for i, th in enumerate(theta)])
    ok = np.all(np.isfinite(g), axis=1)
    b = Bank(generator, T, theta[ok], g[ok])
    b.center = np.median(b.g, axis=0)
    mad = np.median(np.abs(b.g - b.center), axis=0) * 1.4826
    b.scale = np.where(mad > 1e-9, mad, 1.0)
    return b


def abc_posterior(bank: Bank, observed_g: np.ndarray, k: int, adjust: bool = True) -> np.ndarray:
    """
    ABC on the bank: the k entries nearest to the observed summaries
    (standardised Euclidean), then — by default — the local-linear regression
    adjustment of Beaumont, Zhang & Balding (2002): with Epanechnikov weights,
    regress the u-coordinates on the standardised summaries and move each
    accepted draw to the observed summaries. Returns θ draws (k × 9).
    """
    S = bank.standardise(bank.g)
    s_obs = bank.standardise(observed_g)
    d = np.linalg.norm(S - s_obs, axis=1)
    idx = np.argsort(d)[:k]
    theta = bank.theta[idx]
    if not adjust or k < S.shape[1] + 3:
        return theta
    h = d[idx].max() + 1e-12
    w = 1.0 - (d[idx] / h) ** 2
    X = np.hstack([np.ones((k, 1)), S[idx] - s_obs])
    U = to_u(theta)
    W = np.sqrt(np.clip(w, 1e-6, None))[:, None]
    beta, *_ = np.linalg.lstsq(X * W, U * W, rcond=None)
    U_adj = U - (S[idx] - s_obs) @ beta[1:]
    return from_u(U_adj)


# ════════════════════════════════════════════════════════════════════════
# Models: hierarchical (organoid as unit) and pooled (E2-style)
# ════════════════════════════════════════════════════════════════════════

@dataclass
class Fitted:
    name: str
    generator: str
    kind: str                    # 'hierarchical' | 'pooled'
    mu: np.ndarray               # population mean, u-coordinates
    var: np.ndarray              # predictive variance of a NEW organoid's u (0 for pooled)
    n_organoids: int
    detail: dict
    #: hierarchical: one array of posterior draws (u-coordinates) per training organoid
    draws: Optional[List[np.ndarray]] = None
    #: fixed models (M0, M1-E2): (T, n, seed) → n × 5 g-transformed statistics
    sampler: Optional[Callable[[float, int, int], np.ndarray]] = None


def fit_hierarchical(bank, train_g: Sequence[np.ndarray], k: int, name: str) -> Fitted:
    """
    Two-level model with the ORGANOID as unit, WITHOUT partial pooling. Level 1:
    each training organoid i has its own parameter vector, with ABC posterior
    draws U_i (u-coordinates), fitted independently. Level 2: the population of
    organoids is represented non-parametrically by the equal-weight mixture of
    the U_i — an unseen organoid is predicted by drawing an organoid of the
    population, then its parameters. Between-organoid variability therefore
    enters the predictive distribution; with few training organoids the mixture
    is coarse, and no information is shared between organoids. A partially
    pooled (parametric) population is the alternative the preregistration must
    weigh (PREREG-E3-DRAFT §3).
    Diagnostics: per-coordinate between variance of the organoid means and mean
    within variance.
    """
    banks = bank if isinstance(bank, list) else [bank] * len(train_g)
    U = [to_u(abc_posterior(b, gv, k)) for b, gv in zip(banks, train_g)]
    m = np.array([u.mean(axis=0) for u in U])
    w = np.array([u.var(axis=0, ddof=1) for u in U])
    n = len(U)
    var_m = m.var(axis=0, ddof=1) if n > 1 else np.zeros(m.shape[1])
    return Fitted(name, banks[0].generator, "hierarchical", m.mean(axis=0), np.zeros_like(var_m), n,
                  {"betweenVarOfMeans_u": var_m.tolist(), "withinVarMean_u": w.mean(axis=0).tolist(),
                   "organoidMeans_u": m.tolist(), "population": "equal-weight mixture of per-organoid ABC posteriors (no partial pooling)"},
                  draws=U)


def fit_pooled(bank, train_g: Sequence[np.ndarray], k: int, name: str) -> Fitted:
    """One parameter vector for all organoids, fitted to the mean training summaries (as E2 did); seeds only vary."""
    b = bank[0] if isinstance(bank, list) else bank
    target = np.mean(np.array(train_g), axis=0)
    u = to_u(abc_posterior(b, target, k)).mean(axis=0)
    return Fitted(name, b.generator, "pooled", u, np.zeros_like(u), len(train_g), {"target_g": target.tolist(), "bankT": b.T})


def fixed_python_model(name: str, generator: str, params: dict) -> Fitted:
    """A model with frozen parameters, simulated by the Python prototype (seeds only vary)."""
    th = np.array([params[n] for n in PARAM_NAMES])

    def sampler(T: float, n: int, seed: int) -> np.ndarray:
        return np.array([g_transform(sim_stats(generator, params, T, int(seed + 7 + i))) for i in range(n)])
    return Fitted(name, generator, "fixed", to_u(th), np.zeros(len(th)), 0, {"params": params, "simulator": "python prototype"}, sampler=sampler)


def ts_export_model(name: str, ts_model: str) -> Fitted:
    """
    A frozen TypeScript model of OrganoidMEA exported by the frozen
    empirical/sim_export.ts (Node ≥ 20): 'poisson' (E1 model, M0) or
    'network-burst' with E2_CALIBRATED_PARAMS (M1-E2). Seeds 1…n.
    """
    def sampler(T: float, n: int, seed: int) -> np.ndarray:
        import tempfile
        with tempfile.TemporaryDirectory() as d:
            out = os.path.join(d, "sim.json")
            env = dict(os.environ, TSX_TSCONFIG_PATH="tsconfig.test.json")
            subprocess.run(["npx", "tsx", "empirical/sim_export.ts", f"--model={ts_model}", repr(float(T)), out, f"1-{n}"],
                           cwd=ROOT, check=True, env=env, shell=(os.name == "nt"), capture_output=True)
            recs = C.load_sim(out)
        return np.array([g_transform(statistics_fast(r)) for r in recs])
    return Fitted(name, f"ts:{ts_model}", "fixed", np.zeros(len(PARAM_NAMES)), np.zeros(len(PARAM_NAMES)), 0,
                  {"simulator": f"empirical/sim_export.ts --model={ts_model} (frozen)"}, sampler=sampler)


def predictive_samples(model: Fitted, T: float, n: int, seed: int) -> np.ndarray:
    """n × 5 matrix of g-transformed statistics for an unseen organoid recorded for T seconds."""
    if model.sampler is not None:
        return model.sampler(T, n, seed)
    rng = np.random.default_rng(seed)
    out = []
    for i in range(n):
        if model.kind == "hierarchical" and model.draws:
            org = model.draws[int(rng.integers(0, len(model.draws)))]
            u = org[int(rng.integers(0, org.shape[0]))]
        else:
            u = model.mu + np.sqrt(model.var) * rng.standard_normal(model.mu.shape)
        out.append(g_transform(sim_stats(model.generator, as_params(from_u(u)), T, int(seed + 7 + i))))
    return np.array(out)


# ════════════════════════════════════════════════════════════════════════
# Scores — organoid as unit
# ════════════════════════════════════════════════════════════════════════

def crps_samples(x: np.ndarray, y: float) -> float:
    """
    Sample CRPS = E|X − y| − ½ E|X − X'| (kernel form of Gneiting & Raftery 2007).
    The second expectation is estimated over distinct pairs (i ≠ j), the unbiased
    "fair" estimator; the plug-in average over all n² pairs, diagonal included,
    under-estimates it and slightly penalises wider predictive distributions
    (corrected after independent review).
    """
    x = np.asarray(x, dtype=float)
    n = x.size
    first = float(np.mean(np.abs(x - y)))
    if n < 2:
        return first
    pair = float(np.sum(np.abs(x[:, None] - x[None, :])) / (n * (n - 1)))
    return first - 0.5 * pair


def score_organoid(samples: np.ndarray, observed_g: np.ndarray) -> dict:
    rows = []
    for j in range(samples.shape[1]):
        x, y = samples[:, j], float(observed_g[j])
        cov = {}
        for level in INTERVALS:
            lo, hi = np.quantile(x, [(1 - level) / 2, 1 - (1 - level) / 2])
            cov[f"in{int(level * 100)}"] = bool(lo <= y <= hi)
        rows.append({
            "stat": G_LABELS[j],
            "observed": y,
            "predictiveMedian": float(np.median(x)),
            "error": y - float(np.median(x)),
            "crps": crps_samples(x, y),
            "pit": float(np.mean(x <= y)),
            **cov,
        })
    joint95 = all(r["in95"] for r in rows)
    return {"perStatistic": rows, "jointIn95": joint95}


def bootstrap_mean(values: Sequence[float], n_boot: int, seed: int) -> dict:
    """Organoid-level bootstrap of a mean: resamples ORGANOIDS, never seeds or bins."""
    v = np.asarray(values, dtype=float)
    if v.size == 0:
        return {"mean": None, "ci95": None, "n": 0}
    rng = np.random.default_rng(seed)
    boots = [np.mean(v[rng.integers(0, v.size, v.size)]) for _ in range(n_boot)]
    return {"mean": float(v.mean()), "ci95": [float(np.quantile(boots, 0.025)), float(np.quantile(boots, 0.975))], "n": int(v.size)}


def evaluate_models(models: Sequence[Fitted], test: Sequence[dict], n_pred: int, seed: int, n_boot: int = 2000) -> dict:
    """
    test: [{"label", "T", "g"}]. For each model: per-organoid scores, mean CRPS
    per statistic with organoid-bootstrap CI, coverage rates, joint coverage.
    Predictive samples are drawn once per distinct window length T.
    """
    out: dict = {"models": {}, "comparisons": []}
    per_model_crps: Dict[str, List[float]] = {}
    for mi, model in enumerate(models):
        cache: Dict[float, np.ndarray] = {}
        organoids = []
        for t in test:
            T = round(float(t["T"]), 3)
            if T not in cache:
                cache[T] = predictive_samples(model, T, n_pred, seed + 1000 * (mi + 1) + int(T))
            sc = score_organoid(cache[T], np.asarray(t["g"]))
            organoids.append({"label": t["label"], "T": T, **sc})
        crps_by_org = [float(np.mean([r["crps"] for r in o["perStatistic"]])) for o in organoids]
        per_model_crps[model.name] = crps_by_org
        stats_summary = {}
        for j, lab in enumerate(G_LABELS):
            vals = [o["perStatistic"][j]["crps"] for o in organoids]
            stats_summary[lab] = {
                "meanCRPS": bootstrap_mean(vals, n_boot, seed + j),
                "coverage80": float(np.mean([o["perStatistic"][j]["in80"] for o in organoids])),
                "coverage95": float(np.mean([o["perStatistic"][j]["in95"] for o in organoids])),
                "meanAbsError": float(np.mean([abs(o["perStatistic"][j]["error"]) for o in organoids])),
            }
        out["models"][model.name] = {
            "kind": model.kind, "generator": model.generator, "nTrainingOrganoids": model.n_organoids,
            "organoids": organoids, "byStatistic": stats_summary,
            "meanCRPS": bootstrap_mean(crps_by_org, n_boot, seed + 99),
            "coverage95": float(np.mean([r["in95"] for o in organoids for r in o["perStatistic"]])),
            "jointCoverage95": float(np.mean([o["jointIn95"] for o in organoids])),
            "fit": model.detail,
        }
    names = [m.name for m in models]
    for a in range(len(names)):
        for b in range(a + 1, len(names)):
            diff = np.array(per_model_crps[names[a]]) - np.array(per_model_crps[names[b]])
            out["comparisons"].append({"a": names[a], "b": names[b], "meanCRPSdifference_a_minus_b": bootstrap_mean(diff, n_boot, seed + 7 * a + b),
                                       "noteEn": "Negative favours a. Organoid-level bootstrap; the statistics of one organoid are not independent of each other."})
    return out


# ════════════════════════════════════════════════════════════════════════
# Stratification, legacy verdict, dependence, provenance
# ════════════════════════════════════════════════════════════════════════

def read_subject_metadata(path: str) -> dict:
    """Subject and session metadata of an NWB file. Opens no spike table."""
    import h5py

    meta = {"file": os.path.basename(path)}
    with h5py.File(path, "r") as f:
        for key in ("general/subject/age", "general/subject/description", "general/subject/species",
                    "general/subject/subject_id", "general/session_description", "general/experiment_description",
                    "general/institution", "general/lab"):
            if key in f:
                v = f[key][()]
                meta[key.split("/")[-1]] = v.decode() if isinstance(v, bytes) else str(v)
    return meta


def stratify(records: Sequence[dict], keys: Sequence[str]) -> Dict[str, List[str]]:
    """Group record labels by the declared metadata keys (e.g. age, preparation)."""
    groups: Dict[str, List[str]] = {}
    for r in records:
        k = " | ".join(f"{key}={r.get(key, 'NA')}" for key in keys)
        groups.setdefault(k, []).append(r["label"])
    return groups


def legacy_verdict(sim_median_stats: Dict[str, float], real_stats: Sequence[Dict[str, float]]) -> dict:
    """E1/E2 rules (confront.verdict_for / global_verdict), kept as a SECONDARY, descriptive output."""
    verdicts = {k: C.verdict_for(k, sim_median_stats[k], [r[k] for r in real_stats]) for k in STAT_KEYS}
    return {"verdicts": verdicts, "global": C.global_verdict(verdicts),
            "noteEn": "Descriptive compatibility rule (min–max range with a factor-2 or ±0.05 band); not a confidence interval "
                      "nor an equivalence test. Secondary in E3."}


def statistic_dependence(g_rows: np.ndarray) -> dict:
    """Spearman correlation matrix among the five statistics (rows = organoids or predictive draws)."""
    if g_rows.shape[0] < 4:
        return {"matrix": None, "noteEn": "Fewer than 4 rows: dependence not estimated."}
    ranks = np.argsort(np.argsort(g_rows, axis=0), axis=0).astype(float)
    r = np.corrcoef(ranks.T)
    return {"labels": G_LABELS, "matrix": np.round(r, 3).tolist(),
            "noteEn": "The five statistics are dependent; counting several out-of-range statistics is not counting independent failures."}


def _lf_sha256(path: str) -> Optional[str]:
    try:
        with open(path, "rb") as fh:
            return hashlib.sha256(fh.read().replace(b"\r\n", b"\n")).hexdigest()
    except OSError:
        return None


def provenance_stamp(extra_files: Sequence[str] = ()) -> dict:
    """Ties an output to a commit (when the tree is a git clone) and to the hashes of the code it ran."""
    commit, dirty = None, None
    if os.path.isdir(os.path.join(ROOT, ".git")):
        try:
            commit = subprocess.run(["git", "rev-parse", "HEAD"], cwd=ROOT, capture_output=True, text=True, check=True).stdout.strip()
            dirty = bool(subprocess.run(["git", "status", "--porcelain"], cwd=ROOT, capture_output=True, text=True, check=True).stdout.strip())
        except (OSError, subprocess.CalledProcessError):
            pass
    files = ["empirical/confront.py", "empirical/e2_calibrate.py", "empirical/e3_analysis.py", PREREG, *extra_files]
    return {
        "utc": _dt.datetime.now(_dt.timezone.utc).isoformat(timespec="seconds"),
        "gitCommit": commit, "gitDirty": dirty,
        "treeNote": None if commit else "No git history in this tree (archive): cite the release tag and check MANIFEST.sha256.",
        "lfSha256": {f: _lf_sha256(os.path.join(ROOT, f)) for f in files},
        "python": platform.python_version(), "numpy": np.__version__,
    }


def prereg_is_filed(path: str = os.path.join(ROOT, PREREG)) -> bool:
    """True only once the draft's status line has been changed to a filed registration."""
    try:
        head = open(path, encoding="utf-8").read(2000)
    except OSError:
        return False
    return "BROUILLON NON DÉPOSÉ" not in head and "DÉPOSÉ" in head


# ════════════════════════════════════════════════════════════════════════
# Pipeline
# ════════════════════════════════════════════════════════════════════════

def window_group(T: float) -> float:
    """Training organoids are matched to a simulation bank of their own window length (to 10 s)."""
    return float(round(float(T) / 10.0) * 10.0)


def analyse(train: Sequence[dict], test: Sequence[dict], *, bank_size: int, k: int, n_pred: int, seed: int,
            n_boot: int = 2000, fixed_models: Sequence[Fitted] = ()) -> dict:
    """
    train/test: [{"label", "T", "stats": confront-style dict, optional metadata}].
    Fits, on the training organoids only: hierarchical network-burst (primary),
    pooled network-burst (E2-style), hierarchical desync control (same nine
    parameters, no shared timing); scores them, and any `fixed_models` (M0,
    M1-E2), on the test organoids. Each training organoid is matched to a bank
    simulated at its own window length (grouped to 10 s), so that 3-minute and
    10-minute recordings are not compared with one bank.
    """
    train_g = [g_transform(t["stats"]) for t in train]
    test_rows = [{"label": t["label"], "T": t["T"], "g": g_transform(t["stats"])} for t in test]
    groups = sorted({window_group(t["T"]) for t in train})
    banks_nb: Dict[float, Bank] = {}
    banks_ds: Dict[float, Bank] = {}
    for i, gT in enumerate(groups):
        T_bank = float(np.median([t["T"] for t in train if window_group(t["T"]) == gT]))
        banks_nb[gT] = build_bank("network-burst", T_bank, bank_size, seed + 1000 * i)
        banks_ds[gT] = build_bank("desync-control", T_bank, bank_size, seed + 50_000 + 1000 * i)
    per_nb = [banks_nb[window_group(t["T"])] for t in train]
    per_ds = [banks_ds[window_group(t["T"])] for t in train]
    pooled_bank = banks_nb[max(groups, key=lambda g: sum(window_group(t["T"]) == g for t in train))]
    models = [
        fit_hierarchical(per_nb, train_g, k, "M2-hierarchical-network-burst"),
        fit_pooled(pooled_bank, train_g, k, "M1-pooled-network-burst"),
        fit_hierarchical(per_ds, train_g, k, "C1-hierarchical-desync"),
        *fixed_models,
    ]
    ev = evaluate_models(models, test_rows, n_pred, seed + 1, n_boot)
    return {
        "preregistration": PREREG,
        "status": "draft analysis — not confirmatory unless the preregistration is filed",
        "design": {"bankSize": bank_size, "abcK": k, "predictiveDraws": n_pred, "bankWindowsS": [b.T for b in banks_nb.values()],
                   "seed": seed, "transform": G_LABELS, "intervals": list(INTERVALS)},
        "train": [t["label"] for t in train], "test": [t["label"] for t in test],
        "evaluation": ev,
        "dependenceObserved": statistic_dependence(np.array([r["g"] for r in test_rows])),
        "provenance": provenance_stamp(),
    }


def analyse_by_stratum(train: Sequence[dict], test: Sequence[dict], keys: Sequence[str], *, min_train: int, min_test: int,
                       **kw) -> dict:
    """PREREG-E3 §2–§3: fit and score within each stratum; a stratum below the minimum counts is declared not estimable."""
    st_train, st_test = stratify(train, keys), stratify(test, keys)
    out = {"keys": list(keys), "minTrain": min_train, "minTest": min_test, "strata": {}}
    for name in sorted(set(st_train) | set(st_test)):
        tr = [t for t in train if t["label"] in st_train.get(name, [])]
        te = [t for t in test if t["label"] in st_test.get(name, [])]
        if len(tr) < min_train or len(te) < min_test:
            out["strata"][name] = {"estimable": False, "nTrain": len(tr), "nTest": len(te),
                                   "noteEn": "Below the preregistered minimum counts: not estimable, and not merged with another stratum."}
        else:
            out["strata"][name] = {"estimable": True, "nTrain": len(tr), "nTest": len(te), **analyse(tr, te, **kw)}
    return out


def main(argv: Sequence[str]) -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    ins = sub.add_parser("inspect", help="subject metadata only — opens no spike table")
    ins.add_argument("files", nargs="+")
    run = sub.add_parser("run", help="fit on --train, score on --test")
    run.add_argument("--train", nargs="+", required=True)
    run.add_argument("--test", nargs="+", required=True)
    run.add_argument("--bank", type=int, default=2000)
    run.add_argument("--k", type=int, default=25)
    run.add_argument("--pred", type=int, default=100)
    run.add_argument("--seed", type=int, default=20261009)
    run.add_argument("--out", default=os.path.join(HERE, "results", "E3"))
    run.add_argument("--exploratory", action="store_true", help="allow a run before the preregistration is filed (output labelled exploratory)")
    run.add_argument("--strata", default="age,preparation", help="metadata keys defining the strata (PREREG-E3 §2)")
    run.add_argument("--preparation-field", default="description", help="metadata field read as 'preparation' (PREREG-E3 §2: À FIXER)")
    run.add_argument("--min-train", type=int, default=6)
    run.add_argument("--min-test", type=int, default=6)
    run.add_argument("--no-ts-models", action="store_true", help="skip M0 and M1-E2 (they need Node ≥ 20 for sim_export.ts)")
    a = ap.parse_args(argv)

    if a.cmd == "inspect":
        print(json.dumps([read_subject_metadata(f) for f in a.files], indent=2, ensure_ascii=False))
        return
    if not prereg_is_filed() and not a.exploratory:
        sys.exit(f"{PREREG} is not filed. A confirmatory E3 requires the completed, time-stamped preregistration. "
                 "Use --exploratory for a labelled exploratory run.")
    overlap = {os.path.basename(p) for p in a.train} & {os.path.basename(p) for p in a.test}
    if overlap:
        sys.exit(f"Training and test sets overlap: {sorted(overlap)}")
    seen = ("sub-HO1_", "sub-HO2_", "sub-HO3_", "sub-HO4_", "sub-HO5_", "sub-HO6_", "sub-HO7_", "sub-HO8_")
    reused = [os.path.basename(p) for p in a.test if os.path.basename(p).startswith(seen)]
    if reused and not a.exploratory:
        sys.exit(f"Test files already seen in E1/E2 cannot serve as E3 test data: {reused}")

    def load(paths):
        rows = []
        for p in paths:
            meta = read_subject_metadata(p)          # metadata first, then spikes
            rec = C.load_nwb_units(p)
            rows.append({"label": os.path.basename(p), "T": rec.window_s, "stats": C.statistics(rec),
                         "sha256": C.sha256(p), **meta, "preparation": meta.get(a.preparation_field, "NA")})
        return rows

    train, test = load(a.train), load(a.test)
    fixed = [] if a.no_ts_models else [ts_export_model("M0-E1-poisson", "poisson"), ts_export_model("M1-E2-frozen", "network-burst")]
    keys = [k.strip() for k in a.strata.split(",") if k.strip()]
    rep = {"preregistration": PREREG,
           "byStratum": analyse_by_stratum(train, test, keys, min_train=a.min_train, min_test=a.min_test,
                                           bank_size=a.bank, k=a.k, n_pred=a.pred, seed=a.seed, fixed_models=fixed),
           "provenance": provenance_stamp()}
    rep["exploratory"] = bool(a.exploratory or not prereg_is_filed())
    rep["files"] = {"train": [{k: r[k] for k in ("label", "sha256", "age", "preparation") if k in r} for r in train],
                    "test": [{k: r[k] for k in ("label", "sha256", "age", "preparation") if k in r} for r in test]}
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    out = a.out + ("_exploratory" if rep["exploratory"] else "") + ".json"
    with open(out, "w") as fh:
        json.dump(rep, fh, indent=2, default=float)
    print(f"wrote {out}")


if __name__ == "__main__":
    main(sys.argv[1:])
