"""Export one EMPIAR-10017 micrograph (binned 4x -> 7.08 A/px) with expert coordinates and Topaz
picks categorised (matched / topaz-only / expert-only) for the slide overlays.
Usage: python export_micrograph.py MRC COORD PICKS.txt OUT.npz [--radius 40]"""
import sys, numpy as np, mrcfile
from scipy.spatial import cKDTree
mrc, coord, pickf, out = sys.argv[1:5]; R = 40.0; B = 4
name = mrc.split('/')[-1][:-4]
img = mrcfile.open(mrc, permissive=True).data.astype(np.float32).squeeze()
img = img.reshape(img.shape[0]//B, B, img.shape[1]//B, B).mean((1, 3))
t = np.loadtxt(coord, ndmin=2)[:, :2]
P = np.array([[float(v) for v in l.split('\t')[1:]] for l in open(pickf).read().splitlines()[1:] if l.split('\t')[0] == name])
np.savez_compressed(out, img=img, bin=B, apix=1.77 * B, truth=t / B, picks=P[:, :2] / B, scores=P[:, 2], radius_binned=R / B)
print(name, img.shape, len(t), len(P))
