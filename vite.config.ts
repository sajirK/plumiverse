// Configuration Vite : une page par langue (+ pages SEO générées par scripts/pages.mjs), hébergement GitHub Pages.
import { defineConfig } from "vite";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL(".", import.meta.url));

const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
// Sous-dossier GitHub Pages (https://sajirk.github.io/plumiverse/). Avec un domaine propre : BASE=/ npm run build
const base = process.env.BASE ?? "/plumiverse/";

/** Toutes les pages HTML générées (racine, langues, jeux, confidentialité). */
function pages(dir = ROOT, out: Record<string, string> = {}): Record<string, string> {
  for (const f of readdirSync(dir)) {
    if (["node_modules", "dist", "src", "public", "scripts", "tests", "docs", ".git"].includes(f)) continue;
    const p = join(dir, f);
    if (statSync(p).isDirectory()) pages(p, out);
    else if (f === "index.html") out[p.slice(ROOT.length).replace(/[\\/]?index\.html$/, "") || "root"] = resolve(p);
  }
  return out;
}

export default defineConfig({
  root: ROOT,
  base,
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  build: { rollupOptions: { input: pages() }, target: "es2020" },
  server: { port: 5180 },
  test: { include: ["tests/**/*.test.ts"] },
} as never);
