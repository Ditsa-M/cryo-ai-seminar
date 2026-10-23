# Speaker notes — AI in cryo-EM and cryo-ET data processing

## S01 · Title and central question

- **TARGET TIME:** 30 s (0:00–0:30)
- **WORD COUNT:** 64
- **SCRIPT:** This is a real cryo-EM image of beta-galactosidase. Can you see the proteins? Filtered, they start to emerge. Now look at the outlines: a neural network and an expert agree on most particles, but not all. So my question today is: where does deep learning add trustworthy structural information to cryo-EM and cryo-ET, and how can we tell whether an apparent improvement is real?
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

- **TARGET TIME:** 45 s (0:30–1:15)
- **WORD COUNT:** 107
- **SCRIPT:** Why automate at all? Three reasons. First, the signal is tiny: radiation damage limits the electron dose, so every particle sits in noise. Second, scale: by January 2025 the public archive EMPIAR held 1,879 datasets, about 4.8 petabytes, and one dataset in today's case study produced over four hundred thousand picks. Third, people are slow and inconsistent: in the micrograph you just saw, an expert marked roughly five hundred particles per image, by hand. But speed is not the goal. A wrong pick, a bad drift estimate or an over-sharpened map does not stay local. It propagates downstream, into the structure and into the biology we claim.
- **CLICK 1:** Three numbers appear: dose, archive size, picks per dataset.
- **CLICK 2:** Pipeline strip appears; an error marker at 'pick' propagates to 'interpret'.
- **SOURCE:** Iqbal et al. 2026 (EMPIAR: 1,879 entries, 4.83 PB as of 14 Jan 2025); Dhakal et al. 2025 Table 3 (Topaz, EMPIAR-10093 full: 437,235 picks); EMPIAR-10017 metadata (24 e⁻/Å²); presenter count of 6,829 expert coordinates in 12 micrographs.
- **ESSENTIAL QUALIFICATION:** Archive size is a review's snapshot; it grows continuously. The 400,000 picks are one tool on one dataset, not typical of every project.
- **OPTIONAL DEEPER EXPLANATION:** Dose is limited because high-energy electrons break bonds; at ~20–60 e⁻/Å² high-resolution features are already being destroyed, so you cannot simply 'expose longer'.
- **LIKELY QUESTION:** Isn't manual picking still the gold standard?
- **SUGGESTED ANSWER:** It is a useful reference but not ground truth: humans miss particles, are inconsistent between sessions, and favour obvious views. Our own comparison later shows the expert skipped real particles.

## S03 · What cryo-EM and cryo-ET reveal

- **TARGET TIME:** 50 s (1:15–2:05)
- **WORD COUNT:** 104
- **SCRIPT:** There are two branches. Single-particle analysis images many copies of a purified complex, each frozen in a random orientation. We pick two-dimensional particle images and average them, often to near-atomic resolution. Cryo-electron tomography instead tilts one region, often a thin slice of a cell, through about plus or minus sixty degrees, and reconstructs a three-dimensional tomogram. We pick three-dimensional subvolumes and average those, usually at lower resolution, but in their native context. So single-particle work asks: what is the atomic mechanism of this purified complex? Tomography asks: where is it, what is it bound to, and what state is it in, inside the cell?
- **CLICK 1:** Right panel (tomography) slides in.
- **CLICK 2:** Question boxes appear under each panel.
- **SOURCE:** Iqbal et al. 2026 (SPA vs in situ ET); TomoTwin (Rice et al. 2023) for tomogram picking context.
- **ESSENTIAL QUALIFICATION:** ±60° is typical, not universal; dose-symmetric schemes and specimen thickness change the usable range.
- **OPTIONAL DEEPER EXPLANATION:** Subtomogram averaging can reach sub-4 Å for abundant, rigid complexes such as ribosomes in situ, but most cellular targets are far lower resolution.
- **LIKELY QUESTION:** Why not just tilt to ±90°?
- **SUGGESTED ANSWER:** The holder and the grid bars block the beam, and a slab-shaped specimen gets effectively thicker with tilt (path length ∝ 1/cos θ). Beyond ~60–70° there is almost no usable signal.

## S04 · Fundamental image-formation principle

- **TARGET TIME:** 70 s (2:05–3:15)
- **WORD COUNT:** 143
- **SCRIPT:** Here is the physics in one line. V is the three-dimensional density of the molecule. Each particle sits in an unknown orientation, phi-i, and the microscope records its projection, P: a two-dimensional shadow summed along the beam. The optics do not pass every spatial frequency equally. The contrast transfer function, the CTF, multiplies the image's Fourier transform by an oscillating curve set by defocus, so some details flip contrast and some vanish at the zeros. Then comes noise, n-i: at a safe dose the noise is larger than the signal. The rescue is averaging. Averaging N aligned copies raises signal-to-noise roughly N-fold, and projections from many directions fill three-dimensional Fourier space, the central-slice theorem, so the map emerges. In this simulation of beta-galactosidase, thirty views give a blur and thirty thousand give the structure. Every tool today attacks one unknown in this equation.
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

- **TARGET TIME:** 50 s (3:15–4:05)
- **WORD COUNT:** 110
- **SCRIPT:** What do the data actually look like? The measurement is a movie: dozens of very low-dose frames. Here are forty-nine frames from a public beta-galactosidase dataset, about one point three electrons per square ångström each. Summing aligned frames gives the micrograph. In tomography the measurement is a tilt series, and the tomogram is computed from it. Everything after that is inference: the particle coordinates, the extracted boxes, the two-dimensional class averages, the density map. Keep that line in mind, measured on the left, inferred on the right, because every AI tool today lives on the inferred side. Even a two-dimensional class average is already the product of many computational decisions.
- **CLICK 1:** Measured row: single frame, aligned sum, tilt series (simulated).
- **CLICK 2:** Inferred row: coordinates, extracted boxes, 2D classes, density map.
- **CLICK 3:** Dividing line labelled 'measured | inferred'.
- **SOURCE:** EMPIAR-10204; RELION-3 tutorial dose (1.277 e⁻/Å² per frame) for this dataset; EMPIAR-10017; EMD-72202.
- **ESSENTIAL QUALIFICATION:** Even the 'measured' micrograph is already processed (gain correction, alignment). The line is a gradient, not a wall.
- **OPTIONAL DEEPER EXPLANATION:** Direct electron detectors made movies possible: by counting individual electrons at high frame rates they let us correct motion after the fact (Li et al. 2013).
- **LIKELY QUESTION:** Why record a movie instead of one long exposure?
- **SUGGESTED ANSWER:** Because the specimen moves during exposure. Fractionating the dose lets you measure and undo motion, and weight early (less damaged) frames more heavily at high resolution.

## S06 · End-to-end workflow

- **TARGET TIME:** 70 s (4:05–5:15)
- **WORD COUNT:** 134
- **SCRIPT:** Here is the full workflow, branched. Single particle: movies, motion correction, CTF estimation, particle picking, extraction, two- and three-dimensional classification, refinement, map sharpening or denoising, then model building. Tomography adds tilt-series alignment and tomogram reconstruction before subtomogram picking and averaging. The small indicator at the top of each slide tracks where we are. Deep learning has now entered almost every box, but not equally: some steps are still pure physics and optimization. Two of my sources sit downstream of picking. CryoAI uses a neural encoder to predict each particle's orientation directly and reconstructs from scratch, reported as about an order of magnitude faster on large datasets. Cryo2StructData supplies 7,600 labelled density maps to train networks that build atomic models. Today I stay upstream: motion, picking and enhancement, because that is where errors are born.
- **CLICK 1:** SPA branch draws left to right.
- **CLICK 2:** Cryo-ET branch splits off at reconstruction.
- **CLICK 3:** Violet tags mark stages where DL tools exist; CryoAI and Cryo2StructData tags highlighted.
- **SOURCE:** Iqbal et al. 2026; Levy et al. 2022 ('one order of magnitude faster for large datasets'); Giri et al. 2024 ('7,600 preprocessed cryo-EM density maps').
- **ESSENTIAL QUALIFICATION:** CryoAI's speed-up is for homogeneous reconstruction on large datasets, compared with the solvers the authors tested; it does not handle heterogeneity.
- **OPTIONAL DEEPER EXPLANATION:** Amortized inference: instead of searching all orientations for every image (like RELION's expectation–maximization), CryoAI trains one encoder that maps any image to a pose, so the cost per image falls as the dataset grows.
- **LIKELY QUESTION:** Is motion correction or CTF estimation done by deep learning?
- **SUGGESTED ANSWER:** Not in the standard tools. MotionCor2, RELION and cryoSPARC patch motion use optimization; CTFFIND and Gctf fit a physical model. I found no widely used deep-learning motion-correction method.

## S07 · Motion correction

- **TARGET TIME:** 50 s (5:15–6:05)
- **WORD COUNT:** 102
- **SCRIPT:** Step one is motion. The beam makes the ice move, and the stage drifts. In this real movie the whole frame drifted about twenty-one ångströms during the exposure, roughly ten times the detail we want to see. Summing frames without alignment blurs the image; look at the Thon rings in the power spectrum, the fingerprint of the CTF. Aligning frames by cross-correlation sharpens them. Local patches then correct uneven motion, but small patches carry little signal, and this corner's estimate is probably noise. Dose weighting down-weights late, damaged frames. And note: MotionCor2, RELION and cryoSPARC do this by optimization, not deep learning.
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

- **TARGET TIME:** 50 s (6:05–6:55)
- **WORD COUNT:** 103
- **SCRIPT:** Picking sounds like object detection, but it is inference under uncertainty. Contrast is low, ice and carbon look like particles, particles touch and aggregate, and some views are rare. Even the ground truth is a human judgement, so every pick is a hypothesis, not an observation. On this real micrograph I ran Topaz and compared it with the expert's picks. Cyan, solid: both agree. Amber, dashed: the model picked and the expert did not. Is that a false positive, or a missed label? White, dotted: the expert picked and the model missed. And all of it depends on a threshold that somebody chose.
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

- **TARGET TIME:** 80 s (6:55–8:15)
- **WORD COUNT:** 176
- **SCRIPT:** Three tools, three learning ideas. Topaz uses positive-unlabeled learning. You label a few particles, and everything else is unlabeled, not negative, because the background still hides particles. A convolutional network, a stack of learned filters that slide across the image, is trained with a constraint on the expected fraction of particles, and it outputs a score map that you threshold into coordinates. crYOLO is supervised detection based on YOLO, 'you only look once': one pass predicts boxes with confidences. It is fast, up to five micrographs per second, and ships a general model trained on more than forty datasets, but it depends on representative training boxes. TomoTwin works in tomograms. It uses metric learning: a 3D network turns every subvolume into a thirty-two number fingerprint, an embedding, so that copies of the same protein land close together and different proteins land far apart. You pick by similarity to one example, without retraining. It was trained on simulated tomograms of about a hundred and twenty proteins, and the authors expect a lower size limit near 150 kilodaltons.
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

- **TARGET TIME:** 75 s (8:15–9:30)
- **WORD COUNT:** 147
- **SCRIPT:** So how do we read picker output? Precision is the fraction of picks that are real. Recall is the fraction of real particles found. F1 combines the two. Here is the real curve for Topaz against the expert picks across twelve micrographs. Lower the threshold and recall rises, precision falls, and the pick count balloons from under three thousand to over twelve thousand. The best F1, zero point eight two, comes at about eight thousand picks. But these metrics assume the labels are complete. When I classified the so-called false positives, several classes look like genuine beta-galactosidase views, particles the expert skipped; others are overlapping neighbours. So judge picks downstream: clean 2D classes, coverage of viewing directions, rare views kept, then the gold-standard Fourier shell correlation between two independently refined half maps, read where it drops below 0.143, plus local resolution. More particles are not automatically better.
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

- **TARGET TIME:** 60 s (9:30–10:30)
- **WORD COUNT:** 122
- **SCRIPT:** Downstream, map enhancement. Sharpening boosts damped high frequencies; denoising suppresses noise; neither adds a new measurement. DeepEMhancer is a 3D convolutional network trained on pairs of experimental maps and maps sharpened using their atomic models. Given the two half maps, it returns a map that looks masked and sharpened in one step. On this beta-two adrenergic receptor dimer it is cleaner than conventional sharpening. But the independent evidence is unchanged: our half-map FSC is about two point six ångströms. Now lower the contour. The conventional maps show the lipid nanodisc around the receptors; DeepEMhancer erased it. That density was real, just not protein. So interpret against the half maps, compare methods, and never validate a model against a map enhanced by models.
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

- **TARGET TIME:** 75 s (10:30–11:45)
- **WORD COUNT:** 147
- **SCRIPT:** Now the case study. Dhakal and colleagues ran six deep-learning pickers on the same four EMPIAR datasets, at two scales: about three hundred micrographs from the CryoPPP subset, and every micrograph in the full entry. Each pick set went through the same cryoSPARC reconstruction; the best of three seeds is reported. First, the counts differ hugely: on the full data, Topaz averaged about two hundred and seven thousand picks, CryoSegNet about one hundred and six thousand. Then resolution, averaged over four proteins: CryoSegNet 3.28 ångströms, Topaz 3.46, Deep Picker 4.75. So Topaz picked twice as many particles yet did slightly worse. On hemagglutinin, CryoTransformer picked two hundred and sixty thousand particles and CryoSegNet ninety thousand, for the same 3.2 ångströms. And there is no universal winner: on the ion-channel dataset, Topaz was best, although the paper's text credits CryoTransformer. The authors link failures to missing particle orientations.
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

- **TARGET TIME:** 45 s (11:45–12:30)
- **WORD COUNT:** 91
- **SCRIPT:** So when should you reach for these tools? Large single-particle datasets with few annotations: that is Topaz's sweet spot. Rapid screening during collection, where a general model like crYOLO's gives a useful first pass in minutes. Low-contrast, small or irregular particles, where templates bias you toward what you expect. Crowded tomograms and searches for known or related complexes: TomoTwin. And reproducible, high-throughput pipelines. Simpler methods win when particles are large and obvious, when you need a strictly unbiased search, or when your data look nothing like anything in the training set.
- **CLICK 1:** 'Use AI' column.
- **CLICK 2:** 'Prefer simpler' column.
- **SOURCE:** Synthesis of the method papers' stated use cases (Topaz: few labels; crYOLO: general model, on-the-fly; TomoTwin: no retraining, ≥~150 kDa).
- **ESSENTIAL QUALIFICATION:** This is my synthesis, not a published decision tree.
- **OPTIONAL DEEPER EXPLANATION:** A practical pattern: pick broadly with a general model, clean with 2D classification, then retrain Topaz on the clean set and re-pick to recover rare views.
- **LIKELY QUESTION:** Isn't template matching biased too?
- **SUGGESTED ANSWER:** Yes — it finds what looks like the template ('Einstein from noise'). Learned pickers trade template bias for training-set bias. Either way, validate with independent half maps.

## S14 · Limitations, artifacts and safeguards

- **TARGET TIME:** 80 s (12:30–13:50)
- **WORD COUNT:** 141
- **SCRIPT:** What can go wrong? Domain shift: a model trained on one microscope, detector, ice or particle size meets something new. Labels are incomplete and subjective, and particles are rare compared with background. Small particles, overlaps, contamination, rare conformations and preferred orientation are where pickers fail silently. In tomography, the missing wedge elongates densities and confuses similarity, as this simulation shows. Scores are often overconfident, thresholds shift results, and enhancers can over-sharpen, invent or erase density. Benchmarks can leak when training and test proteins overlap, and authors often benchmark their own tools. So, the safeguards: test on held-out and different datasets; look at raw micrographs and 2D classes; check orientation distributions and local resolution; keep independent half maps away from the network; compare at least two methods; validate biochemically, with mutations, ligands or functional assays; and report uncertainty instead of hiding it.
- **CLICK 1:** Failure modes, grouped: data, labels, physics, model, evaluation.
- **CLICK 2:** Missing-wedge simulation inset (x–z slice).
- **CLICK 3:** Safeguards column, each paired with the failure it addresses.
- **SOURCE:** Iqbal et al. 2026 (generalization, compute cost, model bias); Dhakal et al. 2025 (dataset scarcity, generalization, benchmarking); TomoTwin (size limit, 10 Å/px); presenter's missing-wedge simulation.
- **ESSENTIAL QUALIFICATION:** No single safeguard is sufficient; the list is ordered roughly by cost.
- **OPTIONAL DEEPER EXPLANATION:** Data leakage example: if test micrographs come from the same EMPIAR entry as training micrographs, a picker can memorise ice texture and particle size, inflating F1 without generalising.
- **LIKELY QUESTION:** How would you detect a hallucinated density?
- **SUGGESTED ANSWER:** Check it in the unfiltered half maps and in the unsharpened average; check its local resolution; see if it persists with a different post-processing method; and ask whether it is chemically plausible and supported biochemically.

## S15 · Take-home decision framework

- **TARGET TIME:** 45 s (13:50–14:35)
- **WORD COUNT:** 85
- **SCRIPT:** Three things to take home. One: AI is most valuable when it removes repetitive inference, such as picking and triage, while preserving the experimental evidence. Two: a visually cleaner result is not automatically a more accurate one; more picks, prettier maps and higher confidence can all mislead. Three: validate every AI output at the level of your biological question. The goal is not to maximize picks or make the prettiest map. It is to preserve structural information, and to know when the model is uncertain.
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

- **TARGET TIME:** 25 s (14:35–15:00)
- **WORD COUNT:** 51
- **SCRIPT:** These are the key sources: the reviews and datasets I built on, and the primary papers for each tool. The full bibliography, the claim ledger and the data provenance come with the deck, and I can open any data panel again if it helps. Thank you. I'm happy to take questions.
- **CLICK 1:** Open the expandable full bibliography if asked (button, bottom right).
- **SOURCE:** references.bib
- **ESSENTIAL QUALIFICATION:** —
- **OPTIONAL DEEPER EXPLANATION:** —
- **LIKELY QUESTION:** Where can I get the code and data you used?
- **SUGGESTED ANSWER:** All public: EMPIAR-10017, EMPIAR-10204 and EMD-72202; Topaz and DeepEMhancer are open source; the scripts are in production/data-pipeline.
