"""Render deck figures (WebP) and chart data (JSON) from the pipeline outputs in ./out.
Pixels here are only contrast-stretched / low-pass filtered / cropped versions of the
experimental, recomputed or simulated arrays -- no generative imagery.
Usage: python3 make_figures.py OUT_DIR FIG_DIR JSON_DIR
"""
import sys, os, json, numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter
from scipy.spatial import cKDTree

src, figd, jsond = sys.argv[1:4]
os.makedirs(figd, exist_ok=True); os.makedirs(jsond, exist_ok=True)
manifest = []

def to8(a, lo=1, hi=99, invert=False):
    a = np.asarray(a, np.float64); l, h = np.percentile(a, lo), np.percentile(a, hi)
    b = np.clip((a - l) / (h - l + 1e-12), 0, 1)
    if invert: b = 1 - b
    return (b * 255).astype(np.uint8)

def save(name, arr8, scale=1, note="", kind=""):
    im = Image.fromarray(arr8)
    if scale != 1: im = im.resize((int(im.width * scale), int(im.height * scale)), Image.LANCZOS)
    p = os.path.join(figd, name + ".webp"); im.save(p, "WEBP", quality=88, method=6)
    manifest.append(dict(file="figures/" + name + ".webp", width=im.width, height=im.height, note=note, kind=kind))
    return im.size

def dump(name, obj):
    json.dump(obj, open(os.path.join(jsond, name + ".json"), "w"), separators=(",", ":"))

# ---------- s01 / s08: real micrograph with categorised picks ----------
d = np.load(os.path.join(src, "mic_15_30_21.npz"))
img = d["img"]; THR = 2.0
y0, x0, S = 260, 300, 640                        # crop includes the carbon edge (lower left)
crop = img[y0:y0+S, x0:x0+S]
save("s01_mic_raw", to8(crop, 0.5, 99.5), 1.5, "EMPIAR-10017 Falcon_2012_06_12-15_30_21_0, binned 4x (7.08 A/px), crop", "EXPERIMENTAL DATA")
save("s01_mic_lp", to8(gaussian_filter(crop, 2.5), 0.5, 99.5), 1.5, "same crop, Gaussian low-pass sigma 2.5 px (~18 A)", "EXPERIMENTAL DATA (filtered)")
t = d["truth"]; p = d["picks"]; s = d["scores"]; R = float(d["radius_binned"])
inside = lambda q: (q[:, 0] >= x0) & (q[:, 0] < x0 + S) & (q[:, 1] >= y0) & (q[:, 1] < y0 + S)
acc = s >= THR
pa = p[acc]
dist, j = cKDTree(t).query(pa, distance_upper_bound=R)
used = set(); match = np.zeros(len(pa), bool)
for i in np.argsort(dist):
    if np.isfinite(dist[i]) and j[i] not in used: used.add(j[i]); match[i] = True
fn = np.array([k not in used for k in range(len(t))])
# 'rejected' = candidates the model scored just below threshold (0 <= s < THR), not matched to any expert pick
rej = p[(s >= 0) & (s < THR)]
if len(rej):
    dr, _ = cKDTree(t).query(rej, distance_upper_bound=R); rej = rej[~np.isfinite(dr)]
def pts(q): q = q[inside(q)]; return [[round(float(a - x0) / S, 4), round(float(b - y0) / S, 4)] for a, b in q]
dump("s01_overlay", dict(threshold=THR, radius_frac=R / S, matched=pts(pa[match]), model_only=pts(pa[~match]), expert_only=pts(t[fn]),
                         rejected=pts(rej)[:40], apix=float(d["apix"]), crop_px=S, scale_bar_A=500))

# ---------- s10: precision-recall data ----------
ev = json.load(open(os.path.join(src, "eval_pretrained.json")))
curve = [dict(t=r["threshold"], n=r["picks"], p=r["precision"], r=r["recall"], f1=r["f1"]) for r in ev["curve"]]
pu = json.load(open(os.path.join(src, "eval_pu25_test.json"))); pt = json.load(open(os.path.join(src, "eval_pretrained_test.json")))
dump("s10_pr", dict(n_truth=ev["n_truth"], micrographs=len(ev["micrographs"]), radius_px=ev["match_radius_px"], best=ev["best_f1"], curve=curve,
                    heldout=dict(n_truth=pu["n_truth"], pu25=pu["best_f1"], pretrained=pt["best_f1"])))

c = np.load(os.path.join(src, "classes_thr2.npz"))
for name in ("tp", "fp", "fn"):
    cls, cnt = c[name + "_classes"], c[name + "_counts"]
    keep = [k for k in range(len(cnt)) if cnt[k] >= 15][:6]
    tiles = [to8(gaussian_filter(cls[k], 0.6), 1, 99.5) for k in keep]
    row = np.concatenate([np.pad(tl, 2, constant_values=11) for tl in tiles], 1)
    save(f"s10_classes_{name}", row, 2.0, f"simplified 2D classes of {name} picks (EMPIAR-10017, Topaz thr 2.0)", "RECOMPUTED RESULT")
    dump(f"s10_classes_{name}", dict(counts=[int(cnt[k]) for k in keep], total=int(c[f"n_{name}"])))

# ---------- s07: motion correction ----------
m = np.load(os.path.join(src, "mc_00021.npz"))
g = m["global_shifts_px"] * float(m["apix"])
pt_ = m["patch_traj_px"] * float(m["apix"])
mag = np.abs(pt_).max(axis=(2, 3))
dump("s07_motion", dict(apix=float(m["apix"]), dose_per_frame=float(m["dose_per_frame"]), global_A=[[round(float(a), 2), round(float(b), 2)] for a, b in g],
                        total_drift_A=round(float(np.linalg.norm(g[-1])), 1),
                        patches=[[dict(i=i, j=j, traj=[[round(float(a), 2), round(float(b), 2)] for a, b in pt_[i, j]], max_A=round(float(mag[i, j]), 1))
                                  for j in range(pt_.shape[1])] for i in range(pt_.shape[0])],
                        outlier=[int(v) for v in np.unravel_index(np.argmax(mag), mag.shape)]))
profiles = {}
for k in ("psd_unaligned", "psd_aligned"):
    ps = m[k]; n = ps.shape[0]; cz = ps[n//2 - 384:n//2 + 384, n//2 - 384:n//2 + 384]
    yy, xx = np.mgrid[-384:384, -384:384]; r = np.hypot(yy, xx); ri = r.astype(int)
    prof = np.bincount(ri.ravel(), cz.ravel()) / np.bincount(ri.ravel())
    # smooth background (rings are radial, so only a heavily smoothed profile may be removed)
    from scipy.ndimage import gaussian_filter1d
    bg = gaussian_filter1d(prof, 12)
    flat = cz - bg[ri]; flat[r < 10] = 0
    c0 = 384 - 150
    save("s07_" + k, to8(gaussian_filter(flat[c0:c0+300, c0:c0+300], 1.0), 1, 99.5), 2.0, f"{k}: periodogram-averaged power spectrum (1024 px tiles), centre 300x300 of 1024 (edge = 1/6.0 A^-1), smooth radial background subtracted", "RECOMPUTED RESULT")
    profiles[k] = (prof - bg)[:384]
freq = np.arange(384) / (1024 * float(m["apix"]))
dump("s07_thon", dict(freq=[round(float(v), 5) for v in freq[8:]], unaligned=[round(float(v), 4) for v in profiles["psd_unaligned"][8:]],
                      aligned=[round(float(v), 4) for v in profiles["psd_aligned"][8:]]))
un, al = m["unaligned"], m["aligned_dw"]
cy, cx = un.shape[0] // 2, un.shape[1] // 2
for k, a in (("unaligned", un), ("aligned_dw", al)):
    cr = a[cy - 300:cy + 300, cx - 300:cx + 300]
    save("s07_sum_" + k, to8(gaussian_filter(cr, 1.2), 0.5, 99.5), 1.0, f"{k} frame sum, binned 2x (1.77 A/px), centre crop, low-pass sigma 1.2 px", "RECOMPUTED RESULT")
fp = m["frames_preview"]
save("s05_frame0", to8(gaussian_filter(fp[0], 1.5), 0.5, 99.5), 1.0, "single raw frame 1 of 49 (gain-corrected, binned 8x)", "EXPERIMENTAL DATA")

# ---------- s04: image formation simulation ----------
f = np.load(os.path.join(src, "imgform.npz"))
for k in ("clean", "ctfd", "noisy"):
    row = np.concatenate([np.pad(to8(f[k][i], 0.5, 99.5), 2, constant_values=11) for i in range(4)], 1)
    save(f"s04_{k}", row, 1.5, f"{k} projections, PDB 6CVM simulation (seed 561)", "SIMULATION")
row = np.concatenate([np.pad(to8(a, 0.5, 99.5), 2, constant_values=11) for a in f["avgs"]], 1)
save("s04_avgs", row, 1.5, "average of N aligned noisy copies, N = 1,10,100,1000", "SIMULATION")
row = np.concatenate([np.pad(to8(gaussian_filter(a, 0.8), 0.5, 99.8), 2, constant_values=11) for a in f["rec_slices"]] + [np.pad(to8(f["truth_slice"], 0.5, 99.8), 2, constant_values=11)], 1)
save("s04_recs", row, 1.5, "central slice of reconstructions from 30, 300, 3000, 30000 views (known poses) + truth", "SIMULATION")
dump("s04_ctf", dict(k=[round(float(v), 5) for v in f["ctf_k"]], ctf=[round(float(v), 4) for v in f["ctf_1d"]], defocus_um=float(f["defocus_A"]) / 1e4,
                     kv=int(f["kv"]), cs_mm=float(f["cs_mm"]), amp=float(f["amp_contrast"]), recn=[int(v) for v in f["rec_n"]], avgn=[int(v) for v in f["avg_n"]]))

# ---------- s03 / s05 / s14: tomogram simulation ----------
tm = np.load(os.path.join(src, "tomo.npz"))
rec = tm["rec"]; tr = tm["truth"]
xy = rec[44:52].mean(0)
save("s03_tomo_xy", to8(gaussian_filter(xy, 1.0), 1, 99.5, invert=True), 2.0, "simulated tomogram, x-y slab (z 44-51), 8 A/px, +/-60 deg WBP, inverted contrast", "SIMULATION")
save("s14_wedge_truth", to8(gaussian_filter(tr[:, 200, :], 0.5), 0.5, 99.8, invert=True), 2.5, "x-z slice of simulated truth", "SIMULATION")
save("s14_wedge_rec", to8(tm["wedge_clean_xz_y200"], 0.5, 99.8, invert=True), 2.5, "x-z slice reconstructed from noise-free +/-60 deg tilt series", "SIMULATION")
save("s14_wedge_full", to8(tm["full_xz_y200"], 0.5, 99.8, invert=True), 2.5, "x-z slice reconstructed from full 180 deg (impossible in practice)", "SIMULATION")
lab = tm["labels"]; cls = tm["label_class"]
sel = (lab[:, 0] >= 40) & (lab[:, 0] < 56)
dump("s05_subtomo", dict(points=[[round(float(x) / rec.shape[2], 4), round(float(y) / rec.shape[1], 4), str(k)] for (z, y, x), k in zip(lab[sel], cls[sel])]))
# tilt series stills: projections of the truth at -60, 0, +60 (x-z rotation about y)
from scipy.ndimage import rotate as rot
tilts = []
for ang in (-60, -30, 0, 30, 60):
    v = rot(tr, ang, axes=(0, 2), reshape=False, order=1)
    pr = v.sum(0); pr = pr + np.random.default_rng(561 + ang).normal(0, pr.std() * 0.8, pr.shape)
    tilts.append(np.pad(to8(gaussian_filter(pr, 0.8), 1, 99, invert=True), 2, constant_values=11))
save("s05_tilts", np.concatenate(tilts, 1), 0.8, "simulated tilt-series images at -60,-30,0,30,60 deg", "SIMULATION")

# ---------- s05: particle boxes ----------
img2 = np.load(os.path.join(src, "mic_15_07_41.npz"))
im = img2["img"]; tt = img2["truth"]
boxes = []
for (x, y) in tt[:200]:
    x, y = int(x), int(y)
    if 80 <= x < im.shape[1] - 80 and 80 <= y < im.shape[0] - 80:
        boxes.append(np.pad(to8(gaussian_filter(im[y-20:y+20, x-20:x+20], 1.0), 1, 99), 1, constant_values=11))
    if len(boxes) == 8: break
save("s05_boxes", np.concatenate(boxes, 1), 2.0, "8 extracted particle boxes at expert coordinates (EMPIAR-10017, 7.08 A/px, 283 A box)", "EXPERIMENTAL DATA")

# ---------- s11: validation json ----------
v = json.load(open(os.path.join(src, "validation.json")))
dump("s11_fsc", dict(freq=[round(x, 5) for x in v["fsc_freq"]], masked=[round(x, 4) for x in v["fsc_masked"]], unmasked=[round(x, 4) for x in v["fsc_unmasked"]],
                     res_masked=round(v["res_masked_A"], 2), res_unmasked=round(v["res_unmasked_A"], 2), B=round(v["guinier_B"], 1), loc=v["locres_percentiles"], author_res=2.5))
json.dump(manifest, open(os.path.join(figd, "_generated_manifest.json"), "w"), indent=1)
print(len(manifest), "figures")
