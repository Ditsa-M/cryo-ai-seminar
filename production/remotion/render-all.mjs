// Renders the deterministic Remotion clips, then encodes WebM/VP9 + MP4/H.264 + WebP poster for every
// deck video (including the ChimeraX turntable). Usage: node production/remotion/render-all.mjs
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import path from "node:path";

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, "../..");
const out = path.join(root, "public/video"), posters = path.join(root, "public/posters");
mkdirSync(out, { recursive: true }); mkdirSync(posters, { recursive: true });
const chrome = process.env.CHROME ?? "/usr/bin/google-chrome";

import { copyFileSync } from "node:fs";
copyFileSync(path.join(root, "production/chimerax/opening_raw.mp4"), path.join(here, "public/opening_raw.mp4"));
const serveUrl = await bundle({ entryPoint: path.join(here, "src/index.ts"), publicDir: path.join(here, "public") });
const masters = {};
for (const id of ["motion-align", "tomo-scan", "opening"]) {
  const composition = await selectComposition({ serveUrl, id, browserExecutable: chrome });
  const master = path.join(here, "out", `${id}.master.mp4`);
  mkdirSync(path.dirname(master), { recursive: true });
  await renderMedia({ composition, serveUrl, codec: "h264", crf: 12, outputLocation: master, muted: true, browserExecutable: chrome });
  masters[id] = master;
  console.log("rendered", id);
}
masters["bgal-spin"] = path.join(root, "production/chimerax/bgal-spin_raw.mp4");

// poster: final frame for 'once' clips (the held state), first frame for loops
const kinds = { "motion-align": "once", "tomo-scan": "loop", "bgal-spin": "loop", opening: "once" };
const ff = (args) => execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { stdio: "inherit" });
for (const [id, src] of Object.entries(masters)) {
  if (!existsSync(src)) throw new Error(`missing master ${src}`);
  ff(["-i", src, "-an", "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "32", "-row-mt", "1", "-pix_fmt", "yuv420p", path.join(out, `${id}.webm`)]);
  ff(["-i", src, "-an", "-c:v", "libx264", "-crf", "20", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", path.join(out, `${id}.mp4`)]);
  const seek = kinds[id] === "once" ? ["-sseof", "-0.1"] : ["-ss", "0"];
  ff([...seek, "-i", src, "-frames:v", "1", "-c:v", "libwebp", "-quality", "88", path.join(posters, `${id}.webp`)]);
  if (kinds[id] === "once") ff(["-ss", "0", "-i", src, "-frames:v", "1", "-c:v", "libwebp", "-quality", "88", path.join(posters, `${id}-start.webp`)]);
  console.log("encoded", id);
}
