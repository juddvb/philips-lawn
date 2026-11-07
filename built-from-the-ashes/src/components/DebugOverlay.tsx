import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { formatTime, type Edit } from "../resolve";

/** Small corner readout: section, song time, shot index, file. Turn off with "debugOverlay": false in timeline.json. */
export const DebugOverlay: React.FC<{ edit: Edit }> = ({ edit }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const shot = edit.shots.find((s) => t >= s.start && t < s.end) ?? edit.shots[edit.shots.length - 1];
  const section = edit.timeline.sections.find((s) => t >= s.start && t < s.end);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "flex-start", padding: 14, pointerEvents: "none" }}>
      <div
        style={{
          fontFamily: "'DejaVu Sans Mono', Consolas, monospace",
          fontSize: 15,
          color: "#fff",
          background: "rgba(0,0,0,0.55)",
          padding: "4px 8px",
          borderRadius: 4,
          whiteSpace: "nowrap",
        }}
      >
        {section?.label ?? "—"} · {formatTime(t)} · #{shot?.index ?? "-"} {shot?.src || `[${shot?.poolLabel}]`}
      </div>
    </AbsoluteFill>
  );
};
