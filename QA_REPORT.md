# QA report — AI in cryo-EM and cryo-ET data processing

Date: 2026-10-22. Automated outputs: `provenance/qa-last-run.txt` (timing/claims/provenance gate)
and `tests/test-report.json` (end-to-end tests). This document summarises both and adds the
scientific checks that cannot be automated.

## 1. Scientific QA

### Sources
* The four required sources were obtained and read:
  * Iqbal et al. 2026, *BMC Artif Intell* 2:2. Read as the publisher's open-access HTML; the PDF download was blocked by a bot wall.
  * Dhakal et al. 2025, *Brief Bioinform* 26:bbaf011. Read as Europe PMC full-text XML, PMC11736895.
  * Levy et al. 2022, CryoAI, ECCV, LNCS 13681:540–557. Read via arXiv:2203.08138v4, the authors' version; Springer blocked the chapter.
  * Giri et al. 2024, *Sci Data* 11:458. Read as the PDF and as PMC XML.
* The primary method papers were read in full text from Europe PMC: Topaz (PMC6858545), crYOLO (PMC6584505), TomoTwin (PMC10250198) and DeepEMhancer (PMC8282847).
  * The MotionCor2 full text was not available; its abstract and metadata were used.
* All 22 DOIs resolve via Crossref. `scripts/build_bibliography.py` exits non-zero if any DOI fails.
  * The 3 datasets were checked against the EMPIAR and EMDB APIs.

### Benchmark (slide 12)
* Table 3 was parsed from the PMC XML table, not retyped.
  * Every per-dataset value matches the values given in the assignment brief.
  * The "Average" rows were recomputed from the per-dataset rows and agree to ±0.01 Å and ±1 particle.
* Text/table conflict confirmed:
  * The text says *"CryoTransformer performs the best on EMPIAR-10093 in CryoPPP."*
  * Table 3 gives Topaz 6.12 Å and CryoTransformer 6.81 Å. The deck uses the table value.
  * Topaz is also best on full EMPIAR-10093 (4.40 Å).
* Additional qualification found and shown: CryoSegNet and CryoTransformer come from the same group that wrote the benchmark review.

### Claims
* The ledger has 46 claims. Each has a type, a bibliography key, a locator and a status.
* One claim is **flagged**: EMPIAR-10204 at 1.277 e⁻/Å² per frame.
  * The value comes from the RELION-3.0 tutorial that uses this dataset, not from EMPIAR metadata, which gives no dose.
  * It affects only the dose-weighting step of our teaching re-implementation.
* Statements corrected or avoided after checking the sources:
  * The broad review says Topaz "employs denoising diffusion models". That is not what Topaz picking does, so the deck does not repeat it.
  * crYOLO's general model is described as "more than 40 datasets", matching the abstract.
  * TomoTwin's training set: the abstract-level figure is 120 proteins; a 108-protein curated subset is mentioned in Methods. The notes give both.
  * The DeepEMhancer training target is quoted from the paper.

### Recomputed results — what they are and are not
| Result | Method | Caveat |
|---|---|---|
| Topaz vs. expert picks (F1 0.824 at threshold 2.0) | Topaz 0.3.20 pretrained ResNet16; greedy 1-to-1 matching within 40 px (71 Å) | The expert labels are incomplete, so precision is underestimated (shown on slide 10) |
| PU retraining on 25% of labels: F1 0.863 held out | 8 training / 4 test micrographs, 10 epochs, seed 561 | One split and one seed; no error bars |
| 2D classes of pick sets | Our simplified reference-free alignment and averaging | "Looks like β-gal" is a visual judgement, stated as such |
| 21.3 Å drift; Thon rings | Our cross-correlation alignment | Not MotionCor2; one movie |
| FSC 2.62 Å (masked) / 3.12 Å (unmasked); B = 66.5 Å² | Our half-map FSC with a soft mask | Deposited value is 2.5 Å with the authors' mask |
| Local resolution 2.39–2.85 Å at atoms | Windowed FSC, 24 voxels, 0.5 threshold | Conservative; a coarse grid |
| DeepEMhancer removes the nanodisc | DeepEMhancer 0.18 tightTarget; each map contoured at 80% atom inclusion and at half that level | One map, one model; the nanodisc is non-protein density, so it is expected behaviour that is nonetheless real signal loss |

### Provenance and licensing
* All 40 shipped scientific assets are listed in `provenance/assets.json` with kind, source, DOI, accession, parameters, seed, licence, software and a hash.
* No generative imagery was used anywhere.
* Nothing from the CC BY-NC-ND review or the Springer chapter was reproduced or modified.
* The Table 3 chart is our own re-plot of the numbers.
* EMPIAR, EMDB and PDB data are CC0. The DeepEMhancer model weights are CC BY 4.0 (Zenodo 7432763).

### Prototype checkpoint (build-process step 3–4)
The three prototype slides (title micrograph, benchmark chart, picking/tomography comparison) were built and reviewed in the browser first. The other slides reuse their components, chart code and colour/line-style encoding. All 16 slides were then reviewed in their final click state at 1920×1080 and fixed:
* label overflow on slide 6;
* chart domain bug on slide 10;
* video height on slide 3;
* print layout of the PDF.

## 2. Technical QA
See section 3 (filled from `tests/test-report.json`).
