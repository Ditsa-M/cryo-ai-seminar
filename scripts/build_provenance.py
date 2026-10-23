"""Write provenance/assets.json: one record per scientific asset shipped in public/.
QA (scripts/qa-check.mjs) fails if any file in public/figures, public/video or public/posters is
missing from this manifest, or if a manifest entry points at a missing file.
Usage: python3 scripts/build_provenance.py
"""
import json, os, glob, hashlib, subprocess, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def sha(p):
    return hashlib.sha256(open(os.path.join(ROOT, "public", p), "rb").read()).hexdigest()[:16]
try:
    commit = subprocess.check_output(["git", "-C", ROOT, "rev-parse", "--short", "HEAD"], text=True).strip()
except Exception:
    commit = "uncommitted"
REPO = f"this repository (cryo-ai-seminar) @ {commit}"
SW = dict(topaz="Topaz 0.3.20 (topaz-em, PyTorch 2.5.1+cu121)", demh="DeepEMhancer 0.18 (TensorFlow 2.15.1, model deepEMhancerModels_tf2 Zenodo 7432763, CC BY 4.0)",
          chimerax="UCSF ChimeraX 1.12 (2026-06-12)", numpy="Python 3.10 NumPy/SciPy/PyTorch", remotion="Remotion 4.0.532 + FFmpeg (libvpx-vp9, libx264)",
          pil="Python 3.14 Pillow (WebP q88)")

def rec(files, slide, kind, what, source=None, doi=None, locator=None, accession=None, version=None, code=None, params=None, seed=None,
        licence=None, modifications=None, software=None):
    return [dict(file=f, sha256_16=sha(f), slide=slide, kind=kind, description=what, source_paper=source, doi=doi, locator=locator,
                 dataset_accession=accession, dataset_version=version, code=code or REPO, parameters=params, random_seed=seed,
                 licence=licence, modifications=modifications, software=software) for f in files]

EMP17 = dict(accession="EMPIAR-10017", version="EMPIAR entry as of 2026-10-21 (12 of 84 micrographs used: Falcon_2012_06_12-*)",
             source="Scheres 2015 J Struct Biol 189:114 (coordinates by R. Henderson)", doi="10.1016/j.jsb.2014.11.010", licence="EMPIAR data: CC0")
EMP204 = dict(accession="EMPIAR-10204", version="movie 20170629_00021_frameImage.tif + K2-gain170629.mrc", source="EMPIAR-10204 (RELION-3 tutorial data subset)",
              doi="10.7554/eLife.42166", licence="EMPIAR data: CC0")
EMD = dict(accession="EMD-72202 (half maps) + PDB 9Q3L", version="EMDB release as of 2026-10-21", source="Shen et al. 2026 Nature 658:556", doi="10.1038/s41586-026-10892-y",
           licence="EMDB/PDB data: CC0")
SIMSRC = dict(accession="PDB 6CVM (β-gal); PDB 4V6X (80S ribosome)", source="Bartesaghi 2018 Structure 26:848; Anger 2013 Nature 497:80", doi="10.1016/j.str.2018.04.004; 10.1038/nature12104", licence="PDB data: CC0")

A = []
A += rec(["figures/s01_mic_raw.webp", "figures/s01_mic_lp.webp"], ["s01", "s03", "s08"], "experimental", "Micrograph crop (binned 4×, 7.08 Å/px), raw and Gaussian low-pass σ=2.5 px",
         EMP17["source"], EMP17["doi"], "Falcon_2012_06_12-15_30_21_0.mrc, crop y260:900 x300:940 of binned image", EMP17["accession"], EMP17["version"],
         "production/data-pipeline/export_micrograph.py; make_figures.py", "bin 4; percentile stretch 0.5–99.5", None, EMP17["licence"], "binning, crop, contrast stretch, low-pass (second file)", SW["pil"])
A += rec(["figures/s05_boxes.webp"], "s05", "experimental", "8 particle boxes extracted at expert coordinates", EMP17["source"], EMP17["doi"], "Falcon_2012_06_12-15_07_41_0", EMP17["accession"], EMP17["version"],
         "make_figures.py", "40 px boxes at 7.08 Å/px, σ=1 low-pass", None, EMP17["licence"], "binning, crop, low-pass", SW["pil"])
A += rec(["figures/s10_classes_tp.webp", "figures/s10_classes_fp.webp", "figures/s10_classes_fn.webp"], "s05,s10", "recomputed",
         "Simplified reference-free 2D classes of agreed / Topaz-only / expert-only picks (teaching implementation, not RELION/cryoSPARC)", EMP17["source"], EMP17["doi"], "12 micrographs",
         EMP17["accession"], EMP17["version"], "production/data-pipeline/classify2d_picks.py", "K=12, 15 iterations, 10° rotations, ±6 px shifts, box 160→64 px, 15 Å low-pass, Topaz threshold 2.0, 40 px match radius", 561,
         EMP17["licence"], "classes with ≥15 members shown, up to 6", SW["numpy"] + "; " + SW["topaz"])
A += rec(["figures/s05_frame0.webp"], "s05", "experimental", "Single raw movie frame (gain-corrected, binned 8×)", EMP204["source"], EMP204["doi"], "frame 1 of 49", EMP204["accession"], EMP204["version"],
         "production/data-pipeline/motioncorr_demo.py", "gain orientation rot90 k=3 chosen by minimum fixed-pattern variance", None, EMP204["licence"], "gain correction, binning, low-pass σ=1.5", SW["numpy"])
A += rec(["figures/s07_sum_unaligned.webp", "figures/s07_sum_aligned_dw.webp", "figures/s07_psd_unaligned.webp", "figures/s07_psd_aligned.webp"], "s05,s07", "recomputed",
         "Frame sums (unaligned; aligned + dose-weighted) and their periodogram-averaged power spectra", EMP204["source"], EMP204["doi"], "movie 00021", EMP204["accession"], EMP204["version"],
         "production/data-pipeline/motioncorr_demo.py; make_figures.py", "global iterative cross-correlation alignment on 4×-binned frames, B=150 Å² alignment filter, 6 iterations; 5×5 patches (3-frame groups); dose 1.277 e⁻/Å²/frame, Grant & Grigorieff critical exposure ×0.8 for 200 kV; PSD 1024 px tiles, smooth radial background (σ=12 px) removed",
         None, EMP204["licence"], "binning 2×, crops, contrast stretch", SW["numpy"])
A += rec(["figures/s04_clean.webp", "figures/s04_ctfd.webp", "figures/s04_noisy.webp", "figures/s04_avgs.webp", "figures/s04_recs.webp"], "s04", "simulation",
         "Image-formation simulation from a deposited model: projections, CTF, noise, averaging, reconstruction with known poses", SIMSRC["source"], SIMSRC["doi"], "PDB 6CVM", "PDB 6CVM", "wwPDB 2026-10",
         "production/data-pipeline/image_formation_sim.py; production/chimerax/molmap_bgal.cxc", "molmap 4 Å, 2 Å/px, 128³; 300 kV, Cs 2.7 mm, 7% amplitude contrast, 1.5 µm defocus (1.0–2.0 µm for reconstructions); SNR 0.05; direct Fourier insertion, Wiener-like regularisation",
         561, SIMSRC["licence"], "contrast stretch, tiling", SW["chimerax"] + "; " + SW["numpy"])
A += rec(["figures/s03_tomo_xy.webp", "figures/s05_tilts.webp", "figures/s14_wedge_truth.webp", "figures/s14_wedge_rec.webp", "figures/s14_wedge_full.webp"], "s03,s05,s09,s14", "simulation",
         "Crowded-volume tomogram simulation: 14 ribosomes + 40 β-gal + bilayer slab; ±60° (3° step) WBP per x–z plane; missing-wedge comparison", SIMSRC["source"], SIMSRC["doi"], None, SIMSRC["accession"], "wwPDB 2026-10",
         "production/data-pipeline/tomo_sim.py", "8 Å/px, 256×256×96; Gaussian noise 0.6×projection std per tilt; ramp-filtered back-projection (scikit-image)", 561, SIMSRC["licence"], "inverted contrast, slab averaging, upscaling", SW["numpy"])
for k in ("unsharpened", "globalB", "deepemhancer"):
    A += rec([f"figures/s11_{k}_overview.webp", f"figures/s11_{k}_halflevel.webp", f"figures/s11_{k}_ligand.webp"], "s05,s11", "recomputed" if k != "unsharpened" else "experimental",
             {"unsharpened": "Average of deposited half maps (no sharpening)", "globalB": "Global Guinier B-factor sharpening (our implementation), FSC-weighted, low-passed at FSC0.143",
              "deepemhancer": "DeepEMhancer tightTarget output from the two deposited half maps"}[k], EMD["source"], EMD["doi"], "EMD-72202 half maps 1 & 2", EMD["accession"], EMD["version"],
             "production/data-pipeline/halfmap_validation.py; production/chimerax/render_maps.py",
             "contour = density at which 80% of PDB 9Q3L atoms are inside; *_halflevel at half that value; ligand panels zone 2.2 Å around AP-7-168 (A1CNS)", None, EMD["licence"],
             "render only; PNG→WebP max 900 px", SW["chimerax"] + ("; " + SW["demh"] if k == "deepemhancer" else ""))
A += rec(["figures/s11_locres_overview.webp"], "s11", "recomputed", "Unsharpened map coloured by local resolution (windowed half-map FSC, 24 voxels, 0.5 threshold)", EMD["source"], EMD["doi"], None, EMD["accession"], EMD["version"],
         "halfmap_validation.py; fill_locres.py; render_maps.py", "viridis, range = 5th–95th percentile at model atoms (2.39–2.85 Å)", None, EMD["licence"], "nearest-neighbour fill outside estimated grid (display only)", SW["chimerax"])
A += rec(["video/motion-align.webm", "video/motion-align.mp4", "posters/motion-align.webp", "posters/motion-align-start.webp"], "s07", "experimental",
         "Scientific animation (plays once, holds): real 7-frame group sums with fixed reticle; cumulative unaligned vs aligned sums", EMP204["source"], EMP204["doi"], "movie 00021", EMP204["accession"], EMP204["version"],
         "production/data-pipeline/export_motion_frames.py; production/remotion/src/MotionAlign.tsx", "1280×720, 30 fps, 10 s; crop 300 px of 512 export centred on darkest feature; low-pass σ=2.2 px", None, EMP204["licence"],
         "layout, labels; poster = final frame", SW["remotion"])
A += rec(["video/tomo-scan.webm", "video/tomo-scan.mp4", "posters/tomo-scan.webp"], "s03,s09", "simulation",
         "Decorative 8 s seamless loop: schematic 37³ search box over the simulated tomogram slab (no causal content)", SIMSRC["source"], SIMSRC["doi"], None, SIMSRC["accession"], None,
         "production/remotion/src/TomoScan.tsx", "720×720, 30 fps, Lissajous path", None, SIMSRC["licence"], "schematic overlay", SW["remotion"])
A += rec(["video/bgal-spin.webm", "video/bgal-spin.mp4", "posters/bgal-spin.webp"], "s04", "simulation",
         "Decorative 12 s seamless turntable of β-galactosidase density simulated from PDB 6CVM (molmap 6 Å)", SIMSRC["source"], SIMSRC["doi"], None, "PDB 6CVM", None,
         "production/chimerax/bgal_spin.cxc", "720×720, 360 frames at 1°/frame", None, SIMSRC["licence"], "none", SW["chimerax"] + "; FFmpeg")

A += rec(["video/opening.webm", "video/opening.mp4", "posters/opening.webp", "posters/opening-start.webp"], "s01", "experimental",
         "Opening scene (pre-roll, plays once on click, holds on title): EMD-72202 half-map average contoured from 0.02 to the 80% atom-inclusion level (0.0678), then the deposited model PDB 9Q3L (helices as cylinders) with AP-7-168 and the agonist; title text added in Remotion",
         EMD["source"], EMD["doi"], "EMD-72202 half maps 1 & 2; PDB 9Q3L", EMD["accession"], EMD["version"],
         "production/chimerax/opening.cxc; production/remotion/src/Opening.tsx", "1920x1080, 30 fps, 420 frames, 0.6 deg/frame rotation; contour and transparency interpolated with ChimeraX perframe", None,
         EMD["licence"], "styling (colours, cylinder helices), text overlay; poster = final (title) frame", SW["chimerax"] + "; " + SW["remotion"])

out = dict(generated=datetime.date.today().isoformat(), policy="No generative AI imagery. Every pixel derives from deposited experimental data, deterministic simulation from deposited models, or reproducible computation; schematics are hand-coded SVG in src/.",
           schematic_svg=["s02 pipeline", "s06 workflow", "s09 Topaz/crYOLO/embedding sketches", "s12 benchmark chart (values from Dhakal et al. 2025 Table 3)", "s04/s07/s10/s11 D3 charts (data in src/data/generated)"],
           third_party_figures_reproduced="none (Iqbal 2026 CC BY-NC-ND and Springer CryoAI figures not used)", assets=A)
os.makedirs(os.path.join(ROOT, "provenance"), exist_ok=True)
json.dump(out, open(os.path.join(ROOT, "provenance/assets.json"), "w"), indent=1, ensure_ascii=False)
shipped = {os.path.relpath(p, os.path.join(ROOT, "public")) for d in ("figures", "video", "posters") for p in glob.glob(os.path.join(ROOT, "public", d, "*")) if not p.endswith(".json")}
listed = {a["file"] for a in A}
print(len(A), "assets;", "unlisted:", sorted(shipped - listed), "missing:", sorted(listed - shipped))
