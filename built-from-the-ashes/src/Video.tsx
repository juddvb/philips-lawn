import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadEdit } from "./timeline";
import { ShotView } from "./components/ShotView";
import { CounterOverlay, EndCard, LogoOverlay, TextOverlay } from "./components/Overlays";
import { DebugOverlay } from "./components/DebugOverlay";

export type MusicVideoProps = {
  /** Render only this window of the song (seconds). Used by the vertical cutdowns. */
  clip?: { start: number; end: number; fadeOut?: number };
  /** Force the debug readout off (cutdowns). */
  hideDebug?: boolean;
};

export const MusicVideo: React.FC<MusicVideoProps> = ({ clip, hideDebug }) => {
  const edit = loadEdit();
  const { fps } = useVideoConfig();
  const { shots, overlays, timeline, logoSrc } = edit;
  const frame = useCurrentFrame();

  const fadeOut = clip?.fadeOut ?? 1;
  const clipFrames = clip ? Math.round((clip.end - clip.start) * fps) : null;
  const fadeStart = clipFrames !== null ? clipFrames - Math.round(fadeOut * fps) : Infinity;
  // Audio runs inside the shifted sequence, so its frame is the song frame; fade over the last `fadeOut` seconds.
  const audioVolume = clip
    ? (f: number) => interpolate(f, [Math.round(clip.end * fps) - Math.round(fadeOut * fps), Math.round(clip.end * fps)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 1;
  const blackout = clipFrames !== null ? interpolate(frame, [fadeStart, clipFrames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;

  const body = (
    <>
      <Audio src={staticFile(timeline.audio)} volume={audioVolume} />

      {shots.map((shot, i) => {
        const from = Math.round(shot.start * fps);
        // Extend each shot under the next one's dissolve so there is something to dissolve from.
        const tail = shots[i + 1]?.dissolveIn ?? 0;
        const duration = Math.max(1, Math.round((shot.end + tail) * fps) - from);
        return (
          <Sequence key={shot.index} from={from} durationInFrames={duration} name={`${shot.sectionLabel} #${shot.index}`} premountFor={shot.type === "video" ? fps : 0}>
            <ShotView shot={shot} timeline={timeline} />
          </Sequence>
        );
      })}

      {overlays.map((o, i) => {
        const from = Math.round(o.at * fps);
        const total = Math.round(o.duration * fps) + (o.type === "counter" ? Math.round((o.hold ?? 0) * fps) : 0);
        return (
          <Sequence key={`ov-${i}`} from={from} durationInFrames={Math.max(1, total)} name={`overlay:${o.type}`}>
            {o.type === "logo" ? <LogoOverlay overlay={o} logoSrc={logoSrc} totalFrames={total} /> : null}
            {o.type === "text" ? <TextOverlay overlay={o} totalFrames={total} /> : null}
            {o.type === "counter" ? <CounterOverlay overlay={o} totalFrames={total} /> : null}
            {o.type === "endcard" ? <EndCard overlay={o} logoSrc={logoSrc} /> : null}
          </Sequence>
        );
      })}

      {timeline.debugOverlay && !hideDebug ? <DebugOverlay edit={edit} /> : null}
    </>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {clip ? (
        // Negative `from` shifts the whole song so the clip's start lands on frame 0.
        <Sequence from={-Math.round(clip.start * fps)} durationInFrames={edit.durationInFrames} layout="none">
          {body}
        </Sequence>
      ) : (
        body
      )}
      {blackout > 0 ? <AbsoluteFill style={{ backgroundColor: "#000", opacity: blackout }} /> : null}
    </AbsoluteFill>
  );
};
