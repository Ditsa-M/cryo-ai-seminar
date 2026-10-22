"""Half-map validation for EMD-72202 (beta2AR dimer + AP-7-168, deposited half maps).
Teaching implementation (NOT cryoSPARC/RELION postprocess; numbers are our recomputation):
  * gold-standard FSC (unmasked and soft-masked), 0.143 crossing
  * conventional global B-factor sharpening (Guinier fit, FSC-weighted, low-passed at FSC0.143)
  * local resolution by windowed (local) FSC on a grid inside the mask

Usage: python halfmap_validation.py HALF1 HALF2 OUTDIR [--seed 561]
"""
import sys, os, json, numpy as np, mrcfile, torch

h1f, h2f, out = sys.argv[1:4]
os.makedirs(out, exist_ok=True)
dev = "cuda" if torch.cuda.is_available() else "cpu"
m1 = mrcfile.open(h1f, permissive=True); apix = float(m1.voxel_size.x)
h1 = torch.tensor(m1.data.astype(np.float32), device=dev); h2 = torch.tensor(mrcfile.open(h2f, permissive=True).data.astype(np.float32), device=dev)
N = h1.shape[0]
avg = 0.5 * (h1 + h2)

def freq_grid(n, d):
    f = torch.fft.fftfreq(n, d=d, device=dev)
    z, y, x = torch.meshgrid(f, f, f, indexing="ij")
    return torch.sqrt(x**2 + y**2 + z**2)

S = freq_grid(N, apix)
nsh = N // 2
shell = torch.clamp((S * N * apix).round().long(), max=nsh)

def fsc(a, b):
    A, B = torch.fft.fftn(a), torch.fft.fftn(b)
    num = torch.zeros(nsh + 1, device=dev).index_add_(0, shell.flatten(), (A * B.conj()).real.flatten())
    da = torch.zeros(nsh + 1, device=dev).index_add_(0, shell.flatten(), (A.abs()**2).flatten())
    db = torch.zeros(nsh + 1, device=dev).index_add_(0, shell.flatten(), (B.abs()**2).flatten())
    return (num / torch.sqrt(da * db + 1e-30))[:nsh].cpu().numpy()

def crossing(f, curve, level=0.143):
    for i in range(1, len(curve)):
        if curve[i] < level:
            # linear interpolation between i-1 and i
            x0, x1, y0, y1 = f[i-1], f[i], curve[i-1], curve[i]
            return float(1 / (x0 + (level - y0) * (x1 - x0) / (y1 - y0)))
    return float(2 * apix)

def lowpass(v, res_A, soft=0.02):
    flt = torch.sigmoid(((1 / res_A) - S) / soft * apix * 10)
    return torch.fft.ifftn(torch.fft.fftn(v) * flt).real

# soft mask from the 10 A low-passed average: threshold, dilate by 3 voxels, 6-voxel cosine edge
lp = lowpass(avg, 10.0)
thr = lp.mean() + 3 * lp.std()
core = (lp > thr).float()[None, None]
k = 7
dil = (torch.nn.functional.max_pool3d(core, k, 1, k // 2) > 0).float()
mask = dil.clone()
for _ in range(6):
    mask = torch.nn.functional.avg_pool3d(mask, 3, 1, 1)
mask = torch.maximum(mask, dil)[0, 0]
mask = torch.clamp(mask, 0, 1)

f = (np.arange(nsh) / (N * apix))
fsc_unmasked = fsc(h1, h2)
fsc_masked = fsc(h1 * mask, h2 * mask)
res_unmasked = crossing(f, fsc_unmasked); res_masked = crossing(f, fsc_masked)
print("FSC0.143 unmasked %.2f A, masked %.2f A" % (res_unmasked, res_masked))

# --- conventional global B-factor sharpening ---
A = torch.fft.fftn(avg * mask)
amp = torch.zeros(nsh + 1, device=dev).index_add_(0, shell.flatten(), A.abs().flatten())
cnt = torch.zeros(nsh + 1, device=dev).index_add_(0, shell.flatten(), torch.ones_like(A.real).flatten())
amp = (amp / cnt)[:nsh].cpu().numpy()
sel = (f > 1 / 10.0) & (f < 1 / res_masked)
B = float(-4 * np.polyfit(f[sel]**2, np.log(amp[sel]), 1)[0])   # ln F = -B s^2/4 + c
fscw = np.sqrt(np.clip(2 * fsc_masked / (1 + fsc_masked), 0, 1))  # Rosenthal & Henderson C_ref weighting
w = torch.tensor(np.concatenate([fscw, [0]]), device=dev)[shell] * torch.exp(B / 4 * S**2)
sharp = torch.fft.ifftn(torch.fft.fftn(avg) * w).real
sharp = lowpass(sharp, res_masked)
print("Guinier B = %.1f A^2" % B)

# --- local resolution: windowed FSC, 24-voxel cube with Hann window, grid step 4 voxels inside mask ---
W, step = 24, 4
hann1 = torch.hann_window(W, periodic=False, device=dev)
hann = hann1[:, None, None] * hann1[None, :, None] * hann1[None, None, :]
fw = torch.fft.fftfreq(W, d=apix, device=dev)
zz, yy, xx = torch.meshgrid(fw, fw, fw, indexing="ij")
sw = torch.clamp((torch.sqrt(xx**2 + yy**2 + zz**2) * W * apix).round().long(), max=W // 2)
fwl = np.arange(W // 2) / (W * apix)
centers = [(z, y, x) for z in range(W//2, N - W//2, step) for y in range(W//2, N - W//2, step) for x in range(W//2, N - W//2, step)
           if mask[z, y, x] > 0.5]
locres = torch.full((N, N, N), float("nan"), device=dev)
loc_vals = []
B_ = 512
for i in range(0, len(centers), B_):
    cs = centers[i:i+B_]
    a = torch.stack([h1[z-W//2:z+W//2, y-W//2:y+W//2, x-W//2:x+W//2] for z, y, x in cs]) * hann
    b = torch.stack([h2[z-W//2:z+W//2, y-W//2:y+W//2, x-W//2:x+W//2] for z, y, x in cs]) * hann
    FA, FB = torch.fft.fftn(a, dim=(1, 2, 3)), torch.fft.fftn(b, dim=(1, 2, 3))
    idx = sw.flatten()
    num = torch.zeros(len(cs), W // 2 + 1, device=dev).index_add_(1, idx, (FA * FB.conj()).real.flatten(1))
    da = torch.zeros(len(cs), W // 2 + 1, device=dev).index_add_(1, idx, (FA.abs()**2).flatten(1))
    db = torch.zeros(len(cs), W // 2 + 1, device=dev).index_add_(1, idx, (FB.abs()**2).flatten(1))
    curves = (num / torch.sqrt(da * db + 1e-30))[:, :W // 2].cpu().numpy()
    for (z, y, x), c in zip(cs, curves):
        r = crossing(fwl, c, 0.5)   # 0.5 threshold is customary for small local windows
        loc_vals.append(r)
        locres[z-step//2:z+step//2, y-step//2:y+step//2, x-step//2:x+step//2] = r

def save(name, vol):
    with mrcfile.new(os.path.join(out, name), overwrite=True) as m:
        m.set_data(vol.float().cpu().numpy().astype(np.float32)); m.voxel_size = apix

save("avg_unsharpened.mrc", avg); save("mask_soft.mrc", mask); save("sharpened_globalB.mrc", sharp)
lr = torch.nan_to_num(locres, nan=0.0); save("local_resolution.mrc", lr)
lv = np.array(loc_vals)
json.dump(dict(apix=apix, box=N, fsc_freq=f.tolist(), fsc_unmasked=fsc_unmasked.tolist(), fsc_masked=fsc_masked.tolist(),
               res_unmasked_A=res_unmasked, res_masked_A=res_masked, guinier_B=B,
               locres_window_vox=W, locres_threshold=0.5, locres_percentiles={p: float(np.percentile(lv, p)) for p in (5, 25, 50, 75, 95)},
               n_locres_points=len(lv)), open(os.path.join(out, "validation.json"), "w"), indent=1)
print("local res percentiles", {p: round(float(np.percentile(lv, p)), 2) for p in (5, 50, 95)})
