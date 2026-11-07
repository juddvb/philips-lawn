/**
 * Pure resolver: turns timeline.json + public/media.json into a flat list of
 * shots and overlays with absolute times. No React, no Remotion, so it can be
 * run from the check script with plain Node.
 */

export type MediaType = "image" | "video";

export type MediaFile = {
  src: string; // path relative to public/, e.g. "media/fire/IMG_0001.jpg"
  pool: string;
  type: MediaType;
  duration?: number; // seconds (video only)
  width?: number;
  height?: number;
  source?: string; // original file it was ingested from
};

export type Manifest = {
  generatedAt?: string;
  source?: string;
  files: MediaFile[];
};

export type Effect = "zoomIn" | "zoomOut" | "panLeft" | "panRight" | "none";
export type Transition = "cut" | "dissolve";

export type Block = {
  pool?: string | string[];
  src?: string; // exact path relative to public/
  match?: string; // case-insensitive substring of the path
  until?: number; // absolute seconds; defaults to the section end
  beatsPerCut?: number;
  effect?: Effect;
  kenBurns?: number;
  transition?: Transition;
  transitionSeconds?: number;
  note?: string;
};

export type Overlay =
  | { type: "logo"; at: number; duration: number; style?: "hit" | "fade"; note?: string }
  | { type: "text"; at: number; duration: number; text: string; style?: "quiet" | "loud"; note?: string }
  | {
      type: "counter";
      at: number;
      duration: number;
      from: number;
      to: number;
      label?: string;
      hold?: number;
      note?: string;
    }
  | {
      type: "endcard";
      at: number;
      duration: number;
      title: string;
      subtitle?: string;
      fadeIn?: number;
      note?: string;
    };

export type Section = {
  id: string;
  label: string;
  start: number;
  end: number;
  beatPunch?: boolean;
  shots: Block[];
  overlays?: Overlay[];
};

export type Timeline = {
  fps: number;
  width: number;
  height: number;
  audio: string;
  duration: number;
  beat: { bpm: number; firstBeat: number };
  defaults: {
    beatsPerCut: number;
    kenBurns: number;
    transition: Transition;
    transitionSeconds: number;
    fallbackPool: string;
  };
  debugOverlay?: boolean;
  sections: Section[];
};

export type Shot = {
  index: number;
  sectionId: string;
  sectionLabel: string;
  src: string; // "" when no media is available for the pool
  poolLabel: string; // what was asked for (for debug/placeholder cards)
  type: MediaType;
  start: number;
  end: number;
  effect: Effect;
  kenBurns: number;
  dissolveIn: number; // seconds; 0 = hard cut
  clipOffset: number; // seconds into a video file
  clipDuration?: number;
  beatPunch: boolean;
  note?: string;
};

export type ResolvedOverlay = Overlay & { sectionId: string };

export type Edit = {
  timeline: Timeline;
  shots: Shot[];
  overlays: ResolvedOverlay[];
  durationInFrames: number;
  logoSrc: string | null;
  warnings: string[];
};

const EFFECT_CYCLE: Effect[] = ["zoomIn", "panRight", "zoomOut", "panLeft"];

export function beatInterval(t: Timeline): number {
  return 60 / t.beat.bpm;
}

export function beatTime(t: Timeline, index: number): number {
  return t.beat.firstBeat + index * beatInterval(t);
}

export function nearestBeatIndex(t: Timeline, seconds: number): number {
  return Math.round((seconds - t.beat.firstBeat) / beatInterval(t));
}

export function resolveEdit(timeline: Timeline, manifest: Manifest): Edit {
  const warnings: string[] = [];
  const files = [...manifest.files].sort((a, b) => a.src.localeCompare(b.src));
  const byPool = new Map<string, MediaFile[]>();
  for (const f of files) {
    const list = byPool.get(f.pool) ?? [];
    list.push(f);
    byPool.set(f.pool, list);
  }

  const poolCursor = new Map<string, number>();
  const clipCursor = new Map<string, number>();
  const warnedPools = new Set<string>();

  const poolFiles = (name: string): MediaFile[] => {
    const own = byPool.get(name);
    if (own && own.length) return own;
    if (!warnedPools.has(name)) {
      warnedPools.add(name);
      const fb = byPool.get(timeline.defaults.fallbackPool);
      warnings.push(
        `pool "${name}" has no media; using ${fb && fb.length ? `"${timeline.defaults.fallbackPool}"` : "all files"} instead`,
      );
    }
    const fb = byPool.get(timeline.defaults.fallbackPool);
    if (fb && fb.length) return fb;
    return files;
  };

  const nextFromPool = (name: string): MediaFile | null => {
    const list = poolFiles(name);
    if (!list.length) return null;
    const i = poolCursor.get(name) ?? 0;
    poolCursor.set(name, i + 1);
    return list[i % list.length];
  };

  const findFile = (block: Block): MediaFile | null => {
    if (block.src) {
      const exact = files.find((f) => f.src === block.src);
      if (exact) return exact;
      warnings.push(`src "${block.src}" not found in media.json`);
    }
    if (block.match) {
      const needle = block.match.toLowerCase();
      const hit = files.find((f) => f.src.toLowerCase().includes(needle));
      if (hit) return hit;
      warnings.push(`match "${block.match}" found nothing in media.json`);
    }
    const pools = Array.isArray(block.pool) ? block.pool : block.pool ? [block.pool] : [];
    return nextFromPool(pools[0] ?? timeline.defaults.fallbackPool);
  };

  const shots: Shot[] = [];
  const overlays: ResolvedOverlay[] = [];
  const interval = beatInterval(timeline);

  const pushShot = (
    section: Section,
    block: Block,
    file: MediaFile | null,
    start: number,
    end: number,
    poolLabel: string,
  ) => {
    const index = shots.length;
    const len = end - start;
    let clipOffset = 0;
    if (file && file.type === "video" && file.duration) {
      const cur = clipCursor.get(file.src) ?? 0;
      clipOffset = cur + len > file.duration ? 0 : cur;
      clipCursor.set(file.src, clipOffset + len);
    }
    const transition = block.transition ?? timeline.defaults.transition;
    shots.push({
      index,
      sectionId: section.id,
      sectionLabel: section.label,
      src: file?.src ?? "",
      poolLabel,
      type: file?.type ?? "image",
      start,
      end,
      effect: block.effect ?? EFFECT_CYCLE[index % EFFECT_CYCLE.length],
      kenBurns: block.kenBurns ?? timeline.defaults.kenBurns,
      dissolveIn:
        transition === "dissolve" ? (block.transitionSeconds ?? timeline.defaults.transitionSeconds) : 0,
      clipOffset,
      clipDuration: file?.duration,
      beatPunch: Boolean(section.beatPunch),
      note: block.note,
    });
  };

  for (const section of timeline.sections) {
    let cursor = section.start;
    for (const block of section.shots) {
      const blockEnd = Math.min(block.until ?? section.end, section.end);
      if (blockEnd <= cursor + 0.01) {
        warnings.push(`section ${section.id}: block ending at ${blockEnd}s has no time left (cursor at ${cursor.toFixed(2)}s)`);
        continue;
      }
      const pools = Array.isArray(block.pool) ? block.pool : block.pool ? [block.pool] : [];
      const poolLabel = block.src ?? block.match ?? pools.join("+") ?? "?";

      if (block.src || block.match) {
        pushShot(section, block, findFile(block), cursor, blockEnd, poolLabel);
        cursor = blockEnd;
        continue;
      }

      const beatsPerCut = Math.max(1, block.beatsPerCut ?? timeline.defaults.beatsPerCut);
      const shotLen = beatsPerCut * interval;
      const k0 = nearestBeatIndex(timeline, cursor);
      let shotStart = cursor;
      let m = 1;
      let poolIdx = 0;
      while (shotStart < blockEnd - 0.01) {
        let shotEnd = beatTime(timeline, k0 + m * beatsPerCut);
        m += 1;
        if (shotEnd <= shotStart + 0.05) continue; // grid point behind us; take the next one
        if (shotEnd > blockEnd - shotLen * 0.4) shotEnd = blockEnd; // absorb a short tail
        const pool = pools.length ? pools[poolIdx % pools.length] : timeline.defaults.fallbackPool;
        poolIdx += 1;
        pushShot(section, block, nextFromPool(pool), shotStart, shotEnd, pool);
        shotStart = shotEnd;
      }
      cursor = blockEnd;
    }
    if (cursor < section.end - 0.05) {
      warnings.push(`section ${section.id}: ${(section.end - cursor).toFixed(2)}s at the end has no shots (add a block or extend the last one)`);
    }
    for (const o of section.overlays ?? []) overlays.push({ ...o, sectionId: section.id });
  }

  // Section sanity checks
  const secs = timeline.sections;
  for (let i = 1; i < secs.length; i++) {
    if (Math.abs(secs[i].start - secs[i - 1].end) > 0.001) {
      warnings.push(`sections ${secs[i - 1].id} and ${secs[i].id} are not contiguous (${secs[i - 1].end} vs ${secs[i].start})`);
    }
  }

  const logo = byPool.get("logo")?.find((f) => f.type === "image") ?? null;

  return {
    timeline,
    shots,
    overlays,
    durationInFrames: Math.ceil(timeline.duration * timeline.fps),
    logoSrc: logo?.src ?? null,
    warnings,
  };
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, "0")}`;
}
