# AI in cryo-EM and cryo-ET data processing — live seminar deck

15-minute, 16-slide reveal.js presentation (React + TypeScript + Vite, official `@revealjs/react`
wrapper) for BCH 561. Central question: *where does deep learning add trustworthy structural
information to cryo-EM/cryo-ET processing, and how can we tell whether an apparent improvement is real?*

The deck is built on **real data that I processed myself** (not stock figures):

| Slide | What is shown | Kind |
|---|---|---|
| 1 (opening) | 14 s pre-roll: EMD-72202 density emerges from noise, then the PDB 9Q3L model (helix cylinders) rotates and the title appears; ChimeraX render + Remotion text | experimental |
| 1, 3, 8 | EMPIAR-10017 β-galactosidase micrograph; Topaz 0.3.20 picks vs. R. Henderson's 6,829 expert picks | experimental + recomputed |
| 7 | EMPIAR-10204 raw 49-frame movie: 21 Å drift, Thon rings before/after alignment, patch trajectories | experimental + recomputed |
| 10 | Precision/recall/F1 vs. threshold; 2D classes of agreed / "false-positive" / missed picks; Topaz retrained on 25 % of labels | recomputed |
| 11 | EMD-72202 (β2AR dimer) half maps: unsharpened, global-B, DeepEMhancer 0.18; half-map FSC, local resolution; nanodisc removed by DeepEMhancer | experimental + recomputed |
| 12 | Six-picker benchmark, Dhakal et al. 2025 Table 3 (re-plotted) | reported |
| 4, 3, 14 | Image-formation and missing-wedge simulations from PDB 6CVM / 4V6X (seed 561) | simulation |

## Present it

```bash
export PATH=~/.local/node/bin:$PATH      # Node 22 was installed locally (no sudo)
cd ~/Downloads/Coursework/BCH561/cryo-ai-seminar
npm install                              # first time only
npm run build                            # QA gate + type-check + offline static build -> dist/
npm run preview                          # http://localhost:4173  (works with networking off)
```

Open the URL in Chrome, press **F** for full screen. Slide 1 starts dark: the **first click plays the 14 s opening** (outside the 15:00; it holds on the title), the second click fades to the micrograph — start your timer there. Press **S** for the speaker view (current slide,
next slide, timer with per-slide pacing, full notes), **→ / Space** to advance one click,
**←** to go back (animations reverse and replay), **M** to toggle reduced motion, **X** to hide or show the pointing hand, **Esc** for the
overview. Nothing auto-advances; there is no audio.

A pointing hand moves to whatever the script is talking about at each click and loops through the
items for that click, tapping each one for 2.8 s. Its targets are in `src/data/hand.ts`. It stays still
with reduced motion, is left out of the PDF, and `?no-hand` in the URL starts with it hidden.

Without a server: any static server works on `dist/` (e.g. `python3 -m http.server -d dist 4173`).
Opening `dist/index.html` from `file://` is not supported (browser module/video restrictions).

Backups (in `backup/`): `deck.pdf` (16 pages, final click state of each slide),
`deck-backup.mp4` (silent run-through: 15 s opening + 15:00 at the scripted timing), `transcript.md`,
`speaker-notes.md`. The PDF and MP4 are build outputs, so they are not in git; download them from the
[v1.0 release](https://github.com/Ditsa-M/cryo-ai-seminar/releases/tag/v1.0).

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | live dev server (http://localhost:5173) |
| `npm run qa` | claim ledger / timing / word count / citation / provenance / video-fallback gate (writes `provenance/qa-last-run.txt`) |
| `npm run build` | `qa` + `tsc -b` + `vite build` + `scripts/check-dist.mjs` (fails on any external URL or missing asset) |
| `npm test` | Playwright + system Chrome, offline: navigation, no auto-advance, notes, speaker view, video start/stop/replay, animation replay, reduced motion, 1920×1080 and 1366×768, console errors, missing files, PDF/MP4 checks → `tests/test-report.json` |
| `npm run export:pdf` | `backup/deck.pdf` |
| `npm run export:mp4` | `backup/deck-backup.mp4` (Remotion assembly of per-click screenshots + real clips) |
| `npm run transcript` | `backup/transcript.md`, `backup/speaker-notes.md` |
| `npm run videos` | re-render Remotion clips and re-encode all videos (WebM/VP9 + MP4/H.264 + WebP poster) |
| `python3 scripts/build_bibliography.py` | regenerate `references.bib` + `src/data/bibliography.json` from Crossref (fails on unresolved DOI) |
| `python3 scripts/build_provenance.py` | regenerate `provenance/assets.json` |

## Layout

```
src/data/story.yaml        timed script: narration, clicks, source, caveat, deeper note, Q&A per slide (single source of truth)
src/data/claims.yaml       claim ledger (46 claims, type, source key, locator, status)
src/data/benchmarks.json   Dhakal et al. 2025 Table 3, verified against the PMC full text
src/data/bibliography.json + references.bib   Crossref-verified bibliography (+ datasets, + verified absence of a DL motion-correction method)
src/data/generated/        chart data produced by the pipeline
src/slides/ src/components/ src/deck/ src/styles/   the deck
public/figures|video|posters|fonts                  shipped assets (all local)
production/data-pipeline/  Python: Topaz evaluation, 2D classification, motion correction, half-map FSC/local resolution, simulations, figure export
production/chimerax/       ChimeraX scripts (molmap, map renders, turntable)
production/remotion/       Remotion compositions (motion-align, tomo-scan, deck-backup) and render-all.mjs
provenance/assets.json     per-asset provenance (kind, source, DOI, accession, parameters, seed, licence, software, sha256)
tests/run-tests.mjs        end-to-end tests
QA_REPORT.md               scientific and technical QA report
```

## Reproducing the data products (lab PC `ranel`)

Raw data are not in the repository (EMPIAR/EMDB downloads, ~2 GB). On ranel they live in
`~/cryo-ai-seminar-data/` with conda envs `envs/topaz` (Topaz 0.3.20, PyTorch 2.5.1+cu121) and
`envs/demh` (DeepEMhancer 0.18, TensorFlow 2.15.1 GPU). The order is:
`eval_picks.py` → `classify2d_picks.py` → `motioncorr_demo.py` → `export_motion_frames.py` →
`halfmap_validation.py` → DeepEMhancer (`-p tightTarget -s 0.834`) → `fill_locres.py` →
`chimerax --script render_maps.py` → `image_formation_sim.py` → `tomo_sim.py`, then on the laptop
`make_figures.py out public/figures src/data/generated`. Every script's header gives its usage.

## Deliberate choices and limits

* Motion correction is shown as **conventional optimization**; a literature search found no widely
  used deep-learning motion-correction method (recorded in `bibliography.json`).
* Our motion, FSC, B-factor and local-resolution numbers come from teaching re-implementations,
  labelled as such; they are not MotionCor2/cryoSPARC outputs.
* crYOLO and TomoTwin were not run (no tomogram dataset processed); their content is from the
  primary papers and is labelled REPORTED / SCHEMATIC.
* Manim was not used: the CTF, FSC and threshold explanations are D3/SVG charts driven by
  fragments, which are interactive, replayable and print to PDF, which a Manim clip would not be.
* No figures from the CC BY-NC-ND review or the Springer CryoAI chapter are reproduced.
