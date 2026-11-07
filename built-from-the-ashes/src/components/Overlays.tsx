import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { ResolvedOverlay } from "../resolve";

export const FONT = "'Liberation Sans', 'Arial Black', Arial, Helvetica, sans-serif";

const fadeInOut = (frame: number, fps: number, totalFrames: number, inSec: number, outSec: number) =>
  Math.min(
    interpolate(frame, [0, inSec * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    interpolate(frame, [totalFrames - outSec * fps, totalFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  );

export const Wordmark: React.FC<{ size?: number; sub?: string }> = ({ size = 120, sub }) => (
  <div style={{ textAlign: "center", color: "#fff", fontFamily: FONT, textShadow: "0 6px 40px rgba(0,0,0,0.8)" }}>
    <div style={{ fontSize: size, fontWeight: 900, letterSpacing: size * 0.08, lineHeight: 1 }}>NOKE VAN CO.</div>
    {sub ? <div style={{ fontSize: size * 0.3, letterSpacing: size * 0.06, marginTop: size * 0.2, textTransform: "uppercase", opacity: 0.9 }}>{sub}</div> : null}
  </div>
);

export const LogoOverlay: React.FC<{ overlay: Extract<ResolvedOverlay, { type: "logo" }>; logoSrc: string | null; totalFrames: number }> = ({ overlay, logoSrc, totalFrames }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const hit = overlay.style !== "fade";
  const s = spring({ frame, fps, config: { damping: 14, stiffness: 220, mass: 0.8 } });
  const scale = hit ? interpolate(s, [0, 1], [1.7, 1]) : 1;
  const opacity = hit
    ? Math.min(interpolate(frame, [0, 3], [0, 1], { extrapolateRight: "clamp" }), interpolate(frame, [totalFrames - 0.5 * fps, totalFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }))
    : fadeInOut(frame, fps, totalFrames, 0.6, 0.6);
  const flash = hit ? interpolate(frame, [0, 6], [0.9, 0], { extrapolateRight: "clamp" }) : 0;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.75) 100%)" }} />
      <AbsoluteFill style={{ backgroundColor: "#fff", opacity: flash }} />
      <div style={{ transform: `scale(${scale})` }}>
        {logoSrc ? (
          <Img src={staticFile(logoSrc)} style={{ width: width * 0.5, maxHeight: 400, objectFit: "contain", filter: "drop-shadow(0 10px 40px rgba(0,0,0,0.8))" }} />
        ) : (
          <Wordmark size={width * 0.085} />
        )}
      </div>
    </AbsoluteFill>
  );
};

export const TextOverlay: React.FC<{ overlay: Extract<ResolvedOverlay, { type: "text" }>; totalFrames: number }> = ({ overlay, totalFrames }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const opacity = fadeInOut(frame, fps, totalFrames, 0.5, 0.5);
  const quiet = overlay.style !== "loud";
  const rise = interpolate(frame, [0, 0.8 * fps], [12, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity }}>
      <AbsoluteFill style={{ background: quiet ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.25)" }} />
      <div
        style={{
          transform: `translateY(${rise}px)`,
          color: "#fff",
          fontFamily: FONT,
          fontWeight: quiet ? 400 : 900,
          fontSize: quiet ? width * 0.045 : width * 0.07,
          letterSpacing: quiet ? 1 : 4,
          textTransform: quiet ? "none" : "uppercase",
          textAlign: "center",
          maxWidth: width * 0.8,
          lineHeight: 1.2,
          textShadow: "0 4px 30px rgba(0,0,0,0.9)",
        }}
      >
        {overlay.text}
      </div>
    </AbsoluteFill>
  );
};

export const CounterOverlay: React.FC<{ overlay: Extract<ResolvedOverlay, { type: "counter" }>; totalFrames: number }> = ({ overlay, totalFrames }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const t = frame / fps;
  const steps = overlay.to - overlay.from + 1;
  const stepLen = overlay.duration / steps;
  const idx = Math.min(steps - 1, Math.floor(t / stepLen));
  const value = overlay.from + idx;
  const sinceTick = t - idx * stepLen;
  const punch = Math.max(0, 1 - sinceTick / Math.min(0.2, stepLen));
  const done = value === overlay.to;
  const opacity = Math.min(1, frame / 3) * interpolate(frame, [totalFrames - 0.4 * fps, totalFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity }}>
      <AbsoluteFill style={{ background: "rgba(0,0,0,0.35)" }} />
      <div style={{ textAlign: "center", color: "#fff", fontFamily: FONT, textShadow: "0 6px 40px rgba(0,0,0,0.9)" }}>
        <div
          style={{
            fontSize: width * 0.3,
            fontWeight: 900,
            lineHeight: 0.9,
            fontVariantNumeric: "tabular-nums",
            transform: `scale(${1 + 0.08 * punch + (done ? 0.05 : 0)})`,
            color: done ? "#ffb627" : "#fff",
          }}
        >
          {value}
        </div>
        {overlay.label ? <div style={{ fontSize: width * 0.035, letterSpacing: 8, marginTop: 16, fontWeight: 700 }}>{overlay.label}</div> : null}
      </div>
    </AbsoluteFill>
  );
};

export const EndCard: React.FC<{ overlay: Extract<ResolvedOverlay, { type: "endcard" }>; logoSrc: string | null }> = ({ overlay, logoSrc }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const fadeIn = (overlay.fadeIn ?? 1) * fps;
  const bg = interpolate(frame, [0, fadeIn], [0, 1], { extrapolateRight: "clamp" });
  const title = interpolate(frame, [fadeIn * 0.5, fadeIn * 1.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sub = interpolate(frame, [fadeIn * 1.5, fadeIn * 2.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: `rgba(0,0,0,${bg})`, justifyContent: "center", alignItems: "center" }}>
      <div style={{ opacity: title, textAlign: "center", color: "#fff", fontFamily: FONT }}>
        {logoSrc ? (
          <Img src={staticFile(logoSrc)} style={{ width: width * 0.4, maxHeight: 320, objectFit: "contain" }} />
        ) : (
          <div style={{ fontSize: width * 0.07, fontWeight: 900, letterSpacing: width * 0.006 }}>{overlay.title.toUpperCase()}</div>
        )}
        <div style={{ opacity: sub, marginTop: 28, fontSize: width * 0.03, letterSpacing: 6, textTransform: "uppercase" }}>
          {overlay.subtitle}
        </div>
      </div>
    </AbsoluteFill>
  );
};
