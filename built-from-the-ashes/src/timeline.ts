import timelineJson from "../timeline.json";
import mediaJson from "../public/media.json";
import { resolveEdit, type Edit, type Manifest, type Timeline } from "./resolve";

let cached: Edit | null = null;

export function loadEdit(): Edit {
  if (!cached) {
    cached = resolveEdit(timelineJson as unknown as Timeline, mediaJson as unknown as Manifest);
    if (cached.warnings.length && typeof console !== "undefined") {
      for (const w of cached.warnings) console.warn(`[timeline] ${w}`);
    }
  }
  return cached;
}
