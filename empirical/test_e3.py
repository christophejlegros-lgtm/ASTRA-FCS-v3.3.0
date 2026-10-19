#!/usr/bin/env python3
"""
Validation of the E3 analysis (empirical/e3_analysis.py) on synthetic ground truth.

Run: python3 empirical/test_e3.py        (≈ 1.5 min; numpy required, h5py optional)
     python3 empirical/test_e3.py --truth-seed 2 --tau 0.8 --summary-out out.json
                                          (another synthetic truth; writes the model summary)

What is checked, and why it matters for PREREG-E3-DRAFT.md:
  1. The fast S5 path returns exactly the numbers of the frozen confront.py.
  2. Scoring primitives: CRPS against closed forms, interval coverage, PIT,
     organoid-level bootstrap.
  3. On synthetic organoids drawn from a known two-level population:
     · the complexity-matched desync control is clearly worse (CRPS CI < 0):
       the bench detects the absence of shared burst timing;
     · the pooled, E2-style model is over-confident (95 % coverage well below
       nominal), the hierarchical model is calibrated or conservative —
       calibration, not CRPS alone, separates them at this sample size.
  4. Guards: no confirmatory run before the preregistration is filed; E1/E2
     organoids refused as E3 test data; provenance stamp carries file hashes.

© 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
"""
import json
import os
import sys
import tempfile

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import confront as C  # noqa: E402
import e3_analysis as A  # noqa: E402

COUNTS = {"PASS": 0, "FAIL": 0, "SKIP": 0}


def check(name, cond, detail=""):
    tag = "PASS" if cond else "FAIL"
    COUNTS[tag] += 1
    print(f"{tag} {name}" + (f"  [{detail}]" if detail else ""))
    return bool(cond)


def _arg(name, default, cast):
    argv = sys.argv[1:]
    return cast(argv[argv.index(name) + 1]) if name in argv else default


TRUTH_SEED = _arg("--truth-seed", 1, int)
TAU = _arg("--tau", 0.8, float)
SUMMARY_OUT = _arg("--summary-out", None, str)

ok = True
params = json.load(open(os.path.join(HERE, "results", "E2_calibration.json")))["params"]

# 1 — fast statistics ≡ frozen statistics
mx = 0.0
for seed, T in ((1, 60.0), (2, 120.0), (3, 60.0)):
    tr = A.simulate_network_burst(params, T, seed)
    rec = C.Recording("x", tr, T, T, "sim", 128)
    a, b = A.statistics_fast(rec), C.statistics(rec)
    mx = max(mx, max(abs(a[k] - b[k]) for k in A.STAT_KEYS))
ok &= check("statistics_fast ≡ confront.statistics (3 recordings)", mx == 0.0, f"max |Δ| = {mx}")

desync = A.statistics_fast(C.Recording("d", A.simulate_desync(params, 60.0, 4), 60.0, 60.0, "sim", 128))
nb = A.statistics_fast(C.Recording("n", A.simulate_network_burst(params, 60.0, 4), 60.0, 60.0, "sim", 128))
ok &= check("desync control keeps the rate, loses the network bursts",
            abs(np.log(desync["S1_rate_hz"] / nb["S1_rate_hz"])) < 0.4 and desync["S3_bursts_per_min"] < 0.5 * nb["S3_bursts_per_min"],
            f"S1 {desync['S1_rate_hz']:.3f} vs {nb['S1_rate_hz']:.3f}; S3 {desync['S3_bursts_per_min']:.2f} vs {nb['S3_bursts_per_min']:.2f}")

# 2 — scoring primitives
ok &= check("CRPS of a point mass = |x − y|", abs(A.crps_samples(np.zeros(50), 1.0) - 1.0) < 1e-12)
z = np.random.default_rng(0).standard_normal(4000)
ok &= check("CRPS of N(0,1) at 0 ≈ 2φ(0) − 1/√π = 0.2337", abs(A.crps_samples(z, 0.0) - 0.23369) < 0.01, f"{A.crps_samples(z, 0.0):.4f}")
sc = A.score_organoid(np.tile(np.arange(100.0)[:, None], (1, 5)), np.array([50.0, 1.0, 99.5, 200.0, 50.0]))
flags = [(r["in95"], r["in80"]) for r in sc["perStatistic"]]
ok &= check("interval coverage flags", flags[0] == (True, True) and flags[1] == (False, False) and flags[3] == (False, False) and not sc["jointIn95"])
ok &= check("PIT of the median ≈ 0.5", abs(sc["perStatistic"][0]["pit"] - 0.51) < 0.02)
bs = A.bootstrap_mean([1.0, 2.0, 3.0, 4.0], 500, 1)
ok &= check("organoid bootstrap: mean and CI bracket", bs["mean"] == 2.5 and bs["ci95"][0] < 2.5 < bs["ci95"][1] and bs["n"] == 4)
groups = A.stratify([{"label": "a", "age": "P100D"}, {"label": "b", "age": "P7M"}, {"label": "c", "age": "P100D"}], ("age",))
ok &= check("stratification by metadata", groups == {"age=P100D": ["a", "c"], "age=P7M": ["b"]})

# 3 — synthetic two-level population: known truth
rng = np.random.default_rng(TRUTH_SEED)
mu = A.to_u(np.array([params[n] for n in A.PARAM_NAMES]))
tau = np.zeros(len(mu))
tau[[0, 3, 5, 7]] = TAU          # between-organoid spread on burst rate, participation, background rate, cluster size


def organoid(i):
    th = A.from_u(mu + tau * rng.standard_normal(len(mu)))
    tr = A.simulate_network_burst(A.as_params(th), 60.0, 1000 + i)
    return {"label": f"syn{i}", "T": 60.0, "stats": C.statistics(C.Recording("x", tr, 60.0, 60.0, "sim", 128))}


train = [organoid(i) for i in range(6)]
test = [organoid(100 + i) for i in range(6)]
rep = A.analyse(train, test, bank_size=250, k=15, n_pred=40, seed=7, n_boot=500,
                fixed_models=[A.fixed_python_model("M1-E2-frozen (python prototype)", "network-burst", params)])
M = rep["evaluation"]["models"]
m2, m1, c1 = M["M2-hierarchical-network-burst"], M["M1-pooled-network-burst"], M["C1-hierarchical-desync"]
cmp = {(c["a"], c["b"]): c["meanCRPSdifference_a_minus_b"] for c in rep["evaluation"]["comparisons"]}
d_c1 = cmp[("M2-hierarchical-network-burst", "C1-hierarchical-desync")]
ok &= check("every test organoid is scored as a unit", all(len(m["organoids"]) == 6 for m in M.values()))
ok &= check("hierarchical beats the complexity-matched desync control (CRPS, CI < 0)",
            d_c1["ci95"][1] < 0, f"Δ = {d_c1['mean']:.3f}, CI {np.round(d_c1['ci95'], 3).tolist()}")
ok &= check("hierarchical 95 % coverage is near or above nominal (≥ 0.85)", m2["coverage95"] >= 0.85, f"{m2['coverage95']:.3f}")
ok &= check("pooled (E2-style) model is over-confident: coverage below the hierarchical one",
            m1["coverage95"] < m2["coverage95"] and m1["coverage95"] < 0.85, f"pooled {m1['coverage95']:.3f} vs hierarchical {m2['coverage95']:.3f}")
ok &= check("joint 95 % coverage: hierarchical > pooled", m2["jointCoverage95"] > m1["jointCoverage95"],
            f"{m2['jointCoverage95']:.2f} vs {m1['jointCoverage95']:.2f}")
ok &= check("dependence among statistics is reported", rep["dependenceObserved"]["matrix"] is not None)
lv = A.legacy_verdict({k: float(np.median([t["stats"][k] for t in train])) for k in A.STAT_KEYS}, [t["stats"] for t in test])
ok &= check("legacy E1/E2 verdict kept as a secondary output", lv["global"] in ("ADEQUATE", "PARTIALLY ADEQUATE", "INADEQUATE"), lv["global"])

strat = A.analyse_by_stratum(train[:2], test[:2], ("age",), min_train=6, min_test=6,
                             bank_size=10, k=5, n_pred=5, seed=1, n_boot=10)
ok &= check("a stratum below the minimum counts is declared not estimable (no fit, no merge)",
            all(not v["estimable"] for v in strat["strata"].values()), json.dumps({k: v["nTrain"] for k, v in strat["strata"].items()}))
ok &= check("fair CRPS: two-point predictive {0, 2} at y = 1 equals 1 − ½·2 = 0", abs(A.crps_samples(np.array([0.0, 2.0]), 1.0)) < 1e-12)

if SUMMARY_OUT:
    summary_rows = {name: {"coverage95": m["coverage95"], "jointCoverage95": m["jointCoverage95"],
                           "meanCRPS": m["meanCRPS"]} for name, m in M.items()}
    with open(SUMMARY_OUT, "w") as fh:
        json.dump({"truthSeed": TRUTH_SEED, "tau": TAU, "models": summary_rows,
                   "comparisons": rep["evaluation"]["comparisons"]}, fh, indent=2)
    print(f"summary written to {SUMMARY_OUT}")

# 4 — guards and provenance
prov = rep["provenance"]
ok &= check("provenance stamp hashes the frozen and E3 code",
            all(prov["lfSha256"][f] for f in ("empirical/confront.py", "empirical/e2_calibrate.py", "empirical/e3_analysis.py")))
ok &= check("the E3 draft is not filed, so no confirmatory run is possible", not A.prereg_is_filed())
try:
    A.main(["run", "--train", "x.nwb", "--test", "y.nwb"])
    refused = False
except SystemExit as e:
    refused = "not filed" in str(e)
ok &= check("`run` refuses a confirmatory analysis before filing", refused)
try:
    A.main(["run", "--exploratory", "--train", "a.nwb", "--test", "a.nwb"])
    overlap_refused = False
except SystemExit as e:
    overlap_refused = "overlap" in str(e)
ok &= check("`run` refuses overlapping training and test sets", overlap_refused)

try:
    import h5py  # noqa: F401
    with tempfile.TemporaryDirectory() as d:
        p = os.path.join(d, "meta.nwb")
        with h5py.File(p, "w") as f:
            f["general/subject/age"] = "P100D"
            f["general/subject/description"] = "synthetic organoid"
            f.create_group("units")["spike_times"] = np.array([0.1, 0.2])
        meta = A.read_subject_metadata(p)
    ok &= check("metadata reader returns age without reading spikes", meta.get("age") == "P100D", json.dumps(meta))
except ImportError:
    COUNTS["SKIP"] += 1
    print("SKIP metadata reader  [h5py not installed]")

summary = f"{COUNTS['PASS']} PASS · {COUNTS['FAIL']} FAIL · {COUNTS['SKIP']} SKIP"
print(("\nALL PASS — " if ok and not COUNTS["SKIP"] else "\nPASS WITH SKIPS — " if ok else "\nSOME FAILED — ") + summary)
sys.exit(0 if ok else 1)
