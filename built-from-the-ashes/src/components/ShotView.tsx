import React from "react";
import { AbsoluteFill, Img, Loop, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Shot, Timeline } from "../resolve";

const PUNCH_SECONDS = 0.28;

export const ShotView: React.FC<{ shot: Shot; timeline: Timeline }> = ({ shot, timeline }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps; // seconds since the shot's cut point
  const len = shot.end - shot.start;
  const p = Math.min(t / len, 1.25); // keeps drifting slightly through a dissolve tail

  // Ken Burns: stills get the full move, video clips only a gentle drift.
  const k = shot.type === "video" ? 1 + (shot.kenBurns - 1) * 0.3 : shot.kenBurns;
  const maxShift = ((k - 1) * width) / 2;
  let scale = k;
  let x = 0;
  let y = 0;
  switch (shot.effect) {
    case "zoomIn":
      scale = 1 + (k - 1) * p;
      break;
    case "zoomOut":
      scale = k - (k - 1) * p;
      break;
    case "panLeft":
      x = maxShift - 2 * maxShift * p;
      y = ((k - 1) * height) / 6;
      break;
    case "panRight":
      x = -maxShift + 2 * maxShift * p;
      y = -((k - 1) * height) / 6;
      break;
    case "none":
      scale = 1;
      break;
  }

  // Beat punch (choruses): a quick scale/brightness hit on every beat.
  let brightness = 1;
  if (shot.beatPunch) {
    const abs = shot.start + t;
    const interval = 60 / timeline.beat.bpm;
    const phase = (((abs - timeline.beat.firstBeat) % interval) + interval) % interval;
    const punch = Math.max(0, 1 - phase / PUNCH_SECONDS);
    scale *= 1 + 0.045 * punch;
    brightness = 1 + 0.18 * punch;
  }

  const opacity = shot.dissolveIn > 0 ? interpolate(frame, [0, shot.dissolveIn * fps], [0, 1], { extrapolateRight: "clamp" }) : 1;

  const mediaStyle: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover" };

  return (
    <AbsoluteFill style={{ opacity, backgroundColor: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${x}px, ${y}px) scale(${scale})`, filter: brightness !== 1 ? `brightness(${brightness})` : undefined }}>
        {shot.src === "" ? (
          <MissingMedia label={shot.poolLabel} />
        ) : shot.type === "video" ? (
          shot.clipDuration && shot.clipDuration < len ? (
            // Clip is shorter than the shot: loop it.
            <Loop durationInFrames={Math.max(1, Math.floor(shot.clipDuration * fps) - 1)}>
              <OffthreadVideo src={staticFile(shot.src)} muted style={mediaStyle} toneMapped />
            </Loop>
          ) : (
            <OffthreadVideo src={staticFile(shot.src)} muted trimBefore={Math.round(shot.clipOffset * fps)} style={mediaStyle} toneMapped />
          )
        ) : (
          <Img src={staticFile(shot.src)} style={mediaStyle} />
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const MissingMedia: React.FC<{ label: string }> = ({ label }) => (
  <AbsoluteFill
    style={{
      background: "repeating-linear-gradient(45deg, #1a1a1a 0 40px, #262626 40px 80px)",
      justifyContent: "center",
      alignItems: "center",
      color: "#888",
      fontFamily: "Liberation Sans, Arial, Helvetica, sans-serif",
      fontSize: 40,
      letterSpacing: 2,
      textTransform: "uppercase",
    }}
  >
    no media for pool “{label}”
  </AbsoluteFill>
);
