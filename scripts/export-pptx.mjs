// PowerPoint copy: one PowerPoint slide per click state of the production build (1920×1080 screenshots,
// fade between them, so → steps through exactly like the web deck). The real clips are embedded where
// they play (auto-start; loops loop); a finished once-clip shows its final frame. Speaker notes carry
// the script segment for each press from backup/cue-sheet.md. -> backup/deck.pptx
// Usage: npm run build && node scripts/make-cue-sheet.mjs && node scripts/export-pptx.mjs
import { chromium } from "playwright-core";
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import yaml from "js-yaml";
import { startPreview } from "./serve.mjs";

const require = createRequire(import.meta.url);
const PptxGenJS = require("pptxgenjs");
const JSZip = require("jszip");
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const tmp = path.join(root, "production/pptx");
if (existsSync(tmp)) rmSync(tmp, { recursive: true });
mkdirSync(tmp, { recursive: true });
const story = yaml.load(readFileSync(path.join(root, "src/data/story.yaml"), "utf8"));
const IN = (px) => px / 144;   // 1920 px = 13.333 in

// cue sheet rows, grouped by slide: [{ clock, what, say }]
const cues = {};
let cur = null;
for (const block of readFileSync(path.join(root, "backup/cue-sheet.md"), "utf8").split(/\n(?=## Slide |\*\*\d+\. )/)) {
  const sl = block.match(/^## Slide (\d+)/);
  if (sl) { cur = cues[`s${sl[1].padStart(2, "0")}`] = []; continue; }
  const row = block.match(/^\*\*\d+\. \[(.*?)\] — (.*?)\*\*\s*\n?([\s\S]*)$/);
  if (row && cur) cur.push({ clock: row[1], what: row[2], say: row[3].replace(/\n\n## [\s\S]*$/, "").replace(/\*\(Only if asked[\s\S]*$/, "").replace(/\n---[\s\S]*$/, "").trim() });
}

// image of a poster (webp) as PNG data for PowerPoint
const png = (name) => {
  const out = path.join(tmp, `${name}.png`);
  if (!existsSync(out)) execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", path.join(root, `public/posters/${name}.webp`), out]);
  return out;
};

const srv = await startPreview(root, Number(process.env.PPTX_PORT ?? 4196));
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? "/usr/bin/google-chrome" });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(srv.url, { waitUntil: "networkidle" });
await page.waitForFunction(() => window.__deck && window.__deck.isReady());
await page.addStyleTag({ content: ".reveal .controls, .reveal .progress { display: none !important; } video { visibility: hidden !important; }" });

const states = [];
for (let h = 0; h < 16; h++) {
  const s = story.slides[h], n = s.clicks.length, played = new Set();
  const last = s.id === "s16" ? 0 : n;   // slide 16's one click changes nothing on screen
  for (let f = -1; f < last; f++) {
    await page.evaluate(([h, f]) => window.__deck.slide(h, 0, f), [h, f]);
    await page.waitForTimeout(1100);   // CSS transitions + pointer glide
    const img = path.join(tmp, `${s.id}_${String(f + 1).padStart(2, "0")}.jpg`);
    await page.screenshot({ path: img, type: "jpeg", quality: 92 });
    const vids = await page.evaluate(() => [...window.__deck.getCurrentSlide().querySelectorAll("video")].map((v) => {
      const r = v.getBoundingClientRect(), name = v.querySelector("source").getAttribute("src").split("/").pop().replace(".webm", "");
      return { name, x: r.left, y: r.top, w: r.width, h: r.height, loop: v.loop, playing: !v.paused, visible: parseFloat(getComputedStyle(v.closest(".stepfade") ?? v).opacity) > 0.5 };
    }));
    const media = [];
    for (const v of vids.filter((v) => v.visible)) {
      if (v.loop || (v.playing && !played.has(v.name))) { media.push({ ...v, kind: "video" }); played.add(v.name); }
      else media.push({ ...v, kind: "image", poster: played.has(v.name) ? v.name : `${v.name}-start` });
    }
    states.push({ id: s.id, k: f + 1, n: last + 1, img, media, cue: cues[s.id]?.[f + 1] });
  }
  console.log(`${s.id}: ${last + 1} states`);
}
await browser.close(); srv.stop();

const pres = new PptxGenJS();
pres.layout = "LAYOUT_WIDE";
pres.title = story.meta.title;
pres.author = story.meta.presenter;
const videoSlides = new Map();   // slide number -> [{ loop }]
states.forEach((st, i) => {
  const s = story.slides.find((x) => x.id === st.id);
  const slide = pres.addSlide();
  slide.background = { color: "0B141C" };
  slide.addImage({ path: st.img, x: 0, y: 0, w: 13.333, h: 7.5, altText: `${s.title} (click ${st.k} of ${st.n - 1})` });
  for (const m of st.media) {
    const box = { x: IN(m.x), y: IN(m.y), w: IN(m.w), h: IN(m.h) };
    if (m.kind === "image") slide.addImage({ path: png(m.poster), ...box, altText: m.name });
    else {
      slide.addMedia({ type: "video", path: path.join(root, `public/video/${m.name}.mp4`), ...box,
        cover: "data:image/png;base64," + readFileSync(png(m.loop ? m.name : `${m.name}-start`)).toString("base64") });
      (videoSlides.get(i + 1) ?? videoSlides.set(i + 1, []).get(i + 1)).push({ loop: m.loop });
    }
  }
  const head = `SLIDE ${Number(st.id.slice(1))} · ${st.k === 0 ? "arrival" : `click ${st.k} of ${st.n - 1}`}${st.cue ? ` · press at ${st.cue.clock}` : ""}`;
  const parts = [head];
  if (st.cue) parts.push(`ON SCREEN: ${st.cue.what}`, st.cue.say ? `SAY: ${st.cue.say}` : "");
  if (st.k === 0) parts.push(`LIKELY QUESTION: ${s.question}`, `SUGGESTED ANSWER: ${s.answer}`);
  slide.addNotes(parts.filter(Boolean).join("\n\n"));
});
const out = path.join(root, "backup/deck.pptx");
await pres.writeFile({ fileName: out });

// post-process: fade transition on every slide; embedded clips start automatically (loops repeat)
const zip = await JSZip.loadAsync(readFileSync(out));
const timing = (vids) => {
  let id = 3;
  const calls = vids.map((v, j) => `<p:par><p:cTn id="${id++}" presetID="1" presetClass="mediacall" presetSubtype="0" fill="hold" nodeType="${j ? "withEffect" : "afterEffect"}"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst><p:cmd type="call" cmd="playFrom(0.0)"><p:cBhvr><p:cTn id="${id++}" dur="1" fill="hold"/><p:tgtEl><p:spTgt spid="${v.spid}"/></p:tgtEl></p:cBhvr></p:cmd></p:childTnLst></p:cTn></p:par>`).join("");
  const nodes = vids.map((v) => `<p:video><p:cMediaNode vol="0" mute="1"><p:cTn id="${id++}"${v.loop ? ' repeatCount="indefinite"' : ""} fill="hold" display="0"><p:stCondLst><p:cond delay="indefinite"/></p:stCondLst></p:cTn><p:tgtEl><p:spTgt spid="${v.spid}"/></p:tgtEl></p:cMediaNode></p:video>`).join("");
  return `<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>` +
    `<p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>` +
    `<p:par><p:cTn id="${id++}" fill="hold"><p:stCondLst><p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond></p:stCondLst><p:childTnLst>` +
    `<p:par><p:cTn id="${id++}" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>${calls}</p:childTnLst></p:cTn></p:par>` +
    `</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn>` +
    `<p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst><p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq>` +
    `${nodes}</p:childTnLst></p:cTn></p:par></p:tnLst></p:timing>`;
};
for (let i = 1; i <= states.length; i++) {
  const f = `ppt/slides/slide${i}.xml`;
  let xml = await zip.file(f).async("string");
  let tail = '<p:transition spd="med"><p:fade/></p:transition>';
  const vids = videoSlides.get(i);
  if (vids) {
    const ids = [...xml.matchAll(/<p:pic>\s*<p:nvPicPr>\s*<p:cNvPr id="(\d+)"[^>]*>(?:(?!<\/p:pic>)[\s\S])*?<a:videoFile/g)].map((m) => m[1]);
    if (ids.length !== vids.length) throw new Error(`slide ${i}: ${ids.length} video shapes, expected ${vids.length}`);
    tail += timing(vids.map((v, j) => ({ ...v, spid: ids[j] })));
  }
  xml = xml.replace(/(<\/p:clrMapOvr>)/, `$1${tail}`);
  if (!xml.includes("<p:transition")) xml = xml.replace("</p:sld>", `${tail}</p:sld>`);
  zip.file(f, xml);
}
writeFileSync(out, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
console.log(`wrote ${out}: ${states.length} slides, ${[...videoSlides.values()].flat().length} embedded clips`);
