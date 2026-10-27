// End-to-end tests against the production build (vite preview), in headless Chrome with every
// non-localhost request blocked (= offline). Writes tests/test-report.json.
// Usage: npm run build && npm test     (CHROME=/path/to/chrome to override the browser)
import { chromium } from "playwright-core";
import { spawn, execFileSync } from "node:child_process";
import { writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const CHROME = process.env.CHROME ?? "/usr/bin/google-chrome";
const PORT = Number(process.env.TEST_PORT ?? 4173), URL0 = `http://localhost:${PORT}/`;
const results = [];
const check = (name, ok, detail = "") => { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`); };

const server = spawn(path.join(root, "node_modules/.bin/vite"), ["preview", "--port", String(PORT), "--strictPort"], { cwd: root, stdio: "pipe" });
await new Promise((res) => { server.stdout.on("data", (d) => /Local/.test(d) && res()); setTimeout(res, 8000); });

const browser = await chromium.launch({ executablePath: CHROME, args: ["--autoplay-policy=no-user-gesture-required"] });
async function openDeck(viewport, opts = {}) {
  const ctx = await browser.newContext({ viewport, reducedMotion: opts.reduced ? "reduce" : "no-preference" });
  const external = [], failed = [], consoleErrors = [];
  await ctx.route("**/*", (route) => {
    const u = new URL(route.request().url());
    if (["localhost", "127.0.0.1"].includes(u.hostname) || u.protocol === "data:" || u.protocol === "blob:") return route.continue();
    external.push(u.href); return route.abort();
  });
  const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
  page.on("pageerror", (e) => consoleErrors.push(String(e)));
  page.on("response", (r) => r.status() >= 400 && failed.push(`${r.status()} ${r.url()}`));
  await page.goto(URL0 + (opts.query ?? ""), { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__deck && window.__deck.isReady());
  return { ctx, page, external, failed, consoleErrors };
}
const idx = (page) => page.evaluate(() => window.__deck.getIndices());

// ---- 1920x1080: structure, navigation, notes, offline ----
{
  const { ctx, page, external, failed, consoleErrors } = await openDeck({ width: 1920, height: 1080 });
  const n = await page.evaluate(() => window.__deck.getTotalSlides());
  check("16 slides", n === 16, `found ${n}`);
  const notes = await page.$$eval("section[data-notes]", (a) => a.map((x) => x.getAttribute("data-notes")));
  const fields = ["TARGET TIME", "WORD COUNT", "SCRIPT", "CLICK 1", "SOURCE", "ESSENTIAL QUALIFICATION", "OPTIONAL DEEPER EXPLANATION", "LIKELY QUESTION", "SUGGESTED ANSWER"];
  check("speaker notes on all slides with all fields", notes.length === 16 && notes.every((t) => fields.every((f) => t.includes(f))), `${notes.length} notes`);
  const timings = await page.$$eval("section[data-timing]", (s) => s.map((x) => +x.dataset.timing));
  check("data-timing on every slide, sums to 900 s", timings.length === 16 && timings.reduce((a, b) => a + b, 0) === 900, `sum ${timings.reduce((a, b) => a + b, 0)}`);
  // no automatic advance
  const before = await idx(page); await page.waitForTimeout(6000); const after = await idx(page);
  check("no automatic slide advancement (6 s idle)", JSON.stringify(before) === JSON.stringify(after));
  // keyboard: ArrowRight/space step through every fragment of every slide to the end
  let steps = 0, last = await idx(page);
  for (let i = 0; i < 200; i++) {
    await page.keyboard.press(i % 2 ? "Space" : "ArrowRight"); await page.waitForTimeout(60);
    const cur = await idx(page); if (JSON.stringify(cur) === JSON.stringify(last)) break; last = cur; steps++;
  }
  const end = await idx(page);
  check("keyboard (arrow/space) reaches final slide", end.h === 15, `${steps} presses, ended at ${end.h}`);
  for (let i = 0; i < 2; i++) { await page.keyboard.press("ArrowLeft"); await page.waitForTimeout(100); }
  check("ArrowLeft goes back (fragment, then slide)", (await idx(page)).h === 14);
  // layout: nothing overflows the 1920x1080 slide in its final state
  const overflow = await page.evaluate(async () => {
    const d = window.__deck, bad = [];
    for (let h = 0; h < 16; h++) {
      d.slide(h, 0, 99); await new Promise((r) => setTimeout(r, 250));
      const sec = d.getCurrentSlide(), sb = sec.getBoundingClientRect(), scale = d.getScale();
      for (const el of sec.querySelectorAll("img, svg, video, table, p, h2, li, .card, .callout")) {
        const r = el.getBoundingClientRect(); if (!r.width) continue;
        const bottom = (r.bottom - sb.top) / scale, right = (r.right - sb.left) / scale;
        if (bottom > 1082 || right > 1922) bad.push(`${sec.dataset.storyId}:${el.tagName.toLowerCase()} ${Math.round(right)}x${Math.round(bottom)}`);
      }
    }
    return bad;
  });
  check("no element overflows the 1920×1080 slide", overflow.length === 0, overflow.slice(0, 6).join("; "));
  // pointing hand: on screen, inside the slide, in every click state except the silent opening (slide 1, states 0-1)
  const handMiss = await page.evaluate(async () => {
    const d = window.__deck, bad = [];
    for (let h = 0; h < 16; h++) {
      const n = d.getSlides()[h].querySelectorAll(".fragment").length;
      for (let f = -1; f < n; f++) {
        if (h === 0 && f < 1) continue;
        d.slide(h, 0, f); await new Promise((r) => setTimeout(r, 200));
        const e = d.getCurrentSlide().querySelector(".hand"), x = parseFloat(e?.style.left), y = parseFloat(e?.style.top);
        if (e?.dataset.handOn !== "1" || !(x >= 0 && x <= 1856 && y >= 0 && y <= 988)) bad.push(`s${h + 1}.${f + 1}`);
      }
    }
    return bad;
  });
  check("pointing hand shown in every click state", handMiss.length === 0, handMiss.join(", "));
  const citeOk = await page.evaluate(() => [...document.querySelectorAll("section .cite")].every((c) => parseFloat(getComputedStyle(c).fontSize) >= 18));
  check("citation strips ≥18 px at slide scale", citeOk);
  const evid = await page.$$eval("section", (s) => s.filter((x) => x.querySelector(".cite")).length);
  check("citation strip present on evidence slides", evid === 15, `${evid} slides with strip`);
  // video: scientific clip plays only on its click, holds last frame, resets when going back, replays
  const vid = await page.evaluate(async () => {
    const d = window.__deck; d.slide(6, 0, -1); await new Promise((r) => setTimeout(r, 700));
    const v = d.getCurrentSlide().querySelector("video"); const r = { pausedBefore: v.paused };
    d.next(); await new Promise((res) => setTimeout(res, 1500)); r.playingAfterClick = !v.paused && v.currentTime > 0.5;
    await new Promise((res) => { if (v.ended) res(); else v.addEventListener("ended", res, { once: true }); setTimeout(res, 12000); });
    r.heldAtEnd = v.ended && v.paused && v.currentTime > 9; d.prev(); await new Promise((res) => setTimeout(res, 400));
    r.resetOnBack = v.paused && v.currentTime === 0; d.next(); await new Promise((res) => setTimeout(res, 1200)); r.replays = !v.paused && v.currentTime > 0.3;
    d.slide(7, 0, 0); await new Promise((res) => setTimeout(res, 500)); r.pausedOffSlide = v.paused;
    // decorative loop on s04: plays only while current
    d.slide(3, 0, 0); await new Promise((res) => setTimeout(res, 1200)); const lv = d.getCurrentSlide().querySelector("video");
    r.loopPlays = !lv.paused && lv.loop && lv.muted; d.slide(4, 0, 0); await new Promise((res) => setTimeout(res, 400)); r.loopPausedOff = lv.paused;
    r.allMuted = [...document.querySelectorAll("video")].every((x) => x.muted && x.querySelectorAll("source").length === 2 && x.poster);
    return r;
  });
  check("scientific video: paused until click", vid.pausedBefore); check("scientific video: plays on click", vid.playingAfterClick);
  check("scientific video: plays once and holds final frame", vid.heldAtEnd); check("scientific video: resets when presenter goes back", vid.resetOnBack);
  check("scientific video: replayable", vid.replays); check("videos pause when slide inactive", vid.pausedOffSlide && vid.loopPausedOff);
  check("decorative loop plays muted on its slide", vid.loopPlays); check("all videos muted with WebM+MP4 sources and poster", vid.allMuted);
  // animation replay: D3 threshold marker on s10 follows the fragment state both ways
  const anim = await page.evaluate(async () => {
    const d = window.__deck, txt = () => d.getCurrentSlide().querySelector("[data-testid=thr-label]")?.textContent;
    d.slide(9, 0, 0); await new Promise((r) => setTimeout(r, 300)); const a = txt();
    d.slide(9, 0, 1); await new Promise((r) => setTimeout(r, 300)); const b = txt();
    d.slide(9, 0, 0); await new Promise((r) => setTimeout(r, 300)); const c = txt();
    return { a, b, c };
  });
  check("fragment-driven animation reverses and replays", anim.a && anim.b && anim.a !== anim.b && anim.a === anim.c, JSON.stringify(anim));
  // speaker view
  await page.evaluate(() => window.__deck.slide(2, 0, 0));
  const [popup] = await Promise.all([page.waitForEvent("popup"), page.keyboard.press("s")]);
  await popup.waitForTimeout(3000);
  await page.evaluate(() => window.__deck.next()); await popup.waitForTimeout(2500);
  const sv = await popup.evaluate(() => ({
    current: !!document.querySelector("#current-slide iframe"), upcoming: !!document.querySelector("#upcoming-slide iframe"),
    timer: !!document.querySelector(".speaker-controls-time .timer"), pacing: getComputedStyle(document.querySelector(".pacing")).display !== "none",
    notes: (document.querySelector(".speaker-controls-notes .value")?.textContent ?? "").slice(0, 60),
  }));
  check("speaker view: current + next slide, timer, pacing, notes", sv.current && sv.upcoming && sv.timer && sv.pacing && /TARGET TIME/.test(sv.notes), JSON.stringify(sv));
  await popup.close();
  check("offline: no non-local requests", external.length === 0, external.slice(0, 3).join(", "));
  check("no missing files (HTTP ≥400)", failed.length === 0, failed.slice(0, 3).join(", "));
  check("no console errors", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));
  await ctx.close();
}
// ---- 1366x768 and reduced motion ----
{
  const { ctx, page, consoleErrors } = await openDeck({ width: 1366, height: 768 });
  const sc = await page.evaluate(() => window.__deck.getScale());
  const minCite = await page.evaluate(() => Math.min(...[...document.querySelectorAll("section .cite")].map((c) => c.getBoundingClientRect().height ? parseFloat(getComputedStyle(c).fontSize) * window.__deck.getScale() : 99)));
  check("1366×768 renders scaled deck", sc > 0.6 && sc < 0.75, `scale ${sc.toFixed(3)}`);
  check("1366×768 citation text ≥ 12 px on screen", minCite >= 12, `${minCite.toFixed(1)} px`);
  check("1366×768 no console errors", consoleErrors.length === 0);
  await ctx.close();
}
{
  const { ctx, page } = await openDeck({ width: 1920, height: 1080 }, { reduced: true });
  const r = await page.evaluate(async () => { window.__deck.slide(6, 0, 0); await new Promise((x) => setTimeout(x, 500)); return { videos: document.querySelectorAll("video").length, posters: document.querySelectorAll("img[src*='posters/']").length, cls: document.documentElement.classList.contains("reduced-motion") }; });
  check("reduced motion (OS setting): posters instead of video", r.videos === 0 && r.posters >= 3 && r.cls, JSON.stringify(r));
  await ctx.close();
  const t = await openDeck({ width: 1920, height: 1080 });
  await t.page.keyboard.press("m"); await t.page.waitForTimeout(300);
  const m = await t.page.evaluate(() => ({ videos: document.querySelectorAll("video").length, cls: document.documentElement.classList.contains("reduced-motion") }));
  check("reduced motion ('M' key toggle)", m.videos === 0 && m.cls, JSON.stringify(m));
  await t.ctx.close();
}
await browser.close(); server.kill();

// ---- backups ----
const pdf = path.join(root, "backup/deck.pdf"), mp4 = path.join(root, "backup/deck-backup.mp4");
if (existsSync(pdf)) {
  const pages = +execFileSync("pdfinfo", [pdf]).toString().match(/Pages:\s+(\d+)/)[1];
  check("PDF backup has 16 pages", pages === 16, `${pages} pages`);
} else check("PDF backup exists", false, "run npm run export:pdf");
if (existsSync(mp4)) {
  const p = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=codec_name,width,height,codec_type", "-of", "json", mp4]).toString());
  const v = p.streams.find((s) => s.codec_type === "video"), audio = p.streams.some((s) => s.codec_type === "audio");
  const dur = +p.format.duration;
  execFileSync("ffmpeg", ["-v", "error", "-i", mp4, "-f", "null", "-"]);   // full decode = playback check
  const pre = (await import("js-yaml")).default.load((await import("node:fs")).readFileSync(path.join(root, "src/data/story.yaml"), "utf8")).slides.reduce((a, s) => a + (s.preroll_seconds ?? 0), 0);
  check("MP4 backup decodes, H.264 1920×1080, silent, 15:00 + pre-roll", v.codec_name === "h264" && v.width === 1920 && !audio && Math.abs(dur - 900 - pre) < 5, `${dur.toFixed(1)} s (pre-roll ${pre} s)`);
} else check("MP4 backup exists", false, "run npm run export:mp4");

writeFileSync(path.join(root, "tests/test-report.json"), JSON.stringify({ when: new Date().toISOString(), chrome: CHROME, results }, null, 1));
const failedN = results.filter((r) => !r.ok).length;
console.log(failedN ? `\n${failedN} test(s) FAILED` : "\nALL TESTS PASSED");
process.exit(failedN ? 1 : 0);
