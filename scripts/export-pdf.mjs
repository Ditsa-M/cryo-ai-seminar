// PDF backup: reveal.js print-pdf view of the production build, one page per slide in its final
// (all-clicks) state, 1920×1080 pages. Usage: npm run build && npm run export:pdf  -> backup/deck.pdf
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { startPreview } from "./serve.mjs";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
mkdirSync(path.join(root, "backup"), { recursive: true });
const srv = await startPreview(root);
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? "/usr/bin/google-chrome" });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(srv.url + "?print-pdf", { waitUntil: "networkidle" });
await page.waitForFunction(() => document.querySelectorAll(".pdf-page").length >= 16, null, { timeout: 30000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1500);
const out = path.join(root, "backup/deck.pdf");
await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
await browser.close(); srv.stop();
const pages = execFileSync("pdfinfo", [out]).toString().match(/Pages:\s+(\d+)/)[1];
console.log(`wrote ${out} (${pages} pages)`);
if (+pages !== 16) { console.error("expected 16 pages"); process.exit(1); }
