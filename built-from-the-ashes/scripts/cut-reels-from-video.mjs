#!/usr/bin/env node
/**
 * Cut the four vertical Reels out of an already-finished 16:9 music video (no Remotion involved).
 *
 *   npm run reels:from -- "C:\Users\you\Downloads\Built From The Ashes.mp4"
 *   npm run reels:from -- video.mp4 --offset 2.5      # song starts 2.5 s into the video
 *   npm run reels:from -- video.mp4 --only ReelHook    # one clip
 *   npm run reels:from -- video.mp4 --pan 0.5          # 0 = crop from left edge, 0.5 = center (default), 1 = right
 *   npm run reels:from -- video.mp4 --fit blur         # keep the whole 16:9 frame, blurred copy fills top/bottom
 *   npm run reels:from -- video.mp4 --fit black        # keep the whole frame on black bars (needs no filters)
 *   (default --fit crop: 9:16 window cut out of the middle; wide on-screen text can get clipped)
 *
 * Uses the cutdowns in timeline.json (song-time in/out + fadeOut) and the ffmpeg that ships with Remotion,
 * so it works on Windows without installing anything else. Output: out/reels-from-video/<id>.mp4, 1080x1920.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { ROOT, findFfmpeg } from "./media-lib.mjs";

const args = process.argv.slice(2);
const flagsWithValue = new Set(["--offset", "--only", "--pan", "--fit"]);
const src = args.find((a, i) => !a.startsWith("--") && !flagsWithValue.has(args[i - 1]));
const opt = (name, def) => (args.includes(name) ? args[args.indexOf(name) + 1] : def);
const offset = parseFloat(opt("--offset", "0"));
const only = opt("--only", null);
const pan = Math.min(1, Math.max(0, parseFloat(opt("--pan", "0.5"))));
const fit = opt("--fit", "crop"); // crop | blur | black

if (!src || !fs.existsSync(src)) {
  console.error("usage: node scripts/cut-reels-from-video.mjs <finished-video.mp4> [--offset seconds] [--only ReelId] [--pan 0..1]");
  process.exit(1);
}
// Prefer a full ffmpeg on PATH (has fade filters); Remotion's bundled build is trimmed and may lack them.
const candidates = [];
const which = spawnSync(process.platform === "win32" ? "where" : "which", ["ffmpeg"], { encoding: "utf8" });
if (which.status === 0) candidates.push(...which.stdout.split(/\r?\n/).map((l) => l.trim()).filter(Boolean));
const bundled = findFfmpeg();
if (bundled) candidates.push(bundled);
const hasFade = (bin) => /\bfade\b/.test(spawnSync(bin, ["-hide_banner", "-filters"], { encoding: "utf8" }).stdout || "");
let ffmpeg = candidates.find(hasFade) ?? candidates[0];
if (!ffmpeg) { console.error("ffmpeg not found (run npm install first)"); process.exit(1); }
const canFade = hasFade(ffmpeg);
const hasBlur = /\bboxblur\b/.test(spawnSync(ffmpeg, ["-hide_banner", "-filters"], { encoding: "utf8" }).stdout || "");
if (!canFade) console.log("note: this ffmpeg has no fade filter; clips will end on a hard cut. Install ffmpeg (winget install Gyan.FFmpeg) for the 1 s fade-out.");

const timeline = JSON.parse(fs.readFileSync(path.join(ROOT, "timeline.json"), "utf8"));
const cuts = (timeline.cutdowns ?? []).filter((c) => !only || c.id === only);
const outDir = path.join(ROOT, "out", "reels-from-video");
fs.mkdirSync(outDir, { recursive: true });

for (const c of cuts) {
  const start = c.start + offset;
  const len = c.end - c.start;
  const fade = c.fadeOut ?? 1;
  const out = path.join(outDir, `${c.id}.mp4`);
  // Crop a 9:16 window out of the source height, pan across it, scale to 1080x1920, fade picture + audio at the end.
  const fadeV = canFade ? `,fade=t=out:st=${(len - fade).toFixed(3)}:d=${fade}` : "";
  let filterArgs;
  if (fit === "blur" && hasBlur) {
    // background: blown-up blurred copy; foreground: whole frame scaled to 1080 wide, centered
    filterArgs = ["-filter_complex",
      `[0:v]split=2[bg][fg];[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=40:8,eq=brightness=-0.08[bgb];` +
      `[fg]scale=1080:-2:flags=lanczos[fgs];[bgb][fgs]overlay=(W-w)/2:(H-h)/2${fadeV},format=yuv420p[v]`, "-map", "[v]", "-map", "0:a"];
  } else if (fit === "black" || fit === "blur") {
    if (fit === "blur") console.log("   (no boxblur filter in this ffmpeg; using black bars)");
    filterArgs = ["-vf", `scale=1080:-2:flags=lanczos,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black${fadeV},format=yuv420p`];
  } else {
    filterArgs = ["-vf", `crop=ih*9/16:ih:(iw-ih*9/16)*${pan}:0,scale=1080:1920:flags=lanczos${fadeV},format=yuv420p`];
  }
  const af = canFade ? `afade=t=out:st=${(len - fade).toFixed(3)}:d=${fade}` : "anull";
  console.log(`\n== ${c.id}  ${start.toFixed(2)}s → ${(start + len).toFixed(2)}s  (${len.toFixed(1)} s)  ${c.label ?? ""}`);
  const r = spawnSync(
    ffmpeg,
    ["-y", "-v", "error", "-ss", start.toFixed(3), "-i", src, "-t", len.toFixed(3), ...filterArgs, "-af", af,
     "-r", "30", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out],
    { stdio: "inherit" },
  );
  if (r.status !== 0) process.exit(r.status ?? 1);
  console.log(`   -> ${path.relative(process.cwd(), out)}  ${(fs.statSync(out).size / 1e6).toFixed(1)} MB`);
}
console.log("\nDone. Check each clip on a phone; if the song starts later in the video, re-run with --offset <seconds>.");
