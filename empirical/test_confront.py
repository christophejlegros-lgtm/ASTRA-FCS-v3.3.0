#!/usr/bin/env python3
"""
Validation of the E1 bench on synthetic data whose answer is known.

Run:  python3 empirical/test_confront.py            # h5py optional: NWB checks reported SKIP
      python3 empirical/test_confront.py --strict   # h5py required (CI): a missing h5py is a FAILURE

v3.2.0. The epistemological analysis of 9 October 2026 (§1) ran this bench in an
environment without h5py: fifteen checks printed PASS, then the script stopped
with an ImportError — which is neither a pass nor a fail of the bench. The NWB
end-to-end checks are now reported explicitly as SKIP (with the reason) unless
--strict is given, and the summary counts PASS / FAIL / SKIP separately: a run
with skipped checks never prints "ALL PASS".
"""
import json
import os
import sys
import tempfile

import numpy as np

STRICT = "--strict" in sys.argv[1:]

sys.path.insert(0, os.path.dirname(__file__))
import confront as C  # noqa: E402

rng = np.random.default_rng(0)
T = 300.0


def poisson(rate, T=T):
    n = rng.poisson(rate * T)
    return np.sort(rng.uniform(0, T, n))


def bursty_network(n_trains=40, period=5.0, T=T, burst_dur=0.1, spikes_per_burst=8, bg=0.2):
    """All trains fire together in short bursts every `period` s, plus sparse background."""
    onsets = np.arange(1.0, T - 1.0, period)
    trains = []
    for _ in range(n_trains):
        s = [o + rng.uniform(0, burst_dur, spikes_per_burst) for o in onsets]
        s.append(poisson(bg, T))
        trains.append(np.sort(np.concatenate(s)))
    return trains, len(onsets)


COUNTS = {"PASS": 0, "FAIL": 0, "SKIP": 0}


def check(name, cond, detail=""):
    tag = "PASS" if cond else "FAIL"
    COUNTS[tag] += 1
    print(f"{tag} " + name + (f"  [{detail}]" if detail else ""))
    return cond


def skip(name, reason):
    COUNTS["SKIP"] += 1
    print(f"SKIP {name}  [{reason}]")


ok = True

# STTC sanity
a = poisson(5)
ok &= check("STTC(identical) = 1", abs(C.sttc(a, a.copy(), T) - 1) < 1e-9, f"{C.sttc(a, a.copy(), T):.4f}")
b = poisson(5)
v = C.sttc(a, b, T)
ok &= check("STTC(independent Poisson) ≈ 0", abs(v) < 0.05, f"{v:.4f}")

# Independent Poisson population → CV≈1, no network bursts, STTC≈0
pois = [poisson(r) for r in rng.uniform(0.5, 5, 60)]
rec = C.Recording("poisson", pois, T, T, "synthetic", len(pois))
s = C.statistics(rec)
ok &= check("Poisson: S2 ≈ 1", abs(s["S2_isi_cv"] - 1) < 0.1, f"{s['S2_isi_cv']:.3f}")
ok &= check("Poisson: S3 ≈ 0 bursts/min", s["S3_bursts_per_min"] < 0.5, f"{s['S3_bursts_per_min']:.3f}")
ok &= check("Poisson: S5 ≈ 0", abs(s["S5_sttc"]) < 0.05, f"{s['S5_sttc']:.4f}")

# Bursty synchronous network → bursts detected at the right rate, high STTC, CV > 1
tr, nb = bursty_network()
rec = C.Recording("bursty", tr, T, T, "synthetic", len(tr))
s = C.statistics(rec)
expected = nb / (T / 60)
ok &= check("Bursty: S3 ≈ true burst rate", abs(s["S3_bursts_per_min"] - expected) / expected < 0.1,
            f"{s['S3_bursts_per_min']:.2f} vs {expected:.2f}")
ok &= check("Bursty: S4 > 0.7", s["S4_frac_in_bursts"] > 0.7, f"{s['S4_frac_in_bursts']:.3f}")
ok &= check("Bursty: S5 > 0.5", s["S5_sttc"] > 0.5, f"{s['S5_sttc']:.3f}")
ok &= check("Bursty: S2 > 1.5", s["S2_isi_cv"] > 1.5, f"{s['S2_isi_cv']:.3f}")

# Decision rules
ok &= check("verdict compatible", C.verdict_for("S1_rate_hz", 1.0, [0.5, 2.0]) == "compatible")
ok &= check("verdict marginal", C.verdict_for("S1_rate_hz", 3.0, [0.5, 2.0]) == "marginal")
ok &= check("verdict incompatible", C.verdict_for("S1_rate_hz", 5.0, [0.5, 2.0]) == "incompatible")
ok &= check("verdict STTC abs band", C.verdict_for("S5_sttc", 0.02, [0.06, 0.3]) == "marginal")
ok &= check("global INADEQUATE", C.global_verdict({"a": "incompatible", "b": "incompatible", "c": "compatible"}) == "INADEQUATE")
ok &= check("global ADEQUATE", C.global_verdict({"a": "compatible", "b": "compatible", "c": "compatible", "d": "marginal"}) == "ADEQUATE")

# End-to-end: synthetic NWB-like files through the loader (requires h5py)
NWB_CHECKS = ("NWB loader: 20 units, window ≤ 300 s, offset removed",
              "End-to-end: Poisson model vs bursty 'real' data → INADEQUATE")
try:
    import h5py  # noqa: F401
    HAVE_H5PY = True
except ImportError:
    HAVE_H5PY = False

if not HAVE_H5PY:
    if STRICT:
        for name in NWB_CHECKS:
            ok &= check(name, False, "h5py not installed and --strict given")
    else:
        for name in NWB_CHECKS:
            skip(name, "h5py not installed — pip install h5py, or run with --strict to make this a failure")
else:
    with tempfile.TemporaryDirectory() as d:
        paths = []
        for k in range(3):
            trs, _ = bursty_network(n_trains=20)
            flat = np.concatenate(trs) + 1000.0          # non-zero session offset
            idx = np.cumsum([t.size for t in trs])
            p = os.path.join(d, f"syn{k}.nwb")
            with h5py.File(p, "w") as f:
                g = f.create_group("units")
                g["spike_times"] = flat
                g["spike_times_index"] = idx
            paths.append(p)
        rec = C.load_nwb_units(paths[0])
        ok &= check(NWB_CHECKS[0],
                    rec.n_units_total == 20 and rec.window_s <= T and min(t.min() for t in rec.trains if t.size) >= 0,
                    f"units={rec.n_units_total} T={rec.window_s:.1f}")
        sims = []
        for p in paths:
            r = C.load_nwb_units(p)
            sp = os.path.join(d, os.path.basename(p) + ".sim.json")
            with open(sp, "w") as fh:
                json.dump({"durationSec": r.window_s,
                           "runs": [{"seed": sd, "trains": [poisson(2, r.window_s).tolist() for _ in range(30)]}
                                    for sd in (1, 2, 3)]}, fh)
            sims.append(sp)
        report = C.run(paths, sims, os.path.join(d, "out/E1"))
        ok &= check(NWB_CHECKS[1], report["global_verdict"] == "INADEQUATE", report["global_verdict"])

summary = f"{COUNTS['PASS']} PASS · {COUNTS['FAIL']} FAIL · {COUNTS['SKIP']} SKIP"
if not ok:
    print(f"\nSOME FAILED — {summary}")
elif COUNTS["SKIP"]:
    print(f"\nPASS WITH SKIPS — {summary} (the skipped checks were not run; this is not a full pass)")
else:
    print(f"\nALL PASS — {summary}")
sys.exit(0 if ok else 1)
