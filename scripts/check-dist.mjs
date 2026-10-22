// Post-build check of dist/: no external resource URLs, every referenced local asset present.
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import path from "node:path";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const dist = path.join(root, "dist");
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const files = walk(dist);
const errors = [];
for (const f of files.filter((f) => /\.(html|css|js)$/.test(f))) {
  const s = readFileSync(f, "utf8");
  for (const m of s.matchAll(/(?:src|href)\s*=\s*["'](https?:\/\/[^"']+)/g)) errors.push(`${path.relative(dist, f)}: external ${m[1]}`);
  for (const m of s.matchAll(/url\(\s*["']?(https?:\/\/[^"')]+)/g)) errors.push(`${path.relative(dist, f)}: external css ${m[1]}`);
  for (const m of s.matchAll(/(?:fetch|import)\(\s*["'](https?:\/\/[^"']+)/g)) errors.push(`${path.relative(dist, f)}: external fetch ${m[1]}`);
  for (const m of s.matchAll(/["'`](?:\.\/)?((?:figures|video|posters|fonts)\/[\w.\-]+\.(?:webp|png|webm|mp4|woff2|css))/g))
    if (!existsSync(path.join(dist, m[1]))) errors.push(`${path.relative(dist, f)}: missing ${m[1]}`);
}
const mb = files.reduce((a, f) => a + statSync(f).size, 0) / 1e6;
console.log(`dist: ${files.length} files, ${mb.toFixed(1)} MB`);
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log("dist check PASSED (no external resources, all assets present)");
