// Writes backup/cue-sheet.md: the full spoken script split at every key press (→ / Space),
// with the scheduled clock time of each press. Times are word-proportional within each slide's
// target_seconds; the clock starts at the micrograph (slide 1, press 3), after the opening pre-roll.
// CUES give, per slide, the phrase at which each click is pressed (arrival on the slide is press 0).
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const story = yaml.load(readFileSync(path.join(root, "src/data/story.yaml"), "utf8"));
const CUES = {
  s01: [null, null, "Let me start", "Once I apply", "The cyan outlines", "That disagreement leads"],
  s02: ["Why automate", "Radiation damages", "But speed alone"],
  s03: ["Before discussing", "Cryo-electron tomography is different", "So single-particle analysis usually"],
  s04: ["This equation summarizes", "The microscope records", "The contrast transfer function", "Finally, we add noise", "The rescue is averaging", "Projections from many orientations"],
  s05: ["It is useful", "The detector records", "Particle coordinates, extracted", "This is not a perfectly"],
  s06: ["Here is the complete", "For single-particle analysis", "Tomography adds", "Deep learning now appears"],
  s07: ["First, motion", "In this real movie", "If we simply sum", "Local or patch-based", "The key point"],
  s08: ["Particle picking looks", "The two methods agreed", "Topaz selected another", "while the expert had", "Also, Topaz produces"],
  s09: ["These three pickers", "Topaz uses", "crYOLO treats", "TomoTwin operates", "However, generalization"],
  s10: ["How should we evaluate", "Here is the precision", "In this comparison, threshold two", "But the more revealing", "So coordinate-level"],
  s11: ["Next is map enhancement", "An unsharpened reconstruction", "Global B-factor sharpening", "DeepEMhancer is a three", "But easier to interpret", "Now look at the low"],
  s12: ["A published comparison", "Dhakal and colleagues", "The methods produced", "yet CryoSegNet achieved", "For hemagglutinin", "The benchmark also has", "The right conclusion"],
  s13: ["So when are", "Topaz is valuable", "Simpler methods may"],
  s14: ["What can go wrong", "First, data shift", "Third, physical limitations", "The safeguards should"],
  s15: ["I want to leave", "First, AI is most", "Second, cleaner", "Third, validation", "The goal is not"],
  s16: ["These are the main"],
};
const mmss = (s) => { const r = Math.round(s); return `${Math.floor(r / 60)}:${String(r % 60).padStart(2, "0")}`; };
const nwords = (t) => t.trim().split(/\s+/).filter(Boolean).length;

const out = [`# Cue sheet — ${story.meta.title}\n`,
  `Every row is one press of **→ (or Space)**; **←** goes back one step. "Clock" is where you should be on the`,
  `speaker-view timer when you press. Row 0 is how the deck opens (no press). Start the timer at press 2 (the micrograph). Total 15:00; take-home ends 14:40.\n`];
let t = 0, press = -1, errors = 0;  // the deck opens on state 0; every later state is one press
for (const s of story.slides) {
  const text = s.script.replace(/\s+/g, " ").trim();
  const cues = CUES[s.id];
  if (!cues || cues.length !== s.clicks.length + 1 - (s.id === "s16" ? 1 : 0)) { console.error(`${s.id}: expected ${s.clicks.length + 1} cues`); errors++; continue; }
  const idx = cues.map((c) => (c === null ? null : text.indexOf(c)));
  idx.forEach((i, k) => { if (i === -1) { console.error(`${s.id}: cue "${cues[k]}" not in script`); errors++; } });
  out.push(`\n## Slide ${Number(s.id.slice(1))} · ${s.title}  (${mmss(t)}–${mmss(t + s.target_seconds)}, ${s.target_seconds} s)\n`);
  const total = nwords(text), start = t;
  idx.forEach((i, k) => {
    press++;
    const what = k === 0 ? (s.id === "s01" ? "Deck opens: dark first frame of the opening" : "Arrive on slide") : s.clicks[k - 1].replace(/\s*\(.*?\)\s*$/, "");
    if (i === null) { out.push(`**${press}. [pre-roll] — ${what}**\n`); return; }
    const end = idx.slice(k + 1).find((j) => j !== null) ?? text.length;
    const seg = text.slice(i, end).trim(), before = nwords(text.slice(0, i));
    out.push(`**${press}. [${mmss(start + (before / total) * s.target_seconds)}] — ${what}**  \n${seg}\n`);
  });
  t += s.target_seconds;
  if (s.id === "s16") out.push(`*(Only if asked: click "Full bibliography", bottom right — not a scheduled press.)*\n`);
}
out.push(`\n---\nEnd ${mmss(t)} · ${press} presses (press 1 is the silent opening; the timed talk starts at press 2).\n`);
if (errors) process.exit(1);
writeFileSync(path.join(root, "backup/cue-sheet.md"), out.join("\n"));
console.log(`wrote backup/cue-sheet.md (${press} presses)`);
