# AI in cryo-EM and cryo-ET data processing — full transcript

Ditsa Mallick · BCH 561 · Arizona State University · 27 October 2026

Central question: *Where does deep learning add trustworthy structural information — and how can we tell whether an apparent improvement is real?*

## S01 · Title and central question  
*0:00–0:30 · 30 s · 64 words*

This is a real cryo-EM image of beta-galactosidase. Can you see the proteins? Filtered, they start to emerge. Now look at the outlines: a neural network and an expert agree on most particles, but not all. So my question today is: where does deep learning add trustworthy structural information to cryo-EM and cryo-ET, and how can we tell whether an apparent improvement is real?

## S02 · Why AI-assisted processing matters  
*0:30–1:15 · 45 s · 107 words*

Why automate at all? Three reasons. First, the signal is tiny: radiation damage limits the electron dose, so every particle sits in noise. Second, scale: by January 2025 the public archive EMPIAR held 1,879 datasets, about 4.8 petabytes, and one dataset in today's case study produced over four hundred thousand picks. Third, people are slow and inconsistent: in the micrograph you just saw, an expert marked roughly five hundred particles per image, by hand. But speed is not the goal. A wrong pick, a bad drift estimate or an over-sharpened map does not stay local. It propagates downstream, into the structure and into the biology we claim.

## S03 · What cryo-EM and cryo-ET reveal  
*1:15–2:05 · 50 s · 104 words*

There are two branches. Single-particle analysis images many copies of a purified complex, each frozen in a random orientation. We pick two-dimensional particle images and average them, often to near-atomic resolution. Cryo-electron tomography instead tilts one region, often a thin slice of a cell, through about plus or minus sixty degrees, and reconstructs a three-dimensional tomogram. We pick three-dimensional subvolumes and average those, usually at lower resolution, but in their native context. So single-particle work asks: what is the atomic mechanism of this purified complex? Tomography asks: where is it, what is it bound to, and what state is it in, inside the cell?

## S04 · Fundamental image-formation principle  
*2:05–3:15 · 70 s · 143 words*

Here is the physics in one line. V is the three-dimensional density of the molecule. Each particle sits in an unknown orientation, phi-i, and the microscope records its projection, P: a two-dimensional shadow summed along the beam. The optics do not pass every spatial frequency equally. The contrast transfer function, the CTF, multiplies the image's Fourier transform by an oscillating curve set by defocus, so some details flip contrast and some vanish at the zeros. Then comes noise, n-i: at a safe dose the noise is larger than the signal. The rescue is averaging. Averaging N aligned copies raises signal-to-noise roughly N-fold, and projections from many directions fill three-dimensional Fourier space, the central-slice theorem, so the map emerges. In this simulation of beta-galactosidase, thirty views give a blur and thirty thousand give the structure. Every tool today attacks one unknown in this equation.

## S05 · What the raw data look like  
*3:15–4:05 · 50 s · 110 words*

What do the data actually look like? The measurement is a movie: dozens of very low-dose frames. Here are forty-nine frames from a public beta-galactosidase dataset, about one point three electrons per square ångström each. Summing aligned frames gives the micrograph. In tomography the measurement is a tilt series, and the tomogram is computed from it. Everything after that is inference: the particle coordinates, the extracted boxes, the two-dimensional class averages, the density map. Keep that line in mind, measured on the left, inferred on the right, because every AI tool today lives on the inferred side. Even a two-dimensional class average is already the product of many computational decisions.

## S06 · End-to-end workflow  
*4:05–5:15 · 70 s · 134 words*

Here is the full workflow, branched. Single particle: movies, motion correction, CTF estimation, particle picking, extraction, two- and three-dimensional classification, refinement, map sharpening or denoising, then model building. Tomography adds tilt-series alignment and tomogram reconstruction before subtomogram picking and averaging. The small indicator at the top of each slide tracks where we are. Deep learning has now entered almost every box, but not equally: some steps are still pure physics and optimization. Two of my sources sit downstream of picking. CryoAI uses a neural encoder to predict each particle's orientation directly and reconstructs from scratch, reported as about an order of magnitude faster on large datasets. Cryo2StructData supplies 7,600 labelled density maps to train networks that build atomic models. Today I stay upstream: motion, picking and enhancement, because that is where errors are born.

## S07 · Motion correction  
*5:15–6:05 · 50 s · 102 words*

Step one is motion. The beam makes the ice move, and the stage drifts. In this real movie the whole frame drifted about twenty-one ångströms during the exposure, roughly ten times the detail we want to see. Summing frames without alignment blurs the image; look at the Thon rings in the power spectrum, the fingerprint of the CTF. Aligning frames by cross-correlation sharpens them. Local patches then correct uneven motion, but small patches carry little signal, and this corner's estimate is probably noise. Dose weighting down-weights late, damaged frames. And note: MotionCor2, RELION and cryoSPARC do this by optimization, not deep learning.

## S08 · Particle picking as an inference problem  
*6:05–6:55 · 50 s · 103 words*

Picking sounds like object detection, but it is inference under uncertainty. Contrast is low, ice and carbon look like particles, particles touch and aggregate, and some views are rare. Even the ground truth is a human judgement, so every pick is a hypothesis, not an observation. On this real micrograph I ran Topaz and compared it with the expert's picks. Cyan, solid: both agree. Amber, dashed: the model picked and the expert did not. Is that a false positive, or a missed label? White, dotted: the expert picked and the model missed. And all of it depends on a threshold that somebody chose.

## S09 · Topaz, crYOLO and TomoTwin  
*6:55–8:15 · 80 s · 176 words*

Three tools, three learning ideas. Topaz uses positive-unlabeled learning. You label a few particles, and everything else is unlabeled, not negative, because the background still hides particles. A convolutional network, a stack of learned filters that slide across the image, is trained with a constraint on the expected fraction of particles, and it outputs a score map that you threshold into coordinates. crYOLO is supervised detection based on YOLO, 'you only look once': one pass predicts boxes with confidences. It is fast, up to five micrographs per second, and ships a general model trained on more than forty datasets, but it depends on representative training boxes. TomoTwin works in tomograms. It uses metric learning: a 3D network turns every subvolume into a thirty-two number fingerprint, an embedding, so that copies of the same protein land close together and different proteins land far apart. You pick by similarity to one example, without retraining. It was trained on simulated tomograms of about a hundred and twenty proteins, and the authors expect a lower size limit near 150 kilodaltons.

## S10 · How to interpret picker output  
*8:15–9:30 · 75 s · 147 words*

So how do we read picker output? Precision is the fraction of picks that are real. Recall is the fraction of real particles found. F1 combines the two. Here is the real curve for Topaz against the expert picks across twelve micrographs. Lower the threshold and recall rises, precision falls, and the pick count balloons from under three thousand to over twelve thousand. The best F1, zero point eight two, comes at about eight thousand picks. But these metrics assume the labels are complete. When I classified the so-called false positives, several classes look like genuine beta-galactosidase views, particles the expert skipped; others are overlapping neighbours. So judge picks downstream: clean 2D classes, coverage of viewing directions, rare views kept, then the gold-standard Fourier shell correlation between two independently refined half maps, read where it drops below 0.143, plus local resolution. More particles are not automatically better.

## S11 · DeepEMhancer and map enhancement  
*9:30–10:30 · 60 s · 122 words*

Downstream, map enhancement. Sharpening boosts damped high frequencies; denoising suppresses noise; neither adds a new measurement. DeepEMhancer is a 3D convolutional network trained on pairs of experimental maps and maps sharpened using their atomic models. Given the two half maps, it returns a map that looks masked and sharpened in one step. On this beta-two adrenergic receptor dimer it is cleaner than conventional sharpening. But the independent evidence is unchanged: our half-map FSC is about two point six ångströms. Now lower the contour. The conventional maps show the lipid nanodisc around the receptors; DeepEMhancer erased it. That density was real, just not protein. So interpret against the half maps, compare methods, and never validate a model against a map enhanced by models.

## S12 · Literature case study: six pickers, same data  
*10:30–11:45 · 75 s · 147 words*

Now the case study. Dhakal and colleagues ran six deep-learning pickers on the same four EMPIAR datasets, at two scales: about three hundred micrographs from the CryoPPP subset, and every micrograph in the full entry. Each pick set went through the same cryoSPARC reconstruction; the best of three seeds is reported. First, the counts differ hugely: on the full data, Topaz averaged about two hundred and seven thousand picks, CryoSegNet about one hundred and six thousand. Then resolution, averaged over four proteins: CryoSegNet 3.28 ångströms, Topaz 3.46, Deep Picker 4.75. So Topaz picked twice as many particles yet did slightly worse. On hemagglutinin, CryoTransformer picked two hundred and sixty thousand particles and CryoSegNet ninety thousand, for the same 3.2 ångströms. And there is no universal winner: on the ion-channel dataset, Topaz was best, although the paper's text credits CryoTransformer. The authors link failures to missing particle orientations.

## S13 · When these tools are useful  
*11:45–12:30 · 45 s · 91 words*

So when should you reach for these tools? Large single-particle datasets with few annotations: that is Topaz's sweet spot. Rapid screening during collection, where a general model like crYOLO's gives a useful first pass in minutes. Low-contrast, small or irregular particles, where templates bias you toward what you expect. Crowded tomograms and searches for known or related complexes: TomoTwin. And reproducible, high-throughput pipelines. Simpler methods win when particles are large and obvious, when you need a strictly unbiased search, or when your data look nothing like anything in the training set.

## S14 · Limitations, artifacts and safeguards  
*12:30–13:50 · 80 s · 141 words*

What can go wrong? Domain shift: a model trained on one microscope, detector, ice or particle size meets something new. Labels are incomplete and subjective, and particles are rare compared with background. Small particles, overlaps, contamination, rare conformations and preferred orientation are where pickers fail silently. In tomography, the missing wedge elongates densities and confuses similarity, as this simulation shows. Scores are often overconfident, thresholds shift results, and enhancers can over-sharpen, invent or erase density. Benchmarks can leak when training and test proteins overlap, and authors often benchmark their own tools. So, the safeguards: test on held-out and different datasets; look at raw micrographs and 2D classes; check orientation distributions and local resolution; keep independent half maps away from the network; compare at least two methods; validate biochemically, with mutations, ligands or functional assays; and report uncertainty instead of hiding it.

## S15 · Take-home decision framework  
*13:50–14:35 · 45 s · 85 words*

Three things to take home. One: AI is most valuable when it removes repetitive inference, such as picking and triage, while preserving the experimental evidence. Two: a visually cleaner result is not automatically a more accurate one; more picks, prettier maps and higher confidence can all mislead. Three: validate every AI output at the level of your biological question. The goal is not to maximize picks or make the prettiest map. It is to preserve structural information, and to know when the model is uncertain.

## S16 · References and questions  
*14:35–15:00 · 25 s · 51 words*

These are the key sources: the reviews and datasets I built on, and the primary papers for each tool. The full bibliography, the claim ledger and the data provenance come with the deck, and I can open any data panel again if it helps. Thank you. I'm happy to take questions.

---
Total: 1827 words, 15:00 scheduled (≈13.1 min of speech at 140 wpm).
