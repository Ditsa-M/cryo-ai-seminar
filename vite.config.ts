import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import yaml from "js-yaml";

// Imports *.yaml as JSON at build time (story.yaml, claims.yaml) so the deck needs no runtime parsing.
function yamlPlugin(): Plugin {
  return {
    name: "yaml-json",
    transform(code, id) {
      if (!id.endsWith(".yaml")) return null;
      return { code: `export default ${JSON.stringify(yaml.load(code))};`, map: null };
    },
  };
}

// Offline, static build: relative base, everything bundled or copied from /public, no external origins.
export default defineConfig({
  plugins: [react(), yamlPlugin()],
  base: "./",
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  build: { outDir: "dist", assetsDir: "assets", sourcemap: false, chunkSizeWarningLimit: 2000 },
});
