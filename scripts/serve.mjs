// Starts `vite preview` on a free fixed port for export scripts; resolves when ready.
import { spawn } from "node:child_process";
import path from "node:path";
export async function startPreview(root, port = 4174) {
  const p = spawn(path.join(root, "node_modules/.bin/vite"), ["preview", "--port", String(port), "--strictPort"], { cwd: root, stdio: "pipe" });
  await new Promise((res, rej) => { p.stdout.on("data", (d) => /Local/.test(d) && res()); p.on("exit", (c) => rej(new Error("preview exited " + c))); setTimeout(res, 8000); });
  return { url: `http://localhost:${port}/`, stop: () => p.kill() };
}
