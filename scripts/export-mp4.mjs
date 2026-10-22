// MP4 backup: screenshots every click state of the production build at 1920×1080, gives each state
// an equal share of its slide's target time from story.yaml (total 15:00), and assembles a silent
// H.264 video in Remotion with the real clips overlaid. -> backup/deck-backup.mp4 (+ poster)
import { chromium } from "playwright-core";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { mkdirSync, readFileSync, copyFileSync, existsSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import yaml from "js-yaml";
import { startPreview } from "./serve.mjs";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const rem = path.join(root, "production/remotion");
const shots = path.join(rem, "public/backup");
if (existsSync(shots)) rmSync(shots, { recursive: true });
mkdirSync(shots, { recursive: true }); mkdirSync(path.join(root, "backup"), { recursive: true });
for (const f of ["motion-align", "tomo-scan", "bgal-spin"]) {
  copyFileSync(path.join(root, `public/video/${f}.mp4`), path.join(shots, `${f}.mp4`));
  copyFileSync(path.join(root, `public/posters/${f}.webp`), path.join(shots, `${f}.webp`));
}
const story = yaml.load(readFileSync(path.join(root, "src/data/story.yaml"), "utf8"));
const FPS = 30, CLIP = { "motion-align": 300, "tomo-scan": 240, "bgal-spin": 360 };
const srv = await startPreview(root, 4175);
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? "/usr/bin/google-chrome" });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(srv.url, { waitUntil: "networkidle" });
await page.waitForFunction(() => window.__deck && window.__deck.isReady());
await page.addStyleTag({ content: ".reveal .controls, .reveal .progress { display: none !important; } video { visibility: hidden !important; }" });
const segments = [], overlays = [];
let frame = 0;
for (let h = 0; h < 16; h++) {
  const s = story.slides[h], states = s.clicks.length + 1;
  const total = Math.round(s.target_seconds * FPS);
  const per = Array.from({ length: states }, (_, i) => Math.floor(total / states) + (i < total % states ? 1 : 0));
  const slideStart = frame; const seen = new Map();
  for (let f = -1; f < s.clicks.length; f++) {
    await page.evaluate(([h, f]) => window.__deck.slide(h, 0, f), [h, f]);
    await page.waitForTimeout(1100);   // let CSS transitions finish
    const img = `backup/${s.id}_${String(f + 1).padStart(2, "0")}.png`;
    await page.screenshot({ path: path.join(rem, "public", img) });
    const vids = await page.evaluate(() => [...window.__deck.getCurrentSlide().querySelectorAll("video")].map((v) => {
      const r = v.getBoundingClientRect(); const name = v.querySelector("source").getAttribute("src").split("/").pop().replace(".webm", "");
      return { name, x: r.left, y: r.top, w: r.width, h: r.height, loop: v.loop, visible: parseFloat(getComputedStyle(v.closest(".stepfade") ?? v).opacity) > 0.5 };
    }));
    for (const v of vids) if (v.visible && !seen.has(v.name)) seen.set(v.name, { ...v, from: frame });
    segments.push({ img, frames: per[f + 1] });
    frame += per[f + 1];
  }
  for (const [name, v] of seen) overlays.push({ src: `backup/${name}.mp4`, poster: `backup/${name}.webp`, from: v.from, frames: frame - v.from, clipFrames: CLIP[name],
    x: Math.round(v.x), y: Math.round(v.y), w: Math.round(v.w), h: Math.round(v.h), loop: v.loop });
  console.log(`${s.id}: ${states} states, ${((frame - slideStart) / FPS).toFixed(1)} s, overlays ${[...seen.keys()].join(",") || "-"}`);
}
await browser.close(); srv.stop();
const serveUrl = await bundle({ entryPoint: path.join(rem, "src/index.ts"), publicDir: path.join(rem, "public") });
const inputProps = { segments, overlays };
const chrome = process.env.CHROME ?? "/usr/bin/google-chrome";
const composition = await selectComposition({ serveUrl, id: "deck-backup", inputProps, browserExecutable: chrome });
const out = path.join(root, "backup/deck-backup.mp4");
await renderMedia({ composition, serveUrl, codec: "h264", crf: 20, outputLocation: out, inputProps, muted: true, browserExecutable: chrome, concurrency: +(process.env.MP4_CONCURRENCY ?? 4),
  onProgress: ({ progress }) => { if (Math.round(progress * 100) % 10 === 0) process.stdout.write(`\r${Math.round(progress * 100)}%`); } });
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", "1", "-i", out, "-frames:v", "1", path.join(root, "backup/deck-backup-poster.webp")]);
console.log(`\nwrote ${out} (${(frame / FPS).toFixed(1)} s)`);
