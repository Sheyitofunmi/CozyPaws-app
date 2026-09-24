// Downloads every hot-linked image in lib/remote-assets.ts into
// public/assets/remote/ and rewrites the map to use the local copies.
// Usage: npm run assets:localize   (needs internet access; run once)
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const mapFile = path.join(root, "lib/remote-assets.ts");
const outDir = path.join(root, "public/assets/remote");

const src = await readFile(mapFile, "utf8");
const FIGMA = src.match(/const FIGMA = "([^"]+)"/)?.[1] ?? "";
const entries = [...src.matchAll(/^\s+(\w+): (.+),$/gm)].map(([, key, expr]) => {
  let url = expr
    .replace(/^`|`$/g, "")
    .replace("${FIGMA}", FIGMA);
  const un = expr.match(/unsplash\("([^"]+)"(?:, (\d+))?\)/);
  if (un) url = `https://images.unsplash.com/${un[1]}?auto=format&fit=crop&w=${un[2] ?? 800}&q=80`;
  return { key, url };
});

await mkdir(outDir, { recursive: true });
const local = {};
for (const { key, url } of entries) {
  if (url.startsWith("/")) { local[key] = url; continue; }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${key}: ${res.status} ${url}`);
  const type = res.headers.get("content-type") ?? "";
  const ext = type.includes("svg") ? "svg" : type.includes("png") ? "png"
    : type.includes("webp") ? "webp" : type.includes("avif") ? "avif" : "jpg";
  const file = `${key}.${ext}`;
  await writeFile(path.join(outDir, file), Buffer.from(await res.arrayBuffer()));
  local[key] = `/assets/remote/${file}`;
  console.log(`✓ ${key} → public/assets/remote/${file}`);
}

const body = Object.entries(local).map(([k, v]) => `  ${k}: "${v}",`).join("\n");
await writeFile(mapFile, `/**
 * Images served from public/assets/remote/ (localized by scripts/localize-assets.mjs).
 */
export const REMOTE_ASSETS = {
${body}
} as const;

export type RemoteAssetKey = keyof typeof REMOTE_ASSETS;
`);
console.log("\nlib/remote-assets.ts now points at local files. Commit public/assets/remote too.");
