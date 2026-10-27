// Where the presenter's hand points, per slide and click state: index 0 = arrival on the slide,
// index k = after click k (same order as `clicks` in story.yaml, so length = clicks + 1).
// Each entry is a list of targets visited in a loop while that state is shown. A target is a
// data-hand name in the slide ("$..." = a raw CSS selector inside the slide); every match is
// visited. "@fx,fy" puts the fingertip at that fraction of the element's box (default 0.5,1 =
// middle of the bottom edge). An empty list hides the hand.
export const HAND: Record<string, string[][]> = {
  s01: [[], [], ["mic@0.5,0.55"], ["mic@0.3,0.35", "mic@0.7,0.65"], ["leg"], ["question"]],
  s02: [["$h2@0.3,1"], ["gun@0.5,0.9", "sample@0.5,0.6", "det@0.5,0.7", "dose-opt@0.5,0.5"], ["num@0.2,0.6"], ["pipe@0.5,0.8", "pipe@0.95,0.8"]],
  s03: [["spa@0.5,0.9", "$thead th:nth-child(2)"], ["tomo@0.5,0.9", "$thead th:nth-child(3)"], ["q"]],
  s04: [["$.eq@0.5,0.9", "vid@0.5,0.9"], ["row0"], ["ctf@0.5,0.6", "row1"], ["row2"], ["row3"], ["row4"]],
  s05: [["$h2@0.3,1"], ["meas@0.5,0.8"], ["inf@0.5,0.8"], ["divider"]],
  s06: [["$h2@0.3,1"], ["spa-focus"], ["et-focus"], ["dl@0.3,0.9"]],
  s07: [["$h2@0.3,1"], ["vid@0.5,0.9"], ["traj@0.6,0.6", "psd@0.5,0.9", "thon@0.6,0.5"], ["outlier@0.5,0.5"], ["$.callout@0.6,1"]],
  s08: [["$li:last-child@0.3,1"], ["leg-matched", "mic@0.45,0.45"], ["leg-model_only"], ["leg-expert_only"], ["$.callout@0.5,1"]],
  s09: [["$h2@0.3,1"], ["topaz@0.5,0.9"], ["yolo@0.5,0.9"], ["tomotwin@0.5,0.9"], ["$tbody tr:last-child@0.5,1"]],
  s10: [["$h2@0.3,1"], ["thr@0.3,1"], ["best@0.5,0.5"], ["cls"], ["$.callout@0.5,1"]],
  s11: [["$h2@0.3,1"], ["map-unsharpened@0.5,0.85"], ["map-globalB@0.5,0.85"], ["map-deepemhancer@0.5,0.85"], ["fsc@0.835,0.66", "$.callout@0.5,1"], ["map-unsharpened@0.5,0.85", "map-deepemhancer@0.5,0.85"]],
  s12: [["$h2@0.3,1"], ["$svg[aria-label^='Average particle']@0.135,0.45"], ["bar-Topaz@1,0.6", "bar-CryoSegNet@1,0.6"], ["res-Topaz@0.5,0.7", "res-CryoSegNet@0.5,0.7"], ["c1@0.5,1"], ["c2@0.5,1"], ["c3@0.5,1"]],
  s13: [["$h2@0.3,1"], ["use"], ["simple"]],
  s14: [["$h2@0.3,1"], ["fail@0.4,0.9"], ["wedge@0.5,0.9"], ["safe@0.4,0.9"]],
  s15: [["$h2@0.5,1"], ["th0@0.3,1"], ["th1@0.3,1"], ["th2@0.3,1"], ["goal@0.4,1"]],
  s16: [["email@0.5,1"], ["email@0.5,1"]],
};

// Per click state ("slide:index"): "once" visits each target once, then rests still on the last;
// "still" sits on the target without chomping. Unlisted states loop.
export const HAND_MODE: Record<string, "once" | "still"> = {
  "s08:0": "once",     // last bullet, briefly
  "s12:3": "once",     // Topaz, then rest on CryoSegNet
  "s16:0": "still",    // Q&A: no motion
  "s16:1": "still",
};

// Short pop-up shown beside the pointer for NOTE_MS when that click state starts.
export const HAND_NOTE: Record<string, string> = {
  "s01:2": "EMPIAR = Electron Microscopy Public Image Archive (EMBL-EBI): a free public archive of raw cryo-EM and cryo-ET images. Entry 10017: β-galactosidase micrographs with expert particle picks.",
};
