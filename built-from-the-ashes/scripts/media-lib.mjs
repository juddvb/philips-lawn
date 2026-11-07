// Shared helpers for the media scripts.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const PUBLIC = path.join(ROOT, "public");
export const MEDIA_DIR = path.join(PUBLIC, "media");
export const MANIFEST = path.join(PUBLIC, "media.json");

export const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".svg", ".heic", ".heif"]);
export const VIDEO_EXT = new Set([".mp4", ".mov", ".m4v", ".webm", ".mkv", ".avi"]);

/** Pool name -> words that map a folder or file name to it. Order matters: first hit wins. */
export const POOLS = {
  "rvtv-old": ["rvtv-old", "old-building", "oldbuilding", "old", "before"],
  "rvtv-aftermath": ["rvtv-aftermath", "aftermath", "after"],
  "rvtv-new": ["rvtv-new", "new-building", "newbuilding", "new", "rebuild", "reopen", "grand", "opening"],
  fire: ["fire", "flames", "flame", "blaze", "burn", "burning", "night"],
  rubble: ["rubble", "debris", "damage", "ashes", "ash", "wreck", "demo", "cleanup"],
  community: ["community", "support", "fundraiser", "fundraising", "donation", "donations", "volunteer", "volunteers", "shirts", "tshirt"],
  shop: ["shop", "garage", "bay", "warehouse", "workshop"],
  crew: ["crew", "team", "staff", "employees", "people"],
  early: ["early", "first", "throwback", "2019", "2020", "2021", "2022", "2023"],
  roadtrip: ["roadtrip", "roadtrips", "road", "trip", "travel", "camp", "camping", "mountains", "beach", "sunrise", "adventure"],
  build: ["build", "builds", "building", "wiring", "electrical", "cabinets", "cabinetry", "install", "solar", "closeup", "close-up", "detail", "progress"],
  vans: ["vans", "van", "finished", "final", "delivery", "sprinter", "transit", "promaster", "exterior", "interior"],
  social: ["social", "reel", "reels", "tiktok", "instagram", "ig"],
  logo: ["logo", "logos", "brand", "wordmark"],
  misc: ["misc", "other"],
};

const tokens = (s) => s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

/** Guess a pool from path segments (nearest folder first, then the file name). Returns "misc" when nothing matches. */
export function guessPool(relPath) {
  const parts = relPath.split(/[\\/]/);
  const file = parts.pop();
  const candidates = [...parts.reverse(), path.parse(file).name];
  for (const c of candidates) {
    const lower = c.toLowerCase();
    if (POOLS[lower]) return lower; // exact pool name
    const toks = tokens(c);
    for (const [pool, words] of Object.entries(POOLS)) {
      if (words.some((w) => lower === w || toks.includes(w))) return pool;
    }
  }
  return "misc";
}

export function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.name.startsWith(".")) continue;
    if (entry.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/** ffmpeg: prefer the binary Remotion ships, fall back to one on PATH. */
export function findFfmpeg() {
  const dir = path.join(ROOT, "node_modules", "@remotion");
  if (fs.existsSync(dir)) {
    for (const pkg of fs.readdirSync(dir)) {
      if (!pkg.startsWith("compositor-")) continue;
      for (const name of ["ffmpeg", "ffmpeg.exe"]) {
        const p = path.join(dir, pkg, name);
        if (fs.existsSync(p)) return p;
      }
    }
  }
  const probe = spawnSync(process.platform === "win32" ? "where" : "which", ["ffmpeg"], { encoding: "utf8" });
  if (probe.status === 0) return probe.stdout.split(/\r?\n/)[0].trim();
  return null;
}

export const toPosix = (p) => p.split(path.sep).join("/");
