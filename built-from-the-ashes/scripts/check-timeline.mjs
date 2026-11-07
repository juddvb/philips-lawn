#!/usr/bin/env node
/**
 * Validate timeline.json against public/media.json and print the resolved shot list.
 *   node scripts/check-timeline.mjs            whole song
 *   node scripts/check-timeline.mjs verse2     one section (by id or label)
 * Needs Node 22.6+ (uses built-in TypeScript type stripping to load src/resolve.ts).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { resolveEdit, formatTime } = await import(path.join(root, "src", "resolve.ts"));
const timeline = JSON.parse(fs.readFileSync(path.join(root, "timeline.json"), "utf8"));
const manifest = JSON.parse(fs.readFileSync(path.join(root, "public", "media.json"), "utf8"));
const only = process.argv[2]?.toLowerCase();

const edit = resolveEdit(timeline, manifest);
const sectionsToShow = timeline.sections.filter((s) => !only || s.id.toLowerCase() === only || s.label.toLowerCase() === only);
if (!sectionsToShow.length) {
  console.error(`no section "${only}". ids: ${timeline.sections.map((s) => s.id).join(", ")}`);
  process.exit(1);
}

console.log(`${timeline.width}x${timeline.height} @ ${timeline.fps}fps · ${formatTime(timeline.duration)} · ${edit.durationInFrames} frames · ${edit.shots.length} shots · beat ${(60 / timeline.beat.bpm).toFixed(3)}s`);
console.log(`media: ${manifest.files.length} files · pools: ${Object.entries(manifest.pools ?? {}).map(([p, n]) => `${p}(${n})`).join(" ")}`);
for (const s of sectionsToShow) {
  console.log(`\n== ${s.label} [${s.id}]  ${formatTime(s.start)} → ${formatTime(s.end)}  (${(s.end - s.start).toFixed(1)}s${s.beatPunch ? ", beat punch" : ""})`);
  for (const shot of edit.shots.filter((x) => x.sectionId === s.id)) {
    const len = (shot.end - shot.start).toFixed(2).padStart(5);
    const fx = shot.dissolveIn ? `dissolve ${shot.dissolveIn}s` : "cut";
    const clip = shot.type === "video" ? ` @${shot.clipOffset.toFixed(1)}s` : "";
    console.log(`  #${String(shot.index).padStart(3)}  ${formatTime(shot.start)}  ${len}s  ${fx.padEnd(13)} ${shot.effect.padEnd(8)} ${shot.src || `[no media: ${shot.poolLabel}]`}${clip}`);
  }
  for (const o of edit.overlays.filter((x) => x.sectionId === s.id)) {
    console.log(`  >> overlay ${o.type.padEnd(8)} ${formatTime(o.at)} for ${o.duration}s ${o.text ?? o.title ?? (o.type === "counter" ? `${o.from}→${o.to}` : "")}`);
  }
}
if (edit.warnings.length) {
  console.log("\nwarnings:");
  for (const w of edit.warnings) console.log("  - " + w);
}
