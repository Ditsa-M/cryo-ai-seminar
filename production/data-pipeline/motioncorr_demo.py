"""Transparent, conventional (NOT deep-learning) whole-frame + patch motion estimation on one
EMPIAR-10204 raw movie, written for teaching. It is a simplified version of the
cross-correlation / iterative-reference idea used by MotionCor2 and RELION; it is NOT
MotionCor2 and its numbers should not be quoted as MotionCor2 output.

Inputs : raw 49-frame TIFF movie + K2 gain reference (EMPIAR-10204, beta-galactosidase, CRYO ARM 200)
Outputs: npz with shifts, patch trajectories, sums (unaligned / aligned / aligned+dose-weighted),
         power spectra and even/odd-frame FRC curves.

Usage: python motioncorr_demo.py MOVIE.tif GAIN.mrc OUT.npz
"""
import sys, json
import numpy as np, tifffile, mrcfile
from numpy.fft import rfft2, irfft2, fft2, ifft2, fftshift, rfftfreq, fftfreq

APIX = 0.885          # A/px (EMPIAR-10204 metadata)
DOSE_PER_FRAME = 1.277  # e-/A^2 per frame (RELION-3.0 tutorial value for this dataset)
KV = 200
BIN = 4               # alignment is done on 4x-binned frames (3.54 A/px)
B_FACTOR = 150        # A^2 low-pass applied for alignment only (MotionCor2-style default)
ITER = 6

movie, gainf, out = sys.argv[1:4]
frames = tifffile.imread(movie).astype(np.float32)          # (49, 3838, 3710)
gain = mrcfile.open(gainf, permissive=True).data.astype(np.float32)

# --- pick the gain orientation empirically: the right one minimises fixed-pattern variance ---
s = frames[:10].sum(0)
cands = {}
for k in range(4):
    for flip in (False, True):
        g = np.rot90(gain, k)
        if flip: g = g[::-1]
        if g.shape != s.shape: continue
        c = s * g
        lp = np.abs(rfft2(c - c.mean()))
        cands[(k, flip)] = float(np.std(c[100:-100, 100:-100]))
best = min(cands, key=cands.get)
g = np.rot90(gain, best[0]); g = g[::-1] if best[1] else g
frames *= g
print("gain orientation (rot90 k, flipud):", best, {str(k): round(v, 2) for k, v in cands.items()})

n, H, W = frames.shape
def binned(a, b=BIN):
    h, w = (a.shape[-2] // b) * b, (a.shape[-1] // b) * b
    return a[..., :h, :w].reshape(*a.shape[:-2], h // b, b, w // b, b).mean((-3, -1))

def bfilter(shape, apix, B):
    fy = fftfreq(shape[0], d=apix)[:, None]; fx = rfftfreq(shape[1], d=apix)[None, :]
    return np.exp(-B * (fx**2 + fy**2) / 4)

def xcorr_shift(ref_ft, img_ft, shape, maxs):
    cc = fftshift(irfft2(ref_ft * np.conj(img_ft), s=shape))
    cy, cx = shape[0] // 2, shape[1] // 2
    win = cc[cy - maxs:cy + maxs + 1, cx - maxs:cx + maxs + 1]
    iy, ix = np.unravel_index(np.argmax(win), win.shape)
    # parabolic sub-pixel refinement
    def sub(a, b, c): d = a - 2 * b + c; return 0 if d == 0 else 0.5 * (a - c) / d
    dy = sub(*win[max(iy-1,0):iy+2, ix]) if 0 < iy < win.shape[0]-1 else 0
    dx = sub(*win[iy, max(ix-1,0):ix+2]) if 0 < ix < win.shape[1]-1 else 0
    return np.array([iy - maxs + dy, ix - maxs + dx])

def shift_ft(ft, shape, d):
    fy = fftfreq(shape[0])[:, None]; fx = rfftfreq(shape[1])[None, :]
    return ft * np.exp(-2j * np.pi * (fy * d[0] + fx * d[1]))

def align(stack, apix, maxs=20):
    """Iterative leave-one-out reference alignment. Returns per-frame shifts (px of `stack`)."""
    shape = stack.shape[1:]
    filt = bfilter(shape, apix, B_FACTOR)
    fts = rfft2(stack) * filt
    sh = np.zeros((len(stack), 2))
    for it in range(ITER):
        aligned = np.array([shift_ft(f, shape, d) for f, d in zip(fts, sh)])
        total = aligned.sum(0)
        new = np.array([xcorr_shift(total - aligned[i], fts[i], shape, maxs) for i in range(len(stack))])
        new -= new[0]
        if np.abs(new - sh).max() < 0.01: sh = new; break
        sh = new
    return sh

# --- global (whole-frame) alignment ---
fb = binned(frames)
glob_sh = align(fb, APIX * BIN) * BIN                        # back to full-res px
print("global drift total (A):", float(np.linalg.norm(glob_sh[-1] - glob_sh[0]) * APIX))

# --- patch trajectories (5x5 patches, residual after global), for the local-motion picture ---
P = 5
ph, pw = fb.shape[1] // P, fb.shape[2] // P
patch_traj = np.zeros((P, P, n, 2)); centers = np.zeros((P, P, 2))
gsh_b = glob_sh / BIN
pre = np.array([np.real(irfft2(shift_ft(rfft2(f), fb.shape[1:], d), s=fb.shape[1:])) for f, d in zip(fb, gsh_b)])
for i in range(P):
    for j in range(P):
        sub = pre[:, i*ph:(i+1)*ph, j*pw:(j+1)*pw]
        # sum groups of 3 frames for SNR in small patches, then interpolate back per frame
        grp = 3; m = n // grp
        gs = sub[:m*grp].reshape(m, grp, ph, pw).sum(1)
        t = align(gs, APIX * BIN, maxs=8) * BIN
        tt = np.interp(np.arange(n), np.arange(m) * grp + 1, t[:, 0]), np.interp(np.arange(n), np.arange(m) * grp + 1, t[:, 1])
        patch_traj[i, j] = np.stack(tt, 1) - np.stack(tt, 1)[0]
        centers[i, j] = ((i + .5) * ph * BIN, (j + .5) * pw * BIN)

# --- sums ---
def dose_weights(shape, apix, nframes):
    """Grant & Grigorieff 2015 critical exposure Ne(k)=0.245 k^-1.665 + 2.81 (300 kV), scaled 0.8 at 200 kV."""
    fy = fftfreq(shape[0], d=apix)[:, None]; fx = rfftfreq(shape[1], d=apix)[None, :]
    k = np.sqrt(fx**2 + fy**2); k[0, 0] = 1e-6
    ne = (0.245 * k**-1.665 + 2.81) * (0.8 if KV == 200 else 1.0)
    acc = np.arange(1, nframes + 1)[:, None, None] * DOSE_PER_FRAME
    w = np.exp(-(acc - DOSE_PER_FRAME / 2) / (2 * ne[None]))
    return w / np.sqrt((w**2).sum(0, keepdims=True))

shape = frames.shape[1:]
FT = rfft2(frames)
unal_even = irfft2(FT[0::2].sum(0), s=shape); unal_odd = irfft2(FT[1::2].sum(0), s=shape)
AL = np.array([shift_ft(f, shape, d) for f, d in zip(FT, glob_sh)])
al_even = irfft2(AL[0::2].sum(0), s=shape); al_odd = irfft2(AL[1::2].sum(0), s=shape)
unaligned = unal_even + unal_odd
aligned = al_even + al_odd
dw = irfft2((AL * dose_weights(shape, APIX, n)).sum(0), s=shape)

def frc(a, b, nb=80):
    A, B = fft2(a - a.mean()), fft2(b - b.mean())
    fy = fftfreq(a.shape[0], d=APIX)[:, None]; fx = fftfreq(a.shape[1], d=APIX)[None, :]
    r = np.sqrt(fx**2 + fy**2); edges = np.linspace(0, 1 / (2 * APIX), nb + 1)
    idx = np.digitize(r.ravel(), edges) - 1
    num = np.bincount(idx, (A * np.conj(B)).real.ravel(), nb + 1)[:nb]
    da = np.bincount(idx, (np.abs(A)**2).ravel(), nb + 1)[:nb]; db = np.bincount(idx, (np.abs(B)**2).ravel(), nb + 1)[:nb]
    return 0.5 * (edges[1:] + edges[:-1]), num / np.sqrt(da * db)

def psd(a, size=1024):
    """Periodogram-averaged power spectrum (log), size x size."""
    tiles = [a[y:y+size, x:x+size] for y in range(0, a.shape[0]-size+1, size//2) for x in range(0, a.shape[1]-size+1, size//2)]
    p = np.mean([np.abs(fftshift(fft2(t - t.mean())))**2 for t in tiles], 0)
    return np.log(p + 1e-6)

f_u, frc_u = frc(unal_even, unal_odd); f_a, frc_a = frc(al_even, al_odd)
np.savez_compressed(out, global_shifts_px=glob_sh, apix=APIX, dose_per_frame=DOSE_PER_FRAME,
    patch_traj_px=patch_traj, patch_centers_px=centers,
    unaligned=binned(unaligned, 2).astype(np.float32), aligned=binned(aligned, 2).astype(np.float32),
    aligned_dw=binned(dw, 2).astype(np.float32),
    psd_unaligned=psd(unaligned).astype(np.float32), psd_aligned=psd(aligned).astype(np.float32),
    frc_freq=f_u, frc_unaligned=frc_u, frc_aligned=frc_a,
    frames_preview=binned(frames[[0, 12, 24, 36, 48]], 8).astype(np.float32), gain_orientation=np.array(best, dtype=int))
print(json.dumps(dict(total_drift_A=float(np.linalg.norm(glob_sh[-1]) * APIX),
                      max_patch_residual_A=float(np.abs(patch_traj).max() * APIX))))
