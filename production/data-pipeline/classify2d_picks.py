"""Simplified reference-free 2D classification (teaching implementation, NOT RELION/cryoSPARC).
Used to ask: are Topaz picks that have no matching expert label junk, or real particles the
expert skipped?  Data: EMPIAR-10017 (beta-galactosidase, Falcon II, 1.77 A/px, unaligned
24-frame averages) + R. Henderson manual coordinates + Topaz picks (pretrained resnet16).

Usage: python classify2d_picks.py MRC_DIR PICKS.txt THRESH OUT.npz [--k 12 --iters 15 --seed 561]
"""
import argparse, glob, os, numpy as np, torch, mrcfile
import torch.nn.functional as F
from scipy.spatial import cKDTree

ap = argparse.ArgumentParser()
ap.add_argument("mrc_dir"); ap.add_argument("picks"); ap.add_argument("thresh", type=float); ap.add_argument("out")
ap.add_argument("--k", type=int, default=12); ap.add_argument("--iters", type=int, default=15)
ap.add_argument("--seed", type=int, default=561); ap.add_argument("--radius", type=float, default=40)
a = ap.parse_args()
torch.manual_seed(a.seed); rng = np.random.default_rng(a.seed)
dev = "cuda" if torch.cuda.is_available() else "cpu"
BOX, OUT = 160, 64             # 160 px * 1.77 A = 283 A box, downsampled to 64 px (4.43 A/px)

picks = {}
for line in open(a.picks).read().splitlines()[1:]:
    n, x, y, s = line.split("\t")
    if float(s) >= a.thresh: picks.setdefault(n, []).append((float(x), float(y), float(s)))

sets = {"tp": [], "fp": [], "fn": []}
for f in sorted(glob.glob(os.path.join(a.mrc_dir, "*.mrc"))):
    n = os.path.basename(f)[:-4]
    if not os.path.exists(f[:-4] + ".coord"): continue
    img = mrcfile.open(f, permissive=True).data.astype(np.float32).squeeze()
    img = (img - img.mean()) / img.std()
    t = np.loadtxt(f[:-4] + ".coord", ndmin=2)[:, :2]
    p = np.array([q[:2] for q in picks.get(n, [])]).reshape(-1, 2)
    d, j = cKDTree(t).query(p, distance_upper_bound=a.radius) if len(p) else (np.array([]), np.array([]))
    used = set(); lab = np.zeros(len(p), bool)
    for i in np.argsort(d):
        if np.isfinite(d[i]) and j[i] not in used: used.add(j[i]); lab[i] = True
    def cut(x, y):
        x, y = int(round(x)), int(round(y))
        if x - BOX//2 < 0 or y - BOX//2 < 0 or x + BOX//2 > img.shape[1] or y + BOX//2 > img.shape[0]: return None
        return img[y-BOX//2:y+BOX//2, x-BOX//2:x+BOX//2]
    for (x, y), m in zip(p, lab):
        c = cut(x, y)
        if c is not None: sets["tp" if m else "fp"].append(c)
    for k in range(len(t)):
        if k not in used:
            c = cut(*t[k])
            if c is not None: sets["fn"].append(c)
print({k: len(v) for k, v in sets.items()})

def prep(stack):
    x = torch.tensor(np.array(stack), device=dev)[:, None]
    x = F.interpolate(x, size=(OUT, OUT), mode="area")[:, 0]
    # low-pass to ~15 A and normalise
    yy, xx = torch.meshgrid(torch.fft.fftfreq(OUT, device=dev), torch.fft.fftfreq(OUT, device=dev), indexing="ij")
    r = torch.sqrt(xx**2 + yy**2) / (BOX * 1.77 / OUT)   # 1/A
    lp = torch.exp(-(r * 15.0)**2 * 2)
    x = torch.fft.ifft2(torch.fft.fft2(x) * lp).real
    x = (x - x.mean((1, 2), keepdim=True)) / x.std((1, 2), keepdim=True)
    return x

yy, xx = torch.meshgrid(torch.arange(OUT, device=dev) - OUT/2, torch.arange(OUT, device=dev) - OUT/2, indexing="ij")
mask = ((xx**2 + yy**2) < (OUT * 0.45)**2).float()
angles = torch.arange(0, 360, 10, device=dev).float()

def rotate(imgs, ang_deg):
    th = torch.deg2rad(ang_deg)
    A = torch.zeros(len(imgs), 2, 3, device=dev)
    A[:, 0, 0] = torch.cos(th); A[:, 0, 1] = -torch.sin(th); A[:, 1, 0] = torch.sin(th); A[:, 1, 1] = torch.cos(th)
    g = F.affine_grid(A, (len(imgs), 1, OUT, OUT), align_corners=False)
    return F.grid_sample(imgs[:, None], g, align_corners=False)[:, 0]

def classify(x, K, iters, maxshift=6):
    N = len(x)
    refs = torch.stack([x[torch.tensor(rng.choice(N, max(N // K, 1), replace=False), device=dev)].mean(0) for _ in range(K)])
    for it in range(iters):
        R = torch.cat([rotate(refs[k:k+1].repeat(len(angles), 1, 1), angles) for k in range(K)]) * mask  # (K*A, O, O)
        FR = torch.conj(torch.fft.fft2(R))
        best_s = torch.full((N,), -1e9, device=dev); best_i = torch.zeros(N, dtype=torch.long, device=dev)
        best_dy = torch.zeros(N, dtype=torch.long, device=dev); best_dx = torch.zeros(N, dtype=torch.long, device=dev)
        for b in range(0, N, 64):
            FX = torch.fft.fft2(x[b:b+64] * mask)
            cc = torch.fft.ifft2(FX[:, None] * FR[None]).real                       # (b, K*A, O, O)
            cc = torch.roll(cc, (maxshift, maxshift), (2, 3))[:, :, :2*maxshift+1, :2*maxshift+1]
            flat = cc.reshape(cc.shape[0], -1); s, idx = flat.max(1)
            per = (2*maxshift+1)**2
            best_s[b:b+64] = s; best_i[b:b+64] = idx // per
            best_dy[b:b+64] = (idx % per) // (2*maxshift+1) - maxshift; best_dx[b:b+64] = (idx % per) % (2*maxshift+1) - maxshift
        cls = best_i // len(angles); ang = angles[best_i % len(angles)]
        xs = torch.stack([torch.roll(x[i], (-int(best_dy[i]), -int(best_dx[i])), (0, 1)) for i in range(N)])
        xa = rotate(xs, -ang)
        new = []
        for k in range(K):
            m = cls == k
            new.append(xa[m].mean(0) if m.sum() > 0 else x[torch.randint(0, N, (1,), device=dev)][0])
        refs = torch.stack(new)
    counts = torch.bincount(cls, minlength=K)
    order = torch.argsort(counts, descending=True)
    return refs[order].cpu().numpy(), counts[order].cpu().numpy()

res = {}
for name in ["tp", "fp", "fn"]:
    if len(sets[name]) < a.k: continue
    x = prep(sets[name])
    refs, counts = classify(x, a.k, a.iters)
    res[name + "_classes"] = refs; res[name + "_counts"] = counts
    res[name + "_gallery"] = x[:24].cpu().numpy()
    print(name, counts.tolist())
np.savez_compressed(a.out, threshold=a.thresh, seed=a.seed, n_tp=len(sets["tp"]), n_fp=len(sets["fp"]), n_fn=len(sets["fn"]), **res)
