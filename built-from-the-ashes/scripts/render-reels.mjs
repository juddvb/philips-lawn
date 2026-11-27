#!/usr/bin/env node
/** Render every cutdown in timeline.json to out/reels/<id>.mp4 (1080x1920). Pass ids to render a subset. */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { ROOT } from "./media-lib.mjs";

const timeline = JSON.parse(fs.readFileSync(path.join(ROOT, "timeline.json"), "utf8"));
const only = process.argv.slice(2);
const list = (timeline.cutdowns ?? []).filter((c) => !only.length || only.includes(c.id));
if (!list.length) { console.error("no cutdowns in timeline.json"); process.exit(1); }
fs.mkdirSync(path.join(ROOT, "out", "reels"), { recursive: true });
for (const c of list) {
  const out = path.join("out", "reels", `${c.id}.mp4`);
  console.log(`\n== ${c.id}  ${c.start}s → ${c.end}s  (${(c.end - c.start).toFixed(1)} s)  ${c.label ?? ""}`);
  const r = spawnSync("npx", ["remotion", "render", c.id, out, "--crf", "22", "--log=warn"], { cwd: ROOT, stdio: "inherit", shell: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
