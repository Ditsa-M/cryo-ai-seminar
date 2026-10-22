"""Deterministic SIMULATION of a crowded cryo-ET volume and its +/-60 deg tilt-series reconstruction,
to show the missing wedge. Densities come from deposited models via ChimeraX molmap
(beta-galactosidase PDB 6CVM; human 80S ribosome PDB 4V6X). No experimental pixels.

Each x-z plane is reconstructed independently by filtered back-projection (skimage iradon) from
projections at -60..+60 deg (3 deg step), which is exactly single-axis tilt geometry.
Noise: Gaussian, 0.6 x per-tilt projection std. 'full' = noise-free 0-180 deg reference for one plane.
Usage: python tomo_sim.py BGAL.mrc RIBO.mrc OUT.npz [--seed 561]
"""
import sys, numpy as np, mrcfile
from scipy.ndimage import zoom, rotate, gaussian_filter
from skimage.transform import radon, iradon

bf, rf, out = sys.argv[1:4]
SEED = 561; rng = np.random.default_rng(SEED)
APIX = 8.0                                   # simulated tomogram sampling (A/px)
NX, NY, NZ = 256, 256, 96

def load(f):
    m = mrcfile.open(f, permissive=True); a = m.data.astype(np.float32); s = float(m.voxel_size.x)
    a = zoom(a, s / APIX, order=1); return a / a.max()
bgal, ribo = load(bf), load(rf)

vol = np.zeros((NZ, NY, NX), np.float32)
labels = []                                  # ground-truth 3D coordinates (z, y, x, class)
def place(obj, cls, tries=400):
    for _ in range(tries):
        o = rotate(rotate(obj, rng.uniform(0, 360), (1, 2), reshape=True, order=1), rng.uniform(0, 180), (0, 1), reshape=True, order=1)
        o[o < 0.05] = 0
        dz, dy, dx = o.shape
        z = rng.integers(10, NZ - dz - 10) if NZ - dz - 20 > 0 else 0
        y = rng.integers(0, NY - dy); x = rng.integers(0, NX - dx)
        sl = vol[z:z+dz, y:y+dy, x:x+dx]
        if (sl[o > 0] > 0).any(): continue  # no overlap
        sl += o
        labels.append((z + dz // 2, y + dy // 2, x + dx // 2, cls)); return True
    return False

n_ribo = sum(place(ribo, "ribosome") for _ in range(14))
n_bgal = sum(place(bgal, "beta-gal") for _ in range(40))
# a membrane-like slab (lipid bilayer, two leaflets) crossing the volume diagonally in x-z
zz, yy, xx = np.mgrid[0:NZ, 0:NY, 0:NX]
d = (zz - (0.18 * xx + 8))
vol += 0.6 * (np.exp(-((d - 1.5) / 1.2)**2) + np.exp(-((d + 1.5) / 1.2)**2))
vol = gaussian_filter(vol, 0.7)

angles = np.arange(-60, 61, 3.0)
rec = np.zeros_like(vol)
sino_example = None
for y in range(NY):
    plane = vol[:, y, :]                           # (z, x)
    sq = np.zeros((NX, NX), np.float32); off = (NX - NZ) // 2
    sq[off:off+NZ] = plane
    s = radon(sq, theta=90 + angles, circle=False)  # beam along z at 0 tilt
    clean_s = s.copy()
    s += rng.normal(0, s.std() * 0.6, s.shape)       # dose-limited noise per tilt
    r = iradon(s, theta=90 + angles, filter_name="ramp", circle=False, output_size=NX)
    rec[:, y, :] = r[off:off+NZ]
    if y == 200:
        sino_example = s
        wedge_clean_xz = iradon(clean_s, theta=90 + angles, filter_name="ramp", circle=False, output_size=NX)[off:off+NZ]
        sf = radon(sq, theta=np.arange(0, 180, 1.0), circle=False)
        full_xz = iradon(sf, theta=np.arange(0, 180, 1.0), filter_name="ramp", circle=False, output_size=NX)[off:off+NZ]

np.savez_compressed(out, seed=SEED, apix=APIX, tilt_angles=angles, truth=vol, rec=rec.astype(np.float32),
                    full_xz_y200=full_xz.astype(np.float32), wedge_clean_xz_y200=wedge_clean_xz.astype(np.float32), sinogram_y200=sino_example.astype(np.float32),
                    labels=np.array([l[:3] for l in labels]), label_class=np.array([l[3] for l in labels]))
print("placed", n_ribo, "ribosomes", n_bgal, "beta-gal")
