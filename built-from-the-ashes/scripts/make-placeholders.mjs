#!/usr/bin/env node
/**
 * Generate labeled placeholder stills (SVG) and short clips (MP4) for every pool, so the
 * edit can be previewed before real media exists. Output: public/media/placeholders/<pool>/
 * Then runs the in-place ingest to refresh public/media.json.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { spawn, spawnSync } from "node:child_process";
import { MEDIA_DIR, POOLS, findFfmpeg } from "./media-lib.mjs";

const OUT = path.join(MEDIA_DIR, "placeholders");
const COLORS = {
  "rvtv-old": ["#3b3a30", "#7a6f4f"], "rvtv-aftermath": ["#2b2b2b", "#5a5a5a"], "rvtv-new": ["#1d3b4a", "#3d7a8a"],
  fire: ["#5a0f00", "#ff6a00"], rubble: ["#2a2420", "#6e5c4e"], community: ["#3a1f4d", "#9b59b6"],
  shop: ["#1f2a1f", "#4d6b4d"], crew: ["#1b2a40", "#3b6ea8"], early: ["#3d2f1a", "#a07a3a"],
  roadtrip: ["#0f3a3a", "#2fa39a"], build: ["#2d2d12", "#a3a329"], vans: ["#0d2240", "#1f6fd1"],
  social: ["#3d1030", "#d63384"], logo: ["#000000", "#222222"], misc: ["#222", "#444"],
};
const STILLS_PER_POOL = { fire: 6, rubble: 4, vans: 6, crew: 4, build: 5, community: 4, roadtrip: 4, shop: 3, early: 3, logo: 1, misc: 1 };
const CLIP_POOLS = ["rvtv-old", "rvtv-aftermath", "rvtv-new", "social"];

const svg = (pool, i, [a, b]) => `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
<rect width="1280" height="720" fill="url(#g)"/>
<circle cx="${200 + i * 170}" cy="${150 + (i % 3) * 180}" r="140" fill="#fff" fill-opacity="0.08"/>
<rect x="60" y="60" width="1160" height="600" fill="none" stroke="#fff" stroke-opacity="0.25" stroke-width="4" stroke-dasharray="18 14"/>
<text x="640" y="380" text-anchor="middle" font-family="Liberation Sans, Arial, sans-serif" font-weight="700" font-size="88" fill="#fff" fill-opacity="0.9">${pool.toUpperCase()}</text>
<text x="640" y="450" text-anchor="middle" font-family="Liberation Sans, Arial, sans-serif" font-size="36" fill="#fff" fill-opacity="0.7">placeholder still ${i + 1}</text>
</svg>`;

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/** Minimal PNG encoder (RGB, no deps) so frames can be piped to ffmpeg's image2pipe demuxer. */
function encodePng(width, height, rgb) {
  const crcTable = encodePng.table ?? (encodePng.table = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; }));
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type, "ascii"), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) { raw[y * (width * 3 + 1)] = 0; rgb.copy(raw, y * (width * 3 + 1) + 1, y * width * 3, (y + 1) * width * 3); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 1 })), chunk("IEND", Buffer.alloc(0))]);
}

/** 6-second 480x270 clip: a gradient that slides, so motion is visible. PNG frames piped into ffmpeg. */
function makeClip(dest, [a, b]) {
  const ffmpeg = findFfmpeg();
  if (!ffmpeg) return Promise.resolve(false);
  const W = 480, H = 270, FPS = 24, SECONDS = 6;
  const ca = hex(a), cb = hex(b);
  return new Promise((resolve) => {
    const p = spawn(ffmpeg, ["-y", "-v", "error", "-f", "image2pipe", "-vcodec", "png", "-framerate", String(FPS), "-i", "-", "-c:v", "libx264", "-preset", "veryfast", "-crf", "26", "-pix_fmt", "yuv420p", dest], { stdio: ["pipe", "inherit", "inherit"] });
    p.on("close", (code) => resolve(code === 0));
    p.stdin.on("error", () => resolve(false));
    const frame = Buffer.alloc(W * H * 3);
    for (let f = 0; f < FPS * SECONDS; f++) {
      const shift = f / (FPS * SECONDS);
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          let t = ((x / W + y / H) / 2 + shift) % 1;
          t = t < 0.5 ? t * 2 : (1 - t) * 2;
          const stripe = Math.floor((x + f * 3) / 40) % 2 === 0 ? 1 : 0.88;
          const o = (y * W + x) * 3;
          frame[o] = (ca[0] + (cb[0] - ca[0]) * t) * stripe;
          frame[o + 1] = (ca[1] + (cb[1] - ca[1]) * t) * stripe;
          frame[o + 2] = (ca[2] + (cb[2] - ca[2]) * t) * stripe;
        }
      }
      p.stdin.write(encodePng(W, H, frame));
    }
    p.stdin.end();
  });
}

async function main() {
  fs.rmSync(OUT, { recursive: true, force: true });
  for (const pool of Object.keys(POOLS)) {
    const dir = path.join(OUT, pool);
    fs.mkdirSync(dir, { recursive: true });
    const colors = COLORS[pool] ?? COLORS.misc;
    const n = STILLS_PER_POOL[pool] ?? 3;
    for (let i = 0; i < n; i++) fs.writeFileSync(path.join(dir, `${pool}-${String(i + 1).padStart(2, "0")}.svg`), svg(pool, i, colors));
    if (pool === "fire") fs.writeFileSync(path.join(dir, "loading-dock-fire.svg"), svg("fire · loading dock", 0, colors));
    if (CLIP_POOLS.includes(pool)) {
      for (let i = 0; i < 2; i++) {
        const dest = path.join(dir, `${pool}-clip-${i + 1}.mp4`);
        process.stdout.write(`clip ${path.relative(MEDIA_DIR, dest)}\n`);
        if (!(await makeClip(dest, i === 0 ? colors : [...colors].reverse()))) console.warn("  ! ffmpeg not available, skipped clip");
      }
    }
  }
  console.log("placeholders written to", path.relative(process.cwd(), OUT));
  const r = spawnSync(process.execPath, [path.join(path.dirname(new URL(import.meta.url).pathname), "ingest-media.mjs")], { stdio: "inherit" });
  process.exit(r.status ?? 1);
}
main();
