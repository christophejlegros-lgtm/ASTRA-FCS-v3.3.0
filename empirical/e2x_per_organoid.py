#!/usr/bin/env python3
"""
E2x — EXPLORATORY, post hoc, no bearing on the preregistered E2 verdict (v3.2.0).

Re-reads the published E2 result (results/E2.json) organoid by organoid. It
needs no recording: every number comes from the JSON written on 28·09·2026.

Why (analysis of 9 October 2026, §4.1): the preregistered rule compares the
median over organoids of the duration-matched simulated medians with the
min–max range over organoids. That rule can (i) be eased by a wide range when
organoids are heterogeneous, and (ii) mask organoid-level departures. Ten seeds
measure the generator's variability, not ten biological replicates. This
script makes both visible:
  · per organoid and statistic, the error on the E3 scale (g-transform of
    e3_analysis.py) between the real value and the matched simulated median;
  · whether the real value lies inside the envelope of the ten seeds — a
    predictive band built from seed noise alone.

Usage: python3 -I empirical/e2x_per_organoid.py   →  results/exploratory/E2x_per_organoid.json
© 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
"""
import json
import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from e3_analysis import g_transform, G_LABELS, STAT_KEYS  # noqa: E402


def per_organoid(path):
    rep = json.load(open(path))
    rows = []
    for real, sim in zip(rep["real"], rep["simulated"]):
        assert sim["matched_to"] == real["file"]
        g_real = g_transform(real)
        g_med = g_transform(sim["median"])
        seeds = np.array([[s[k] for k in STAT_KEYS] for s in sim["per_seed"]])
        stats = []
        for j, key in enumerate(STAT_KEYS):
            lo, hi = float(np.min(seeds[:, j])), float(np.max(seeds[:, j]))
            stats.append({
                "stat": key, "scale": G_LABELS[j], "real": real[key], "simMedian": sim["median"][key],
                "error": float(g_real[j] - g_med[j]), "seedEnvelope": [lo, hi],
                "insideSeedEnvelope": bool(lo <= real[key] <= hi),
            })
        rows.append({"organoid": real["file"].split("_")[0], "windowS": real["window_s"], "stats": stats})
    return rep, rows


def main():
    out = {"status": "EXPLORATORY · post hoc · no bearing on the preregistered E2 verdict",
           "source": "empirical/results/E2.json (and E2_control_poisson.json), 28·09·2026",
           "noteEn": "Error = g(real) − g(simulated median) on the E3 scales (log S1, log S2, log(S3+0.1), log(S4+0.01), S5). "
                     "The seed envelope reflects generator noise only: it is not a predictive interval for an unseen organoid.",
           "models": {}}
    for label, fname in (("network-burst (E2 candidate)", "E2.json"), ("poisson (E2 control)", "E2_control_poisson.json")):
        rep, rows = per_organoid(os.path.join(HERE, "results", fname))
        inside = [s["insideSeedEnvelope"] for r in rows for s in r["stats"]]
        out["models"][label] = {
            "pooledVerdicts": rep.get("verdicts"), "pooledGlobal": rep.get("global_verdict"),
            "organoids": rows,
            "shareInsideSeedEnvelope": float(np.mean(inside)),
            "maxAbsErrorByStatistic": {G_LABELS[j]: float(max(abs(r["stats"][j]["error"]) for r in rows)) for j in range(5)},
        }
    dest = os.path.join(HERE, "results", "exploratory", "E2x_per_organoid.json")
    with open(dest, "w") as fh:
        json.dump(out, fh, indent=2)
    m = out["models"]["network-burst (E2 candidate)"]
    print(f"wrote {dest}")
    print(f"pooled verdicts: {m['pooledVerdicts']} → {m['pooledGlobal']}")
    print(f"share of (organoid, statistic) cells inside the 10-seed envelope: {m['shareInsideSeedEnvelope']:.2f}")
    print("organoid   " + "  ".join(f"{lab:>13}" for lab in G_LABELS))
    for r in m["organoids"]:
        print(f"{r['organoid']:<10} " + "  ".join(f"{s['error']:+13.2f}{'*' if s['insideSeedEnvelope'] else ' '}"[:14] for s in r["stats"]))
    print("(* real value inside the seed envelope)")


if __name__ == "__main__":
    main()
