"""Score particle picks against expert coordinates (EMPIAR-10017, R. Henderson manual picks).
Greedy one-to-one matching within a radius (px, original 1.77 A/px sampling).
Usage: python eval_picks.py PICKS.txt COORD_DIR OUT.json [--radius 40] [--micrographs a,b,c]
"""
import sys, json, glob, os, argparse
import numpy as np
from scipy.spatial import cKDTree

ap = argparse.ArgumentParser()
ap.add_argument("picks"); ap.add_argument("coord_dir"); ap.add_argument("out")
ap.add_argument("--radius", type=float, default=40.0)
ap.add_argument("--micrographs", default=None)
a = ap.parse_args()

picks = {}
for line in open(a.picks).read().splitlines()[1:]:
    n, x, y, s = line.split("\t"); picks.setdefault(n, []).append((float(x), float(y), float(s)))
names = sorted(os.path.basename(f)[:-6] for f in glob.glob(os.path.join(a.coord_dir, "*.coord")))
if a.micrographs: names = [n for n in names if n in a.micrographs.split(",")]
truth = {n: np.loadtxt(os.path.join(a.coord_dir, n + ".coord"), ndmin=2)[:, :2] for n in names}

def match(n, thr):
    p = np.array([q[:2] for q in picks.get(n, []) if q[2] >= thr]).reshape(-1, 2)
    t = truth[n]
    if len(p) == 0: return 0, 0, len(t)
    d, j = cKDTree(t).query(p, distance_upper_bound=a.radius)
    order = np.argsort(d); used = set(); tp = 0
    for i in order:
        if np.isfinite(d[i]) and j[i] not in used: used.add(j[i]); tp += 1
    return tp, len(p) - tp, len(t) - tp

rows = []
smax = max(q[2] for v in picks.values() for q in v)
for thr in np.round(np.arange(-6, np.ceil(smax) + 0.01, 0.25), 2):
    TP = FP = FN = 0
    for n in names:
        tp, fp, fn = match(n, thr); TP += tp; FP += fp; FN += fn
    P = TP / (TP + FP) if TP + FP else 1.0; R = TP / (TP + FN)
    F = 2 * P * R / (P + R) if P + R else 0
    rows.append(dict(threshold=float(thr), picks=TP + FP, tp=TP, fp=FP, fn=FN, precision=round(P, 4), recall=round(R, 4), f1=round(F, 4)))
best = max(rows, key=lambda r: r["f1"])
json.dump(dict(picks_file=os.path.basename(a.picks), micrographs=names, n_truth=int(sum(len(t) for t in truth.values())),
               match_radius_px=a.radius, pixel_A=1.77, best_f1=best, curve=rows), open(a.out, "w"), indent=1)
print("truth", sum(len(t) for t in truth.values()), "best", best)
for r in rows[::4]: print(r)
