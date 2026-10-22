"""Export frame-group crops from EMPIAR-10204 movie 00021 for the motion-correction animation.
7 groups x 7 frames, gain-corrected, crop 1024x1024 full-res centred, binned 2x (1.77 A/px), low-pass ~8 A.
For each k = 1..7 also exports the cumulative sum of groups 1..k unaligned and aligned (shifts from mc_00021.npz).
Usage: python export_motion_frames.py MOVIE GAIN MC.npz OUTDIR"""
import sys, os, numpy as np, tifffile, mrcfile
from numpy.fft import rfft2, irfft2, fftfreq, rfftfreq
from scipy.ndimage import gaussian_filter
from PIL import Image
movie, gainf, mcf, out = sys.argv[1:5]; os.makedirs(out, exist_ok=True)
mc = np.load(mcf); sh = mc["global_shifts_px"]; k_rot = int(mc["gain_orientation"][0])
fr = tifffile.imread(movie).astype(np.float32)
g = np.rot90(mrcfile.open(gainf, permissive=True).data.astype(np.float32), k_rot); fr *= g
H, W = fr.shape[1:]; C = 1024; y0, x0 = H // 2 - C // 2, W // 2 - C // 2
def shift(img, d):
    fy = fftfreq(img.shape[0])[:, None]; fx = rfftfreq(img.shape[1])[None, :]
    return irfft2(rfft2(img) * np.exp(-2j * np.pi * (fy * d[0] + fx * d[1])), s=img.shape)
pad = 64
crop = lambda a: a[y0 - pad:y0 + C + pad, x0 - pad:x0 + C + pad]
def finish(a):
    a = a[pad:-pad, pad:-pad]; a = a.reshape(C // 2, 2, C // 2, 2).mean((1, 3)); return gaussian_filter(a, 2.2)
groups = [list(range(i * 7, i * 7 + 7)) for i in range(7)]
G = [crop(fr[ix].sum(0)) for ix in groups]
GA = [crop(sum(shift(fr[i], sh[i]) for i in ix)) for ix in groups]
imgs = {"group_raw": [finish(a) for a in G]}
imgs["cum_unaligned"] = [finish(sum(G[:k + 1])) for k in range(7)]
imgs["cum_aligned"] = [finish(sum(GA[:k + 1])) for k in range(7)]
lo, hi = np.percentile(imgs["cum_aligned"][-1], [0.5, 99.5])
for key, arr in imgs.items():
    for k, a in enumerate(arr):
        l, h = (np.percentile(a, [0.5, 99.5]))
        b = np.clip((a - l) / (h - l), 0, 1)
        Image.fromarray((b * 255).astype(np.uint8)).save(f"{out}/{key}_{k}.png")
np.savetxt(f"{out}/group_mean_shift_A.txt", np.array([sh[ix].mean(0) for ix in groups]) * 0.885, fmt="%.2f", header="mean shift per 7-frame group (y x), A")
print("ok")
