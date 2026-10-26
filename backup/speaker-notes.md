# Speaker notes — AI in cryo-EM and cryo-ET data processing

## S01 · Title and central question

- **TARGET TIME:** 40 s (0:00–0:40)
- **WORD COUNT:** 101
- **SCRIPT:** Let me start with a challenge. This is a real cryo-EM micrograph of beta-galactosidase from EMPIAR-10017. At first glance, can you confidently identify even one protein particle?

Once I apply a low-pass filter, the particles become easier to see. The cyan outlines are particles selected by both a human expert and Topaz, a neural-network-based picker. Amber means Topaz alone selected the particle, and white means only the expert did.

They agree often—but not always. That disagreement leads to my main question: where can deep learning improve cryo-EM and cryo-ET analysis, and how can we tell whether the improvement is scientifically trustworthy?
- **CLICK 1:** PRE-ROLL (not in the 15:00): play the opening scene — 14 s, silent, holds on the title. Say nothing, or one line. Start your timer on the next click.
- **CLICK 2:** Fade to the real micrograph (start speaking).
- **CLICK 3:** Low-pass filter fades in over the raw micrograph.
- **CLICK 4:** Outlines appear: cyan solid = expert and Topaz agree; amber dashed = Topaz only; white dotted = expert only.
- **CLICK 5:** Central question appears.
- **SOURCE:** EMPIAR-10017 entry and data; Topaz (Bepler et al. 2019). Pick comparison recomputed by the presenter (production/data-pipeline/eval_picks.py).
- **ESSENTIAL QUALIFICATION:** The micrograph is an unaligned 24-frame average from 2012 — older and noisier than modern data, which makes the point about low SNR but is not state of the art.
- **OPTIONAL DEEPER EXPLANATION:** The 'expert' labels are one person's choices for a 2015 semi-automated picking paper; they were never meant to be exhaustive ground truth.
- **LIKELY QUESTION:** Is this micrograph simulated?
- **SUGGESTED ANSWER:** No. It is deposited experimental data (EMPIAR-10017). Only the low-pass filter and the outlines are computed; the label in the corner says so.

## S02 · Why AI-assisted processing matters

- **TARGET TIME:** 50 s (0:40–1:30)
- **WORD COUNT:** 123
- **SCRIPT:** Why automate this process at all? There are three pressures: weak signal, enormous data volume, and human time.

Radiation damages biological samples, so the total electron dose must remain limited. As a result, each particle image is extremely noisy. At the same time, modern microscopes can generate thousands of movies and very large datasets. In one benchmark dataset I will show later, Topaz selected more than four hundred thousand candidate particles. Manually examining all of them is unrealistic.

But speed alone is not the goal. A false particle pick, an inaccurate motion estimate, or an aggressively enhanced map can influence every later stage—from classification and refinement to the biological conclusion. Automation is useful only when we preserve a way to detect its mistakes.
- **CLICK 1:** Dose chart: SNR at 3/4/8/20 Å vs total dose; dots mark each resolution's best dose; amber line = this micrograph's 24 e⁻/Å².
- **CLICK 2:** Scale numbers appear: archive size, picks on one dataset, expert picks per micrograph.
- **CLICK 3:** Pipeline strip appears; an error marker at 'pick' propagates to 'interpret'.
- **SOURCE:** Iqbal et al. 2026 (EMPIAR: 1,879 entries, 4.83 PB as of 14 Jan 2025); Dhakal et al. 2025 Table 3 (Topaz, EMPIAR-10093 full: 437,235 picks); EMPIAR-10017 metadata (24 e⁻/Å²); presenter count of 6,829 expert coordinates in 12 micrographs.
- **ESSENTIAL QUALIFICATION:** Archive size is a review's snapshot; it grows continuously. The 400,000 picks are one tool on one dataset, not typical of every project.
- **OPTIONAL DEEPER EXPLANATION:** Dose is limited because high-energy electrons break bonds; at ~20–60 e⁻/Å² high-resolution features are already being destroyed, so you cannot simply 'expose longer'.
- **LIKELY QUESTION:** Isn't manual picking still the gold standard?
- **SUGGESTED ANSWER:** It is a useful reference but not ground truth: humans miss particles, are inconsistent between sessions, and favour obvious views. Our own comparison later shows the expert skipped real particles.

## S03 · What cryo-EM and cryo-ET reveal

- **TARGET TIME:** 55 s (1:30–2:25)
- **WORD COUNT:** 134
- **SCRIPT:** Before discussing the tools, I want to separate two related workflows.

In single-particle cryo-EM, we image many purified copies of the same complex in different orientations. We extract and align their two-dimensional projections, then combine them into a three-dimensional reconstruction. For suitable samples, this can reach near-atomic or atomic resolution.

Cryo-electron tomography is different. We tilt one region of a thicker specimen—often a cell or lamella—typically through roughly plus or minus sixty degrees, and reconstruct a three-dimensional tomogram. Because we cannot collect every tilt angle, the reconstruction contains a missing wedge of information. We can then locate repeated complexes and average their subtomograms.

So single-particle analysis usually asks, “What is the molecular structure and mechanism?” Tomography also asks, “Where is this complex, what surrounds it, and what state is it in inside the cell?”
- **CLICK 1:** Right panel (tomography) slides in.
- **CLICK 2:** Question boxes appear under each panel.
- **SOURCE:** Iqbal et al. 2026 (SPA vs in situ ET); TomoTwin (Rice et al. 2023) for tomogram picking context.
- **ESSENTIAL QUALIFICATION:** ±60° is typical, not universal; dose-symmetric schemes and specimen thickness change the usable range.
- **OPTIONAL DEEPER EXPLANATION:** Subtomogram averaging can reach sub-4 Å for abundant, rigid complexes such as ribosomes in situ, but most cellular targets are far lower resolution.
- **LIKELY QUESTION:** Why not just tilt to ±90°?
- **SUGGESTED ANSWER:** The holder and the grid bars block the beam, and a slab-shaped specimen gets effectively thicker with tilt (path length ∝ 1/cos θ). Beyond ~60–70° there is almost no usable signal.

## S04 · Fundamental image-formation principle

- **TARGET TIME:** 70 s (2:25–3:35)
- **WORD COUNT:** 171
- **SCRIPT:** This equation summarizes the imaging problem. We begin with the molecule’s three-dimensional Coulomb-potential map, shown here as V. Each particle has an unknown orientation, phi-i.

The microscope records a two-dimensional projection of that object. The contrast transfer function, or CTF, then modulates the Fourier components according to imaging conditions such as defocus. Some spatial frequencies change sign, and information is strongly attenuated near CTF zeros. Collecting particles at different defocus values helps provide complementary frequency information.

Finally, we add noise—and at an SNR of 0.05, the particle nearly disappears.

The rescue is averaging. If particles are correctly aligned and their noise is largely independent, the amplitude signal-to-noise improves approximately with the square root of the number of particles. Projections from many orientations then sample three-dimensional Fourier space, as described by the central-slice theorem.

In this simulation, correlation with the true map improves as the number of views increases. But here the orientations are already known. In experimental data, estimating particle positions, orientations, motion, and optical parameters is the difficult inverse problem.
- **CLICK 1:** Projection: clean views of the simulated molecule.
- **CLICK 2:** CTF: the 1D curve and the CTF-modulated images.
- **CLICK 3:** Noise: the same images at SNR 0.05.
- **CLICK 4:** Averaging: 1 → 10 → 100 → 1000 aligned copies.
- **CLICK 5:** Reconstruction: central slices from 30 → 300 → 3,000 → 30,000 views.
- **SOURCE:** Central-slice theorem (DeRosier & Klug 1968, cited in Iqbal et al. 2026); CryoAI (Levy et al. 2022) formulates the same forward model.
- **ESSENTIAL QUALIFICATION:** Poses are known in this simulation. Real data must estimate them, which is the hard part; this is an upper bound on what averaging can do.
- **OPTIONAL DEEPER EXPLANATION:** CTF(k) = −[√(1−A²)·sin χ(k) + A·cos χ(k)], χ(k) = πλΔf k² − (π/2)C_s λ³ k⁴. Defocus is varied across micrographs so that zeros fall at different k and the averaged data cover all frequencies.
- **LIKELY QUESTION:** If the CTF has zeros, how is that information recovered?
- **SUGGESTED ANSWER:** By collecting images at different defocus values: each has zeros at different frequencies, so the combined data fill the gaps. CTF correction (Wiener filtering) then weights each image by how much signal it carries at each frequency.

## S05 · What the raw data look like

- **TARGET TIME:** 45 s (3:35–4:20)
- **WORD COUNT:** 113
- **SCRIPT:** It is useful to distinguish what the microscope measures from what the software infers.

The detector records a dose-fractionated movie. This example contains forty-nine frames. In electron-counting acquisition, fractionating the exposure allows us to estimate motion and to give less weight to high-frequency information in later, more radiation-damaged frames. After alignment and summation, we obtain a micrograph. In tomography, the corresponding measurement is a tilt series.

Particle coordinates, extracted boxes, class averages, orientations, and the final density map are all inferred from those measurements.

This is not a perfectly sharp boundary—the movie itself undergoes detector corrections—but it is a useful principle: a processed result is not the same thing as independent experimental evidence.
- **CLICK 1:** Measured row: single frame, aligned sum, tilt series (simulated).
- **CLICK 2:** Inferred row: coordinates, extracted boxes, 2D classes, density map.
- **CLICK 3:** Dividing line labelled 'measured | inferred'.
- **SOURCE:** EMPIAR-10204; RELION-3 tutorial dose (1.277 e⁻/Å² per frame) for this dataset; EMPIAR-10017; EMD-72202.
- **ESSENTIAL QUALIFICATION:** Even the 'measured' micrograph is already processed (gain correction, alignment). The line is a gradient, not a wall.
- **OPTIONAL DEEPER EXPLANATION:** Direct electron detectors made movies possible: by counting individual electrons at high frame rates they let us correct motion after the fact (Li et al. 2013).
- **LIKELY QUESTION:** Why record a movie instead of one long exposure?
- **SUGGESTED ANSWER:** Because the specimen moves during exposure. Fractionating the dose lets you measure and undo motion, and weight early (less damaged) frames more heavily at high resolution.

## S06 · End-to-end workflow

- **TARGET TIME:** 50 s (4:20–5:10)
- **WORD COUNT:** 129
- **SCRIPT:** Here is the complete workflow.

For single-particle analysis, we move from movies to motion correction, CTF estimation, particle picking, extraction, two- and three-dimensional classification, refinement, post-processing, and atomic-model building.

Tomography adds tilt-series alignment, tomogram reconstruction, three-dimensional particle localization, and subtomogram averaging.

Deep learning now appears at many points, but not every computational step is AI. Standard motion correction and CTF estimation are still primarily driven by image statistics, physical models, and optimization.

Other methods move farther downstream. CryoAI, for example, uses a learned encoder with a physics-based image-formation model to accelerate pose estimation and reconstruction. Deep-learning datasets have also been developed for training automated model-building methods.

For this talk, I will focus on three stages where errors can strongly affect everything downstream: motion correction, particle picking, and map enhancement.
- **CLICK 1:** SPA branch draws left to right.
- **CLICK 2:** Cryo-ET branch splits off at reconstruction.
- **CLICK 3:** Violet tags mark stages where DL tools exist; CryoAI and Cryo2StructData tags highlighted.
- **SOURCE:** Iqbal et al. 2026; Levy et al. 2022 ('one order of magnitude faster for large datasets'); Giri et al. 2024 ('7,600 preprocessed cryo-EM density maps').
- **ESSENTIAL QUALIFICATION:** CryoAI's speed-up is for homogeneous reconstruction on large datasets, compared with the solvers the authors tested; it does not handle heterogeneity.
- **OPTIONAL DEEPER EXPLANATION:** Amortized inference: instead of searching all orientations for every image (like RELION's expectation–maximization), CryoAI trains one encoder that maps any image to a pose, so the cost per image falls as the dataset grows.
- **LIKELY QUESTION:** Is motion correction or CTF estimation done by deep learning?
- **SUGGESTED ANSWER:** Not in the standard tools. MotionCor2, RELION and cryoSPARC patch motion use optimization; CTFFIND and Gctf fit a physical model. I found no widely used deep-learning motion-correction method.

## S07 · Motion correction

- **TARGET TIME:** 60 s (5:10–6:10)
- **WORD COUNT:** 140
- **SCRIPT:** First, motion. During exposure, the electron beam can deform the ice, while the specimen stage may also drift.

In this real movie, the estimated displacement across forty-nine frames is about twenty-one ångströms—much larger than the high-resolution detail we hope to recover. If we simply sum the frames, the image blurs and the Thon rings in the power spectrum become weaker. After alignment, those rings become clearer, which also improves downstream CTF estimation.

Local or patch-based correction can model non-uniform motion, but very small patches may contain too little signal for a reliable trajectory. Dose weighting then reduces the high-frequency contribution of later, more damaged frames.

The key point is that commonly used tools such as MotionCor2, RELION Bayesian polishing, and cryoSPARC patch motion correction are not deep-learning methods. They provide a useful reminder that sophisticated automation is not automatically AI.
- **CLICK 1:** Unaligned frame groups drift (plays once, holds).
- **CLICK 2:** Global trajectory plotted; unaligned vs aligned power spectra.
- **CLICK 3:** Patch residual trajectories; outlier corner patch flagged amber dashed.
- **CLICK 4:** Label: 'conventional optimization — not deep learning'.
- **SOURCE:** Presenter's recomputation on EMPIAR-10204 (production/data-pipeline/motioncorr_demo.py); MotionCor2 (Zheng et al. 2017); Bayesian polishing (Zivanov et al. 2019); dose weighting (Grant & Grigorieff 2015).
- **ESSENTIAL QUALIFICATION:** Our script is a teaching re-implementation; its drift estimate is not a MotionCor2 result. The 21 Å is for this one movie.
- **OPTIONAL DEEPER EXPLANATION:** Errors propagate: a wrong trajectory blurs high frequencies, which damps Thon rings and degrades CTF estimation, which then mis-weights every particle downstream.
- **LIKELY QUESTION:** Could a neural network do motion correction better?
- **SUGGESTED ANSWER:** Possibly, but motion is a well-posed physical problem with strong signal from the whole frame; optimization already works well. Learned priors would risk inventing motion. I found no widely adopted DL method for it.

## S08 · Particle picking as an inference problem

- **TARGET TIME:** 55 s (6:10–7:05)
- **WORD COUNT:** 130
- **SCRIPT:** Particle picking looks like object detection, but the ground truth is unusually uncertain. Particles have low contrast; contamination can resemble protein; particles can overlap; and rare orientations may look unfamiliar. Even expert labels are not necessarily complete.

I ran Topaz on twelve micrographs and compared its coordinates with expert annotations, using a seventy-one-ångström matching radius for this analysis.

The two methods agreed on 6,108 particles. Topaz selected another 1,887 that were not in the expert labels, while the expert had 721 that Topaz missed.

It is tempting to call every model-only pick a false positive, but that assumes the human labels are exhaustive. Some may be genuine particles the expert skipped. Also, Topaz produces ranking scores, not universally calibrated probabilities, so all these counts depend on the chosen score threshold.
- **CLICK 1:** Cyan solid outlines: agreed picks.
- **CLICK 2:** Amber dashed: model-only picks (uncertain).
- **CLICK 3:** White dotted: expert-only picks (missed).
- **CLICK 4:** Threshold label appears with its value.
- **SOURCE:** Dhakal et al. 2025 (challenges: low SNR, contamination, overlap, heterogeneity); presenter's Topaz run.
- **ESSENTIAL QUALIFICATION:** Matching radius and threshold are our choices (40 px ≈ 71 Å; score 2.0, the best-F1 threshold). Different choices shift every count.
- **OPTIONAL DEEPER EXPLANATION:** In detection terms, a 'pick' is a coordinate plus a score. The score is not a calibrated probability; it ranks candidates within a run.
- **LIKELY QUESTION:** Why not use the network's confidence directly?
- **SUGGESTED ANSWER:** Scores are ranks, not calibrated probabilities, and they shift between datasets. That is why you choose thresholds by downstream quality — 2D classes and resolution — not by the score itself.

## S09 · Topaz, crYOLO and TomoTwin

- **TARGET TIME:** 75 s (7:05–8:20)
- **WORD COUNT:** 182
- **SCRIPT:** These three pickers represent three different learning strategies.

Topaz uses positive-unlabeled learning. We label a relatively small set of particles as positive, but the rest of the micrograph is treated as unlabeled—not automatically negative—because it may contain real particles that no one clicked. A convolutional neural network produces a score map, which is converted into coordinates using a chosen threshold.

crYOLO treats picking as supervised object detection. Based on the YOLO framework, it predicts particle locations and confidence scores in one pass. It can be trained for a particular dataset, while its general model was designed to work on previously unseen datasets and support rapid, on-the-fly processing.

TomoTwin operates in three-dimensional tomograms. It uses deep metric learning to place small subvolumes into an embedding space, where structurally similar objects lie close together. A reference embedding can then be used to search for related particles without retraining the network for every target.

However, generalization has limits. TomoTwin was trained largely with simulated examples, performance declines for small or poorly resolved targets, and closely related conformations may not separate during the initial localization step.
- **CLICK 1:** Topaz column: labelled positives + unlabeled background → score map.
- **CLICK 2:** crYOLO column: grid → boxes with confidence.
- **CLICK 3:** TomoTwin column: subvolumes → 32-D embedding; same protein clusters.
- **CLICK 4:** Comparison table.
- **SOURCE:** Topaz: PU learning with class prior π and constraint λ; crYOLO: 'up to five micrographs per second', general model 'trained on more than 40 datasets'; TomoTwin: '37 × 37 × 37 subvolume to a 32-length feature vector', 120 proteins (108 in the curated training set), ~150 kDa expected limit, ~10 Å/px.
- **ESSENTIAL QUALIFICATION:** Speeds and limits are as reported by each tool's authors on their hardware and test data.
- **OPTIONAL DEEPER EXPLANATION:** Metric learning trains with triplets: an anchor, a positive (same protein) and a negative (different protein). The loss pulls anchor–positive together and pushes anchor–negative apart by a margin.
- **LIKELY QUESTION:** Why is Topaz's 'unlabeled' not the same as 'negative'?
- **SUGGESTED ANSWER:** Because most unlabeled pixels near particles are particles nobody clicked. Treating them as negatives teaches the network to reject real particles. PU learning instead estimates how many positives hide in the unlabeled set.

## S10 · How to interpret picker output

- **TARGET TIME:** 80 s (8:20–9:40)
- **WORD COUNT:** 199
- **SCRIPT:** How should we evaluate a picker? Precision asks: of everything selected, how much appears to be real? Recall asks: of all labelled particles, how many were recovered? F1 combines the two—but all three depend on the quality and completeness of the reference labels.

Here is the precision–recall trade-off for Topaz on my twelve micrographs. Lowering the threshold increases the number of picks and improves recall, but precision falls. In this comparison, threshold two gave the highest F1 score, around 0.82. After retraining on a subset of the annotations, the score improved on held-out micrographs.

But the more revealing result came from classifying the supposed false positives. Several two-dimensional classes resemble genuine beta-galactosidase views, and the largest group contains overlapping neighbours. The expert labels were useful, but they were never designed to be a complete ground truth for this benchmark.

So coordinate-level metrics are only the first check. We should also examine two-dimensional class quality, orientation coverage, retention of rare views, local resolution, and gold-standard FSC from independently refined half-sets. At the half-map FSC threshold of 0.143, we estimate resolution—but that number is meaningful only when half-set independence and masking are handled properly. More particles are not automatically better particles.
- **CLICK 1:** Precision–recall curve draws; threshold marker moves from high to low (D3).
- **CLICK 2:** Best-F1 point annotated; pick count shown.
- **CLICK 3:** 2D classes: agreed picks vs 'false-positive' picks vs missed picks.
- **CLICK 4:** Downstream checklist and FSC schematic.
- **SOURCE:** Presenter's recomputation (eval_picks.py, classify2d_picks.py); FSC 0.143 criterion (Rosenthal & Henderson 2003); gold-standard half maps (Scheres & Chen 2012).
- **ESSENTIAL QUALIFICATION:** Our 2D classification is a simplified teaching implementation and the 'looks like β-gal' judgement is visual, not quantified.
- **OPTIONAL DEEPER EXPLANATION:** Topaz trained on only 25% of the expert labels in 8 micrographs reached best F1 0.863 on 4 held-out micrographs, vs 0.823 for the pretrained general model — PU learning in action, on real data.
- **LIKELY QUESTION:** Why 0.143 for the FSC threshold?
- **SUGGESTED ANSWER:** Half-maps each contain half the data. 0.143 for their correlation corresponds to 0.5 correlation between the full map and a perfect reference (Rosenthal & Henderson 2003). It is a convention; the shape of the whole curve matters too.

## S11 · DeepEMhancer and map enhancement

- **TARGET TIME:** 70 s (9:40–10:50)
- **WORD COUNT:** 179
- **SCRIPT:** Next is map enhancement, shown here for a beta-2 adrenergic receptor dimer in a nanodisc.

An unsharpened reconstruction often has weak high-frequency contrast. Global B-factor sharpening boosts high frequencies with one overall correction, but map quality is spatially variable: a rigid protein core and a flexible lipid environment should not necessarily receive the same treatment.

DeepEMhancer is a three-dimensional convolutional network trained on experimental maps paired with targets derived using deposited atomic models. It performs masking-like and sharpening-like operations and often produces a map that is much easier to interpret.

But easier to interpret does not mean independently more accurate. The half-map FSC—and therefore the experimental resolution evidence—does not improve merely because the displayed map looks cleaner.

Now look at the low contour level. The conventional maps show the nanodisc density, while DeepEMhancer strongly suppresses it. That density may be real even though it does not resemble the protein-focused training target. Therefore, an enhanced map should be treated as an interpretation aid. Atomic models should be validated against the original, independently refined half-maps, not against the enhanced map alone.
- **CLICK 1:** Unsharpened average of half maps.
- **CLICK 2:** Global B-factor sharpening (conventional).
- **CLICK 3:** DeepEMhancer output.
- **CLICK 4:** Independent evidence panel: half-map FSC + local-resolution colour scale.
- **CLICK 5:** Half contour level: nanodisc present in conventional maps, absent after DeepEMhancer.
- **SOURCE:** DeepEMhancer: 'trained on a dataset of pairs of experimental maps and maps sharpened using their respective atomic models'; testing set of 20 maps. Iqbal et al. 2026: such methods 'can introduce model bias, particularly when dealing with structures underrepresented in the data'.
- **ESSENTIAL QUALIFICATION:** Our FSC (2.62 Å, soft mask) differs slightly from the deposited 2.5 Å because masks differ. Local resolution uses a 24-voxel window and 0.5 threshold, which is conservative.
- **OPTIONAL DEEPER EXPLANATION:** Global B-factor sharpening multiplies amplitudes by exp(B·s²/4): one number for the whole map, so flexible regions get over-sharpened (noise) and rigid cores under-sharpened. DeepEMhancer and LocScale act locally.
- **LIKELY QUESTION:** If DeepEMhancer improves the FSC against the atomic model, isn't that proof it adds information?
- **SUGGESTED ANSWER:** No. Its training target was model-based maps, so agreement with a model is partly what it learned to produce. Independent evidence must come from the half maps, which the network never 'saw' separately.

## S12 · Literature case study: six pickers, same data

- **TARGET TIME:** 70 s (10:50–12:00)
- **WORD COUNT:** 175
- **SCRIPT:** A published comparison makes the same point at the particle-picking stage. Dhakal and colleagues evaluated six pickers on four EMPIAR datasets using a shared cryoSPARC processing workflow.

The methods produced dramatically different particle counts. In the reported full-dataset comparison, Topaz selected roughly twice as many particles as CryoSegNet, yet CryoSegNet achieved a slightly better average resolution. For hemagglutinin, two methods reached approximately the same reported resolution using very different numbers of particles.

So particle count alone is a poor measure of success. A smaller set can perform better if it contains cleaner particles or better coverage of viewing directions.

The benchmark also has limitations: only four proteins were tested; selecting the best of several runs can favour unstable methods; and some evaluated tools came from the benchmarking group. There was even a discrepancy between one table and the written interpretation for one dataset.

The right conclusion is not that one picker always wins. It is that benchmarking must include orientation coverage, reconstruction quality, robustness across datasets, and transparent reporting—not only the number of coordinates returned.
- **CLICK 1:** Six pickers listed.
- **CLICK 2:** Particle counts (full EMPIAR) appear as bars.
- **CLICK 3:** Average resolution appears (lower is better).
- **CLICK 4:** Highlight: more particles ≠ better resolution (Topaz vs CryoSegNet; HA dataset).
- **CLICK 5:** Qualification: benchmark-specific, best of 3, CryoSegNet not best everywhere; EMPIAR-10093 text/table conflict.
- **CLICK 6:** Transition: orientation coverage and FSC.
- **SOURCE:** Dhakal et al. 2025, Table 3 and Results text; values in src/data/benchmarks.json.
- **ESSENTIAL QUALIFICATION:** Benchmark- and protocol-specific; best of three trials; four proteins; CryoSegNet and CryoTransformer come from the same group as the review's authors.
- **OPTIONAL DEEPER EXPLANATION:** Best-of-three reporting rewards variance: a method with unstable ab initio runs can look better than its typical result. Averages over seeds with spread would be more conservative.
- **LIKELY QUESTION:** So which picker should I use?
- **SUGGESTED ANSWER:** The one that gives the best validated reconstruction on your data. Run two, compare 2D classes, orientation coverage and half-map FSC, and keep the union or the better set. Rankings from one benchmark do not transfer automatically.

## S13 · When these tools are useful

- **TARGET TIME:** 55 s (12:00–12:55)
- **WORD COUNT:** 136
- **SCRIPT:** So when are these tools useful?

Topaz is valuable for large single-particle datasets when only a modest number of labels are available. crYOLO’s general model can provide a fast first pass during data collection. TomoTwin is attractive for locating known macromolecular shapes in crowded tomograms.

A practical workflow is iterative: pick broadly, inspect the micrographs and two-dimensional classes, remove obvious contaminants, retrain if appropriate, and repick. The goal is not just to clean the dominant views, but also to preserve valid rare orientations.

Simpler methods may be preferable when particles are large and obvious, when the dataset is small, or when transparent parameter control matters more than marginal speed. Template matching can produce template bias—sometimes called “Einstein from noise.” Learned pickers do not remove bias; they replace it with biases from labels, simulations, and training distributions.
- **CLICK 1:** 'Use AI' column.
- **CLICK 2:** 'Prefer simpler' column.
- **SOURCE:** Synthesis of the method papers' stated use cases (Topaz: few labels; crYOLO: general model, on-the-fly; TomoTwin: no retraining, ≥~150 kDa).
- **ESSENTIAL QUALIFICATION:** This is my synthesis, not a published decision tree.
- **OPTIONAL DEEPER EXPLANATION:** A practical pattern: pick broadly with a general model, clean with 2D classification, then retrain Topaz on the clean set and re-pick to recover rare views.
- **LIKELY QUESTION:** Isn't template matching biased too?
- **SUGGESTED ANSWER:** Yes — it finds what looks like the template ('Einstein from noise'). Learned pickers trade template bias for training-set bias. Either way, validate with independent half maps.

## S14 · Limitations, artifacts and safeguards

- **TARGET TIME:** 65 s (12:55–14:00)
- **WORD COUNT:** 155
- **SCRIPT:** What can go wrong? I group the failures into five categories.

First, data shift: a new microscope, detector, ice thickness, or particle size may differ from the training data. Second, label problems: annotations are incomplete and subjective, while true particles are rare relative to background. Third, physical limitations: small particles, overlap, contamination, preferred orientation, and the tomographic missing wedge can all cause silent failures. Fourth, model behaviour: scores may be overconfident, results depend on thresholds, and enhancement can erase or exaggerate density. Finally, evaluation bias: test data may overlap with training sources, or developers may benchmark their own tools under favourable conditions.

The safeguards should match those risks: test on held-out micrographs and genuinely different datasets; inspect raw data and class averages; examine orientation distributions and local resolution; preserve untouched half-maps; compare more than one method; and validate structural claims with biochemical or functional evidence whenever possible.

No single metric can certify the entire pipeline.
- **CLICK 1:** Failure modes, grouped: data, labels, physics, model, evaluation.
- **CLICK 2:** Missing-wedge simulation inset (x–z slice).
- **CLICK 3:** Safeguards column, each paired with the failure it addresses.
- **SOURCE:** Iqbal et al. 2026 (generalization, compute cost, model bias); Dhakal et al. 2025 (dataset scarcity, generalization, benchmarking); TomoTwin (size limit, 10 Å/px); presenter's missing-wedge simulation.
- **ESSENTIAL QUALIFICATION:** No single safeguard is sufficient; the list is ordered roughly by cost.
- **OPTIONAL DEEPER EXPLANATION:** Data leakage example: if test micrographs come from the same EMPIAR entry as training micrographs, a picker can memorise ice texture and particle size, inflating F1 without generalising.
- **LIKELY QUESTION:** How would you detect a hallucinated density?
- **SUGGESTED ANSWER:** Check it in the unfiltered half maps and in the unsharpened average; check its local resolution; see if it persists with a different post-processing method; and ask whether it is chemically plausible and supported biochemically.

## S15 · Take-home decision framework

- **TARGET TIME:** 40 s (14:00–14:40)
- **WORD COUNT:** 107
- **SCRIPT:** I want to leave you with three points.

First, AI is most useful when it reduces repetitive inference while leaving the experimental evidence available for inspection.

Second, cleaner does not necessarily mean more accurate. More particles, prettier density, and higher confidence can all mislead us.

Third, validation must match the biological claim. For every AI step, we should be able to name an independent check that could reveal its failure.

The goal is not the most picks or the prettiest map. It is to recover structural information without losing track of uncertainty—and to distinguish what is supported by the data from what is suggested by the model.
- **CLICK 1:** Conclusion 1.
- **CLICK 2:** Conclusion 2.
- **CLICK 3:** Conclusion 3.
- **CLICK 4:** Final line.
- **SOURCE:** Synthesis of slides 7–14.
- **ESSENTIAL QUALIFICATION:** These are principles, not rules; context decides.
- **OPTIONAL DEEPER EXPLANATION:** A useful habit: for every AI step in a pipeline, write down which independent check would catch its failure.
- **LIKELY QUESTION:** Will AI eventually replace the processing expert?
- **SUGGESTED ANSWER:** It already replaces much repetitive clicking. What it cannot replace is the judgement about whether a result answers the biological question — that requires independent evidence.

## S16 · References and questions

- **TARGET TIME:** 20 s (14:40–15:00)
- **WORD COUNT:** 45
- **SCRIPT:** These are the main reviews, datasets, and primary papers behind the talk. All of the examples shown here use public cryo-EM or cryo-ET data, and the full bibliography, analysis details, and data provenance are included with the presentation.

Thank you. I’m happy to take questions.
- **CLICK 1:** Open the expandable full bibliography if asked (button, bottom right).
- **SOURCE:** references.bib
- **ESSENTIAL QUALIFICATION:** —
- **OPTIONAL DEEPER EXPLANATION:** —
- **LIKELY QUESTION:** Where can I get the code and data you used?
- **SUGGESTED ANSWER:** All public: EMPIAR-10017, EMPIAR-10204 and EMD-72202; Topaz and DeepEMhancer are open source; the scripts are in production/data-pipeline.
