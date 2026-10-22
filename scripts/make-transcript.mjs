// Writes backup/transcript.md (full spoken script with timing) and backup/speaker-notes.md (everything in the notes).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const story = yaml.load(readFileSync(path.join(root, "src/data/story.yaml"), "utf8"));
const w = (t) => t.trim().split(/\s+/).length, mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
let t = 0, tr = [`# ${story.meta.title} — full transcript\n\n${story.meta.presenter} · ${story.meta.course} · ${story.meta.date}\n\nCentral question: *${story.meta.subtitle}*\n`];
let notes = [`# Speaker notes — ${story.meta.title}\n`];
for (const s of story.slides) {
  const start = t; t += s.target_seconds;
  tr.push(`\n## ${s.id.toUpperCase()} · ${s.title}  \n*${mmss(start)}–${mmss(t)} · ${s.target_seconds} s · ${w(s.script)} words*\n\n${s.script.trim()}\n`);
  notes.push(`\n## ${s.id.toUpperCase()} · ${s.title}\n\n- **TARGET TIME:** ${s.target_seconds} s (${mmss(start)}–${mmss(t)})\n- **WORD COUNT:** ${w(s.script)}\n- **SCRIPT:** ${s.script.trim()}\n` +
    s.clicks.map((c, i) => `- **CLICK ${i + 1}:** ${c}`).join("\n") +
    `\n- **SOURCE:** ${s.source}\n- **ESSENTIAL QUALIFICATION:** ${s.qualification}\n- **OPTIONAL DEEPER EXPLANATION:** ${s.deeper}\n- **LIKELY QUESTION:** ${s.question}\n- **SUGGESTED ANSWER:** ${s.answer}\n`);
}
const total = story.slides.reduce((a, s) => a + w(s.script), 0);
tr.push(`\n---\nTotal: ${total} words, ${mmss(t)} scheduled (≈${(total / 140).toFixed(1)} min of speech at 140 wpm).\n`);
mkdirSync(path.join(root, "backup"), { recursive: true });
writeFileSync(path.join(root, "backup/transcript.md"), tr.join(""));
writeFileSync(path.join(root, "backup/speaker-notes.md"), notes.join(""));
console.log("wrote backup/transcript.md and backup/speaker-notes.md");
