# ChimeraX Python script: renders EMD-72202 maps for slide 11 with identical views.
# Maps: (1) average of deposited half maps (unsharpened), (2) our global-B sharpened map,
# (3) DeepEMhancer tightTarget output, (4) unsharpened map coloured by our local resolution.
# Each map is contoured at its own ATOM-INCLUSION level: the density value at which 80% of the
# deposited model's atoms (PDB 9Q3L) lie inside the surface. This is objective and comparable across
# maps with very different scales (DeepEMhancer output is masked and rescaled). Matched enclosed
# volume was tried first and rejected: the unsharpened maps spend that volume on the nanodisc.
# Run: chimerax --nogui --offscreen --exit --script "render_maps.py DATA_DIR VAL_DIR MODEL OUT_DIR"
import sys, os
import numpy as np
from chimerax.core.commands import run

data, val, model, out = sys.argv[1:5]
os.makedirs(out, exist_ok=True)
c = lambda cmd: run(session, cmd, log=False)

def model_by_id(i):
    return [m for m in session.models.list() if m.id == (i,)][0]

c("set bgColor #0B1620"); c("lighting soft"); c("material dull")
c("graphics silhouettes true width 2 color #0B1620")
c(f"open {data}/emd_72202.map")                                   # 1 author primary map
c(f"open {val}/avg_unsharpened.mrc")                              # 2
c(f"open {val}/sharpened_globalB.mrc")                            # 3
c(f"open {data}/deepemhancer_tightTarget.mrc")                    # 4
c(f"open {val}/locres_filled.mrc")                                 # 5
c(f"open {model}")                                                # 6 PDB 9Q3L
c("volume #1-4 step 1 style surface")
c("volume #5 hide")

xyz = model_by_id(6).atoms.scene_coords
level = {}
for i in (2, 3, 4):
    vals = model_by_id(i).interpolated_values(xyz)
    level[i] = float(np.percentile(vals, 20))
    c(f"volume #{i} level {level[i]:.6g}")
print("atom-inclusion(80%) levels", level)
import json
json.dump({str(k): v for k, v in level.items()}, open(f"{out}/levels.json", "w"))
levels = {i: model_by_id(i).surfaces[0].level if hasattr(model_by_id(i).surfaces[0], 'level') else None for i in (1, 2, 3, 4)}
print("levels", levels)

# align everything on the author map frame (all share origin/box) and set a common view
c("hide #6 models")
c("view #1"); c("turn x -90"); c("turn y 90"); c("show #6 models"); c("view #6"); c("zoom 0.62"); c("hide #6 models"); c("view name overview")
colors = {2: "#9FB4C2", 3: "#9FB4C2", 4: "#9FB4C2"}
names = {2: "unsharpened", 3: "globalB", 4: "deepemhancer"}
for i in (2, 3, 4):
    c("hide #1-5 models"); c(f"show #{i} models")
    c(f"volume #{i} color {colors[i]} transparency 0")
    c("view overview")
    c(f"save {out}/s11_{names[i]}_overview.png width 1200 height 1000 supersample 3")
    # same map at HALF its atom-inclusion level: reveals weaker density (nanodisc, flexible loops) or its absence
    c(f"volume #{i} level {level[i] / 2:.6g}"); c("view overview"); c("zoom 0.85")
    c(f"save {out}/s11_{names[i]}_halflevel.png width 1200 height 1000 supersample 3")
    c(f"volume #{i} level {level[i]:.6g}")

# ligand-site close-ups: AP-7-168 (A1CNS) pocket, mesh zoned 2.2 A around ligand + nearby residues
c("show #6 models"); c("hide #6 target c"); c("hide #6 atoms")
c("show #6 & (:A1CNS :<4.5) atoms"); c("style #6 stick")
c("color #6 & C #6BC0DB target a"); c("color #6/B & C #8FA2E0 target a")
c("color #6:A1CNS & C #E2A35C target a"); c("color #6 & ~C byhetero target a")
for i in (2, 3, 4):
    c("hide #1-5 models"); c(f"show #{i} models")
    c(f"volume #{i} style mesh color #D4E6F0")
    c(f"volume zone #{i} nearAtoms #6:A1CNS range 2.2")
    c("view #6:A1CNS"); c("zoom 0.75")
    c(f"save {out}/s11_{names[i]}_ligand.png width 1000 height 1000 supersample 3")
    c(f"volume unzone #{i}"); c(f"volume #{i} style surface")

# local resolution coloured onto the unsharpened surface (perceptually uniform viridis, 2.5-6.5 A);
# voxels outside the local-resolution grid were filled with the nearest estimate (locres_filled.mrc)
c("hide #6 models"); c("hide #1-5 models"); c("show #2 models")
c("volume #2 color #FFFFFF")
# viridis stops given explicitly (ChimeraX has no built-in viridis); bright = better resolved.
# Range = 5th..95th percentile of local resolution sampled at the model atoms.
lr = model_by_id(5).interpolated_values(xyz)
lo, hi = float(np.percentile(lr, 5)), float(np.percentile(lr, 95))
stops = np.linspace(lo, hi, 5)
cols = ["#FDE725", "#5EC962", "#21918C", "#3B528B", "#440154"]
c("color sample #2 map #5 palette " + ":".join(f"{v:.2f},{col}" for v, col in zip(stops, cols)))
json.dump(dict(levels={str(k): v for k, v in level.items()}, locres_at_atoms=dict(p5=lo, p50=float(np.median(lr)), p95=hi),
               palette=[[round(float(v), 2), col] for v, col in zip(stops, cols)]), open(f"{out}/levels.json", "w"), indent=1)
print("locres at atoms", lo, float(np.median(lr)), hi)
c("view overview")
c(f"save {out}/s11_locres_overview.png width 1200 height 1000 supersample 3")
print("done")
