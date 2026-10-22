"""Fill unestimated voxels (0) of the local-resolution map with the nearest estimate, for surface colouring only.
Usage: python fill_locres.py IN.mrc OUT.mrc"""
import sys, numpy as np, mrcfile
from scipy.ndimage import distance_transform_edt
m = mrcfile.open(sys.argv[1], permissive=True); a = m.data.astype(np.float32)
idx = distance_transform_edt(a == 0, return_distances=False, return_indices=True)
with mrcfile.new(sys.argv[2], overwrite=True) as o:
    o.set_data(a[tuple(idx)].astype(np.float32)); o.voxel_size = m.voxel_size
