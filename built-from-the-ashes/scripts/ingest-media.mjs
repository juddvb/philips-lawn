#!/usr/bin/env node
/**
 * Build public/media.json from a folder of photos and clips.
 *
 *   node scripts/ingest-media.mjs <folder>        copy + convert everything from <folder> into public/media/
 *   node scripts/ingest-media.mjs                  scan public/media/ in place (convert HEIC, write manifest)
 *   options: --no-proxy      keep original video files instead of making 720p H.264 proxies
 *            --append        add to public/media/ instead of clearing it first
 *            --pool <name>   put every file from <folder> into this pool (skips folder/file-name guessing)
 *
 * Pool = the nearest folder name that matches a pool keyword, else a keyword in the file name, else "misc".
 * See POOLS in media-lib.mjs. You can also just edit the "pool" field in public/media.json afterwards.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { getVideoMetadata } from "@remotion/renderer";
import { IMAGE_EXT, VIDEO_EXT, MANIFEST, MEDIA_DIR, PUBLIC, findFfmpeg, guessPool, toPosix, walk } from "./media-lib.mjs";

const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
const noProxy = args.includes("--no-proxy");
const append = args.includes("--append");
const forcedPool = args.includes("--pool") ? args[args.indexOf("--pool") + 1] : null;
const source = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--pool")[0];
const ffmpeg = findFfmpeg();

const safeName = (s) => s.replace(/[^A-Za-z0-9._-]+/g, "_");

async function convertHeic(src, dest) {
  const convert = require("heic-convert");
  const out = await convert({ buffer: fs.readFileSync(src), format: "JPEG", quality: 0.88 });
  fs.writeFileSync(dest, Buffer.from(out));
}

function makeProxy(src, dest) {
  if (!ffmpeg) return false;
  const r = spawnSync(
    ffmpeg,
    ["-y", "-v", "error", "-i", src, "-vf", "scale=-2:720", "-c:v", "libx264", "-preset", "fast", "-crf", "23", "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart", dest],
    { stdio: "inherit" },
  );
  return r.status === 0;
}

async function main() {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
  const inputs = [];

  if (source) {
    const srcDir = path.resolve(source);
    if (!fs.existsSync(srcDir)) throw new Error(`folder not found: ${srcDir}`);
    // public/media is derived output; clear everything except the committed placeholders (unless --append).
    if (!append) {
      for (const entry of fs.readdirSync(MEDIA_DIR)) {
        if (entry === "placeholders" || entry === "README.md") continue;
        fs.rmSync(path.join(MEDIA_DIR, entry), { recursive: true, force: true });
      }
    }
    for (const file of walk(srcDir)) {
      const rel = path.relative(srcDir, file);
      const ext = path.extname(file).toLowerCase();
      if (!IMAGE_EXT.has(ext) && !VIDEO_EXT.has(ext)) continue;
      const pool = forcedPool ?? guessPool(rel);
      const base = safeName(path.parse(file).name);
      let destName;
      if (ext === ".heic" || ext === ".heif") destName = `${base}.jpg`;
      else if (VIDEO_EXT.has(ext) && !noProxy && ffmpeg) destName = `${base}.mp4`;
      else destName = `${base}${ext}`;
      const destDir = path.join(MEDIA_DIR, pool);
      fs.mkdirSync(destDir, { recursive: true });
      let dest = path.join(destDir, destName);
      for (let n = 2; fs.existsSync(dest); n++) dest = path.join(destDir, `${path.parse(destName).name}-${n}${path.extname(destName)}`);

      process.stdout.write(`${pool.padEnd(15)} ${rel}\n`);
      if (ext === ".heic" || ext === ".heif") await convertHeic(file, dest);
      else if (VIDEO_EXT.has(ext) && !noProxy && ffmpeg) {
        if (!makeProxy(file, dest)) {
          dest = path.join(destDir, `${base}${ext}`);
          fs.copyFileSync(file, dest);
        }
      } else fs.copyFileSync(file, dest);
      inputs.push({ file: dest, pool, source: toPosix(rel) });
    }
    if (append) {
      // Pick up what was already in public/media from earlier runs.
      const have = new Set(inputs.map((i) => i.file));
      for (const file of walk(MEDIA_DIR)) {
        const rel = path.relative(MEDIA_DIR, file);
        const ext = path.extname(file).toLowerCase();
        if (have.has(file) || (!IMAGE_EXT.has(ext) && !VIDEO_EXT.has(ext)) || rel.split(path.sep)[0] === "placeholders") continue;
        inputs.push({ file, pool: guessPool(rel), source: toPosix(rel) });
      }
    }
  } else {
    // In-place scan. Convert HEIC next to the original (original is kept but not listed).
    const all = walk(MEDIA_DIR);
    const isMedia = (f) => IMAGE_EXT.has(path.extname(f).toLowerCase()) || VIDEO_EXT.has(path.extname(f).toLowerCase());
    const hasReal = all.some((f) => isMedia(f) && path.relative(MEDIA_DIR, f).split(path.sep)[0] !== "placeholders");
    for (const file of all) {
      let rel = path.relative(MEDIA_DIR, file);
      const ext = path.extname(file).toLowerCase();
      if (!IMAGE_EXT.has(ext) && !VIDEO_EXT.has(ext)) continue;
      if (hasReal && rel.split(path.sep)[0] === "placeholders") continue;
      const relForPool = rel.replace(/^placeholders[\\/]/, "");
      const pool = guessPool(relForPool);
      if (ext === ".heic" || ext === ".heif") {
        const jpg = file.replace(/\.[^.]+$/, ".jpg");
        if (!fs.existsSync(jpg)) {
          process.stdout.write(`convert ${rel}\n`);
          await convertHeic(file, jpg);
        }
        continue; // the .jpg is picked up by this same walk (or the next run)
      }
      inputs.push({ file, pool, source: toPosix(rel) });
    }
  }

  const files = [];
  for (const { file, pool, source: src } of inputs) {
    const ext = path.extname(file).toLowerCase();
    const entry = { src: toPosix(path.relative(PUBLIC, file)), pool, type: VIDEO_EXT.has(ext) ? "video" : "image", source: src };
    if (entry.type === "video") {
      try {
        const m = await getVideoMetadata(file);
        entry.duration = Math.round(m.durationInSeconds * 1000) / 1000;
        entry.width = m.width;
        entry.height = m.height;
      } catch (e) {
        console.warn(`  ! could not read metadata for ${entry.src}: ${e.message}`);
      }
    }
    files.push(entry);
  }
  files.sort((a, b) => a.src.localeCompare(b.src));

  const pools = {};
  for (const f of files) pools[f.pool] = (pools[f.pool] ?? 0) + 1;
  fs.writeFileSync(MANIFEST, JSON.stringify({ generatedAt: new Date().toISOString(), source: source ? toPosix(path.resolve(source)) : "public/media (in place)", pools, files }, null, 2) + "\n");

  console.log(`\nwrote ${path.relative(process.cwd(), MANIFEST)} with ${files.length} files`);
  for (const [p, n] of Object.entries(pools).sort()) console.log(`  ${p.padEnd(15)} ${n}`);
  const misc = files.filter((f) => f.pool === "misc");
  if (misc.length) {
    console.log(`\n${misc.length} file(s) landed in "misc" (no folder/file-name keyword matched). Move them into a pool folder, or edit "pool" in public/media.json:`);
    for (const f of misc.slice(0, 30)) console.log(`  ${f.src}`);
  }
  if (!ffmpeg) console.log("\nnote: ffmpeg not found; video clips were copied without 720p proxies.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
