// QA gate: exits 1 (and so fails `npm run build`) on any scientific or timing error.
// Checks: 16 slides, per-slide timing/notes fields, total ≈ 900 s, take-home ends ≈ 14:40,
// word range, citation strip on evidence slides, claim ledger integrity (every claim has a
// bibliography source, reported claims have a locator), provenance for every shipped asset,
// video fallbacks (WebM + MP4 + poster), and no generative imagery in the manifest.
import { readFileSync, existsSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const story = yaml.load(readFileSync(path.join(root, "src/data/story.yaml"), "utf8"));
const claims = yaml.load(readFileSync(path.join(root, "src/data/claims.yaml"), "utf8")).claims;
const bib = JSON.parse(readFileSync(path.join(root, "src/data/bibliography.json"), "utf8"));
const prov = JSON.parse(readFileSync(path.join(root, "provenance/assets.json"), "utf8"));
const errors = [], warnings = [], info = [];
const err = (m) => errors.push(m), warn = (m) => warnings.push(m);

const slides = story.slides;
if (slides.length !== 16) err(`expected 16 slides, found ${slides.length}`);
const words = (t) => t.trim().split(/\s+/).filter(Boolean).length;
const REQ = ["target_seconds", "script", "clicks", "source", "qualification", "deeper", "question", "answer"];
let t = 0, totalWords = 0, takeHomeEnd = 0;
const bibKeys = new Set(bib.map((b) => b.key));
const claimIds = new Set(claims.map((c) => c.id));
for (const s of slides) {
  for (const f of REQ) if (s[f] === undefined || s[f] === "" || (Array.isArray(s[f]) && !s[f].length)) err(`${s.id}: missing ${f}`);
  if (!(s.target_seconds > 0)) err(`${s.id}: no target duration`);
  t += s.target_seconds; totalWords += words(s.script);
  if (s.id === "s15") takeHomeEnd = t;
  if (s.evidence && !s.citation) err(`${s.id}: evidence slide without citation strip`);
  for (const c of s.claims ?? []) if (!claimIds.has(c)) err(`${s.id}: references unknown claim ${c}`);
  const wpm = words(s.script) / s.target_seconds * 60;
  if (wpm > 170) err(`${s.id}: ${wpm.toFixed(0)} wpm exceeds 170`);
  info.push(`${s.id}  ${String(s.target_seconds).padStart(3)} s  ${String(words(s.script)).padStart(4)} w  ${wpm.toFixed(0).padStart(3)} wpm  ends ${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}  ${s.title}`);
}
if (Math.abs(t - 900) > 15) err(`total target time ${t} s is not ≈ 900 s`);
if (takeHomeEnd < 860 || takeHomeEnd > 885) err(`take-home ends at ${takeHomeEnd} s, expected ≈ 880 s (14:40)`);
if (totalWords < 1800 || totalWords > 2450) err(`script has ${totalWords} words; target 1,800–2,450 (presenter speaks fast, ~150 wpm)`);
for (const c of claims) {
  if (!c.source) err(`claim ${c.id}: no source`);
  else if (!bibKeys.has(c.source)) err(`claim ${c.id}: source '${c.source}' not in bibliography.json`);
  if (c.type === "reported" && !c.locator) err(`claim ${c.id}: reported claim without page/table/section locator`);
  if (!slides.find((s) => s.id === c.slide)) err(`claim ${c.id}: unknown slide ${c.slide}`);
  if (c.status === "flagged") warn(`claim ${c.id} is flagged: ${c.note ?? ""}`);
}
// every slide-referenced claim must appear in the slide that lists it, and quantitative slides must list claims
for (const s of slides) if (s.evidence && s.labels?.some((l) => l !== "CONCEPTUAL SCHEMATIC") && !(s.claims ?? []).length && s.id !== "s16") err(`${s.id}: evidence slide lists no claims`);

// provenance: every shipped scientific file listed; every entry exists; no generative assets
const shipped = [];
for (const d of ["figures", "video", "posters"]) {
  const dir = path.join(root, "public", d);
  if (existsSync(dir)) for (const f of readdirSync(dir)) if (!f.endsWith(".json")) shipped.push(`${d}/${f}`);
}
const listed = new Set(prov.assets.map((a) => a.file));
for (const f of shipped) if (!listed.has(f)) err(`asset without provenance: ${f}`);
for (const a of prov.assets) {
  if (!existsSync(path.join(root, "public", a.file))) err(`provenance entry points at missing file: ${a.file}`);
  if (!["experimental", "recomputed", "reported", "simulation", "schematic"].includes(a.kind)) err(`${a.file}: invalid kind '${a.kind}' (generative imagery is not allowed)`);
  if (!a.software || !a.code) err(`${a.file}: provenance lacks software/code`);
  if (a.kind === "simulation" && a.random_seed == null && !/turntable|loop/i.test(a.description)) warn(`${a.file}: simulation without seed`);
}
// videos referenced in source must have webm + mp4 + poster
const src = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? src(path.join(d, e.name)) : [path.join(d, e.name)]);
const code = src(path.join(root, "src")).filter((f) => /\.tsx?$/.test(f)).map((f) => readFileSync(f, "utf8")).join("\n");
for (const m of code.matchAll(/<Video name="([^"]+)"/g)) {
  for (const f of [`video/${m[1]}.webm`, `video/${m[1]}.mp4`, `posters/${m[1]}.webp`]) if (!existsSync(path.join(root, "public", f))) err(`video '${m[1]}' lacks ${f}`);
}
for (const m of code.matchAll(/figures\/([\w-]+)\.webp/g)) if (!existsSync(path.join(root, "public/figures", `${m[1]}.webp`))) err(`missing figure ${m[1]}.webp`);
for (const m of code.matchAll(/figures\/s11_\$\{m\.k\}_(\w+)\.webp/g)) for (const k of ["unsharpened", "globalB", "deepemhancer"]) if (!existsSync(path.join(root, `public/figures/s11_${k}_${m[1]}.webp`))) err(`missing s11_${k}_${m[1]}.webp`);
// runtime internet: no absolute http(s) resource URLs in source (text-only DOIs/URLs in bibliography are allowed)
for (const m of code.matchAll(/(src|href)=\{?["'`](https?:\/\/[^"'`]+)/g)) err(`external resource in source: ${m[2]}`);

const report = [
  `QA ${new Date().toISOString()}`,
  ...info,
  `PRE-ROLL ${slides.reduce((a, s) => a + (s.preroll_seconds ?? 0), 0)} s (opening scene, outside the timed talk)`,
  `TOTAL ${t} s (${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}), take-home ends ${Math.floor(takeHomeEnd / 60)}:${String(takeHomeEnd % 60).padStart(2, "0")}, ${totalWords} words (${(totalWords / 150).toFixed(1)} min at 150 wpm)`,
  `${claims.length} claims, ${bib.length} bibliography records, ${prov.assets.length} provenance records, ${shipped.length} shipped assets`,
  ...warnings.map((w) => "WARN  " + w),
  ...errors.map((e) => "ERROR " + e),
  errors.length ? `FAILED with ${errors.length} error(s)` : "PASSED",
].join("\n");
writeFileSync(path.join(root, "provenance/qa-last-run.txt"), report + "\n");
console.log(report);
process.exit(errors.length ? 1 : 0);
