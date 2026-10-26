# Cue sheet — AI in cryo-EM and cryo-ET data processing

Every row is one press of **→ (or Space)**; **←** goes back one step. "Clock" is where you should be on the
speaker-view timer when you press. Row 0 is how the deck opens (no press). Start the timer at press 2 (the micrograph). Total 15:00; take-home ends 14:40.


## Slide 1 · Title and central question  (0:00–0:40, 40 s)

**0. [pre-roll] — Deck opens: dark first frame of the opening**

**1. [pre-roll] — PRE-ROLL (not in the 15:00): play the opening scene — 14 s, silent, holds on the title. Say nothing, or one line. Start your timer on the next click.**

**2. [0:00] — Fade to the real micrograph (start speaking).**  
Let me start with a challenge. This is a real cryo-EM micrograph of beta-galactosidase from EMPIAR-10017. At first glance, can you confidently identify even one protein particle?

**3. [0:11] — Low-pass filter fades in over the raw micrograph.**  
Once I apply a low-pass filter, the particles become easier to see.

**4. [0:15] — Outlines appear: cyan solid = expert and Topaz agree; amber dashed = Topaz only; white dotted = expert only.**  
The cyan outlines are particles selected by both a human expert and Topaz, a neural-network-based picker. Amber means Topaz alone selected the particle, and white means only the expert did. They agree often—but not always.

**5. [0:29] — Central question appears.**  
That disagreement leads to my main question: where can deep learning improve cryo-EM and cryo-ET analysis, and how can we tell whether the improvement is scientifically trustworthy?


## Slide 2 · Why AI-assisted processing matters  (0:40–1:30, 50 s)

**6. [0:40] — Arrive on slide**  
Why automate this process at all? There are three pressures: weak signal, enormous data volume, and human time.

**7. [0:47] — Dose chart: SNR at 3/4/8/20 Å vs total dose; dots mark each resolution's best dose; amber line = this micrograph's 24 e⁻/Å².**  
Radiation damages biological samples, so the total electron dose must remain limited. As a result, each particle image is extremely noisy.

**8. [0:56] — Scale numbers appear: archive size, picks on one dataset, expert picks per micrograph.**  
At the same time, modern microscopes can generate thousands of movies and very large datasets. In one benchmark dataset I will show later, Topaz selected more than four hundred thousand candidate particles. Manually examining all of them is unrealistic.

**9. [1:12] — Pipeline strip appears; an error marker at 'pick' propagates to 'interpret'.**  
But speed alone is not the goal. A false particle pick, an inaccurate motion estimate, or an aggressively enhanced map can influence every later stage—from classification and refinement to the biological conclusion. Automation is useful only when we preserve a way to detect its mistakes.


## Slide 3 · What cryo-EM and cryo-ET reveal  (1:30–2:25, 55 s)

**10. [1:30] — Arrive on slide**  
Before discussing the tools, I want to separate two related workflows. In single-particle cryo-EM, we image many purified copies of the same complex in different orientations. We extract and align their two-dimensional projections, then combine them into a three-dimensional reconstruction. For suitable samples, this can reach near-atomic or atomic resolution.

**11. [1:51] — Right panel (tomography) slides in.**  
Cryo-electron tomography is different. We tilt one region of a thicker specimen—often a cell or lamella—typically through roughly plus or minus sixty degrees, and reconstruct a three-dimensional tomogram. Because we cannot collect every tilt angle, the reconstruction contains a missing wedge of information. We can then locate repeated complexes and average their subtomograms.

**12. [2:12] — Question boxes appear under each panel.**  
So single-particle analysis usually asks, “What is the molecular structure and mechanism?” Tomography also asks, “Where is this complex, what surrounds it, and what state is it in inside the cell?”


## Slide 4 · Fundamental image-formation principle  (2:25–3:35, 70 s)

**13. [2:25] — Arrive on slide**  
This equation summarizes the imaging problem. We begin with the molecule’s three-dimensional Coulomb-potential map, shown here as V. Each particle has an unknown orientation, phi-i.

**14. [2:35] — Projection: clean views of the simulated molecule.**  
The microscope records a two-dimensional projection of that object.

**15. [2:39] — CTF: the 1D curve and the CTF-modulated images.**  
The contrast transfer function, or CTF, then modulates the Fourier components according to imaging conditions such as defocus. Some spatial frequencies change sign, and information is strongly attenuated near CTF zeros. Collecting particles at different defocus values helps provide complementary frequency information.

**16. [2:56] — Noise: the same images at SNR 0.05.**  
Finally, we add noise—and at an SNR of 0.05, the particle nearly disappears.

**17. [3:01] — Averaging: 1 → 10 → 100 → 1000 aligned copies.**  
The rescue is averaging. If particles are correctly aligned and their noise is largely independent, the amplitude signal-to-noise improves approximately with the square root of the number of particles.

**18. [3:13] — Reconstruction: central slices from 30 → 300 → 3,000 → 30,000 views.**  
Projections from many orientations then sample three-dimensional Fourier space, as described by the central-slice theorem. In this simulation, correlation with the true map improves as the number of views increases. But here the orientations are already known. In experimental data, estimating particle positions, orientations, motion, and optical parameters is the difficult inverse problem.


## Slide 5 · What the raw data look like  (3:35–4:20, 45 s)

**19. [3:35] — Arrive on slide**  
It is useful to distinguish what the microscope measures from what the software infers.

**20. [3:41] — Measured row: single frame, aligned sum, tilt series (simulated).**  
The detector records a dose-fractionated movie. This example contains forty-nine frames. In electron-counting acquisition, fractionating the exposure allows us to estimate motion and to give less weight to high-frequency information in later, more radiation-damaged frames. After alignment and summation, we obtain a micrograph. In tomography, the corresponding measurement is a tilt series.

**21. [4:01] — Inferred row: coordinates, extracted boxes, 2D classes, density map.**  
Particle coordinates, extracted boxes, class averages, orientations, and the final density map are all inferred from those measurements.

**22. [4:08] — Dividing line labelled 'measured | inferred'.**  
This is not a perfectly sharp boundary—the movie itself undergoes detector corrections—but it is a useful principle: a processed result is not the same thing as independent experimental evidence.


## Slide 6 · End-to-end workflow  (4:20–5:10, 50 s)

**23. [4:20] — Arrive on slide**  
Here is the complete workflow.

**24. [4:22] — SPA branch draws left to right.**  
For single-particle analysis, we move from movies to motion correction, CTF estimation, particle picking, extraction, two- and three-dimensional classification, refinement, post-processing, and atomic-model building.

**25. [4:31] — Cryo-ET branch splits off at reconstruction.**  
Tomography adds tilt-series alignment, tomogram reconstruction, three-dimensional particle localization, and subtomogram averaging.

**26. [4:36] — Violet tags mark stages where DL tools exist; CryoAI and Cryo2StructData tags highlighted.**  
Deep learning now appears at many points, but not every computational step is AI. Standard motion correction and CTF estimation are still primarily driven by image statistics, physical models, and optimization. Other methods move farther downstream. CryoAI, for example, uses a learned encoder with a physics-based image-formation model to accelerate pose estimation and reconstruction. Deep-learning datasets have also been developed for training automated model-building methods. For this talk, I will focus on three stages where errors can strongly affect everything downstream: motion correction, particle picking, and map enhancement.


## Slide 7 · Motion correction  (5:10–6:10, 60 s)

**27. [5:10] — Arrive on slide**  
First, motion. During exposure, the electron beam can deform the ice, while the specimen stage may also drift.

**28. [5:18] — Unaligned frame groups drift (plays once, holds).**  
In this real movie, the estimated displacement across forty-nine frames is about twenty-one ångströms—much larger than the high-resolution detail we hope to recover.

**29. [5:28] — Global trajectory plotted; unaligned vs aligned power spectra.**  
If we simply sum the frames, the image blurs and the Thon rings in the power spectrum become weaker. After alignment, those rings become clearer, which also improves downstream CTF estimation.

**30. [5:41] — Patch residual trajectories; outlier corner patch flagged amber dashed.**  
Local or patch-based correction can model non-uniform motion, but very small patches may contain too little signal for a reliable trajectory. Dose weighting then reduces the high-frequency contribution of later, more damaged frames.

**31. [5:55] — Label: 'conventional optimization — not deep learning'.**  
The key point is that commonly used tools such as MotionCor2, RELION Bayesian polishing, and cryoSPARC patch motion correction are not deep-learning methods. They provide a useful reminder that sophisticated automation is not automatically AI.


## Slide 8 · Particle picking as an inference problem  (6:10–7:05, 55 s)

**32. [6:10] — Arrive on slide**  
Particle picking looks like object detection, but the ground truth is unusually uncertain. Particles have low contrast; contamination can resemble protein; particles can overlap; and rare orientations may look unfamiliar. Even expert labels are not necessarily complete. I ran Topaz on twelve micrographs and compared its coordinates with expert annotations, using a seventy-one-ångström matching radius for this analysis.

**33. [6:35] — Cyan solid outlines: agreed picks.**  
The two methods agreed on 6,108 particles.

**34. [6:38] — Amber dashed: model-only picks (uncertain).**  
Topaz selected another 1,887 that were not in the expert labels,

**35. [6:42] — White dotted: expert-only picks (missed).**  
while the expert had 721 that Topaz missed. It is tempting to call every model-only pick a false positive, but that assumes the human labels are exhaustive. Some may be genuine particles the expert skipped.

**36. [6:57] — Threshold label appears with its value.**  
Also, Topaz produces ranking scores, not universally calibrated probabilities, so all these counts depend on the chosen score threshold.


## Slide 9 · Topaz, crYOLO and TomoTwin  (7:05–8:20, 75 s)

**37. [7:05] — Arrive on slide**  
These three pickers represent three different learning strategies.

**38. [7:08] — Topaz column: labelled positives + unlabeled background → score map.**  
Topaz uses positive-unlabeled learning. We label a relatively small set of particles as positive, but the rest of the micrograph is treated as unlabeled—not automatically negative—because it may contain real particles that no one clicked. A convolutional neural network produces a score map, which is converted into coordinates using a chosen threshold.

**39. [7:30] — crYOLO column: grid → boxes with confidence.**  
crYOLO treats picking as supervised object detection. Based on the YOLO framework, it predicts particle locations and confidence scores in one pass. It can be trained for a particular dataset, while its general model was designed to work on previously unseen datasets and support rapid, on-the-fly processing.

**40. [7:49] — TomoTwin column: subvolumes → 32-D embedding; same protein clusters.**  
TomoTwin operates in three-dimensional tomograms. It uses deep metric learning to place small subvolumes into an embedding space, where structurally similar objects lie close together. A reference embedding can then be used to search for related particles without retraining the network for every target.

**41. [8:07] — Comparison table.**  
However, generalization has limits. TomoTwin was trained largely with simulated examples, performance declines for small or poorly resolved targets, and closely related conformations may not separate during the initial localization step.


## Slide 10 · How to interpret picker output  (8:20–9:40, 80 s)

**42. [8:20] — Arrive on slide**  
How should we evaluate a picker? Precision asks: of everything selected, how much appears to be real? Recall asks: of all labelled particles, how many were recovered? F1 combines the two—but all three depend on the quality and completeness of the reference labels.

**43. [8:37] — Precision–recall curve draws; threshold marker moves from high to low (D3).**  
Here is the precision–recall trade-off for Topaz on my twelve micrographs. Lowering the threshold increases the number of picks and improves recall, but precision falls.

**44. [8:47] — Best-F1 point annotated; pick count shown.**  
In this comparison, threshold two gave the highest F1 score, around 0.82. After retraining on a subset of the annotations, the score improved on held-out micrographs.

**45. [8:58] — 2D classes: agreed picks vs 'false-positive' picks vs missed picks.**  
But the more revealing result came from classifying the supposed false positives. Several two-dimensional classes resemble genuine beta-galactosidase views, and the largest group contains overlapping neighbours. The expert labels were useful, but they were never designed to be a complete ground truth for this benchmark.

**46. [9:16] — Downstream checklist and FSC schematic.**  
So coordinate-level metrics are only the first check. We should also examine two-dimensional class quality, orientation coverage, retention of rare views, local resolution, and gold-standard FSC from independently refined half-sets. At the half-map FSC threshold of 0.143, we estimate resolution—but that number is meaningful only when half-set independence and masking are handled properly. More particles are not automatically better particles.


## Slide 11 · DeepEMhancer and map enhancement  (9:40–10:50, 70 s)

**47. [9:40] — Arrive on slide**  
Next is map enhancement, shown here for a beta-2 adrenergic receptor dimer in a nanodisc.

**48. [9:46] — Unsharpened average of half maps.**  
An unsharpened reconstruction often has weak high-frequency contrast.

**49. [9:49] — Global B-factor sharpening (conventional).**  
Global B-factor sharpening boosts high frequencies with one overall correction, but map quality is spatially variable: a rigid protein core and a flexible lipid environment should not necessarily receive the same treatment.

**50. [10:02] — DeepEMhancer output.**  
DeepEMhancer is a three-dimensional convolutional network trained on experimental maps paired with targets derived using deposited atomic models. It performs masking-like and sharpening-like operations and often produces a map that is much easier to interpret.

**51. [10:15] — Independent evidence panel: half-map FSC + local-resolution colour scale.**  
But easier to interpret does not mean independently more accurate. The half-map FSC—and therefore the experimental resolution evidence—does not improve merely because the displayed map looks cleaner.

**52. [10:26] — Half contour level: nanodisc present in conventional maps, absent after DeepEMhancer.**  
Now look at the low contour level. The conventional maps show the nanodisc density, while DeepEMhancer strongly suppresses it. That density may be real even though it does not resemble the protein-focused training target. Therefore, an enhanced map should be treated as an interpretation aid. Atomic models should be validated against the original, independently refined half-maps, not against the enhanced map alone.


## Slide 12 · Literature case study: six pickers, same data  (10:50–12:00, 70 s)

**53. [10:50] — Arrive on slide**  
A published comparison makes the same point at the particle-picking stage.

**54. [10:54] — Six pickers listed.**  
Dhakal and colleagues evaluated six pickers on four EMPIAR datasets using a shared cryoSPARC processing workflow.

**55. [11:01] — Particle counts (full EMPIAR) appear as bars.**  
The methods produced dramatically different particle counts. In the reported full-dataset comparison, Topaz selected roughly twice as many particles as CryoSegNet,

**56. [11:09] — Average resolution appears (lower is better).**  
yet CryoSegNet achieved a slightly better average resolution.

**57. [11:12] — Highlight: more particles ≠ better resolution (Topaz vs CryoSegNet; HA dataset).**  
For hemagglutinin, two methods reached approximately the same reported resolution using very different numbers of particles. So particle count alone is a poor measure of success. A smaller set can perform better if it contains cleaner particles or better coverage of viewing directions.

**58. [11:30] — Qualification: benchmark-specific, best of 3, CryoSegNet not best everywhere; EMPIAR-10093 text/table conflict.**  
The benchmark also has limitations: only four proteins were tested; selecting the best of several runs can favour unstable methods; and some evaluated tools came from the benchmarking group. There was even a discrepancy between one table and the written interpretation for one dataset.

**59. [11:47] — Transition: orientation coverage and FSC.**  
The right conclusion is not that one picker always wins. It is that benchmarking must include orientation coverage, reconstruction quality, robustness across datasets, and transparent reporting—not only the number of coordinates returned.


## Slide 13 · When these tools are useful  (12:00–12:55, 55 s)

**60. [12:00] — Arrive on slide**  
So when are these tools useful?

**61. [12:02] — 'Use AI' column.**  
Topaz is valuable for large single-particle datasets when only a modest number of labels are available. crYOLO’s general model can provide a fast first pass during data collection. TomoTwin is attractive for locating known macromolecular shapes in crowded tomograms. A practical workflow is iterative: pick broadly, inspect the micrographs and two-dimensional classes, remove obvious contaminants, retrain if appropriate, and repick. The goal is not just to clean the dominant views, but also to preserve valid rare orientations.

**62. [12:34] — 'Prefer simpler' column.**  
Simpler methods may be preferable when particles are large and obvious, when the dataset is small, or when transparent parameter control matters more than marginal speed. Template matching can produce template bias—sometimes called “Einstein from noise.” Learned pickers do not remove bias; they replace it with biases from labels, simulations, and training distributions.


## Slide 14 · Limitations, artifacts and safeguards  (12:55–14:00, 65 s)

**63. [12:55] — Arrive on slide**  
What can go wrong? I group the failures into five categories.

**64. [13:00] — Failure modes, grouped: data, labels, physics, model, evaluation.**  
First, data shift: a new microscope, detector, ice thickness, or particle size may differ from the training data. Second, label problems: annotations are incomplete and subjective, while true particles are rare relative to background.

**65. [13:14] — Missing-wedge simulation inset (x–z slice).**  
Third, physical limitations: small particles, overlap, contamination, preferred orientation, and the tomographic missing wedge can all cause silent failures. Fourth, model behaviour: scores may be overconfident, results depend on thresholds, and enhancement can erase or exaggerate density. Finally, evaluation bias: test data may overlap with training sources, or developers may benchmark their own tools under favourable conditions.

**66. [13:38] — Safeguards column, each paired with the failure it addresses.**  
The safeguards should match those risks: test on held-out micrographs and genuinely different datasets; inspect raw data and class averages; examine orientation distributions and local resolution; preserve untouched half-maps; compare more than one method; and validate structural claims with biochemical or functional evidence whenever possible. No single metric can certify the entire pipeline.


## Slide 15 · Take-home decision framework  (14:00–14:40, 40 s)

**67. [14:00] — Arrive on slide**  
I want to leave you with three points.

**68. [14:03] — Conclusion 1.**  
First, AI is most useful when it reduces repetitive inference while leaving the experimental evidence available for inspection.

**69. [14:10] — Conclusion 2.**  
Second, cleaner does not necessarily mean more accurate. More particles, prettier density, and higher confidence can all mislead us.

**70. [14:17] — Conclusion 3.**  
Third, validation must match the biological claim. For every AI step, we should be able to name an independent check that could reveal its failure.

**71. [14:26] — Final line.**  
The goal is not the most picks or the prettiest map. It is to recover structural information without losing track of uncertainty—and to distinguish what is supported by the data from what is suggested by the model.


## Slide 16 · References and questions  (14:40–15:00, 20 s)

**72. [14:40] — Arrive on slide**  
These are the main reviews, datasets, and primary papers behind the talk. All of the examples shown here use public cryo-EM or cryo-ET data, and the full bibliography, analysis details, and data provenance are included with the presentation. Thank you. I’m happy to take questions.

*(Only if asked: click "Full bibliography", bottom right — not a scheduled press.)*


---
End 15:00 · 72 presses (press 1 is the silent opening; the timed talk starts at press 2).
