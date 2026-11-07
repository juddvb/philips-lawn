import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import { loadEdit } from "./timeline";
import { ShotView } from "./components/ShotView";
import { CounterOverlay, EndCard, LogoOverlay, TextOverlay } from "./components/Overlays";
import { DebugOverlay } from "./components/DebugOverlay";

export const MusicVideo: React.FC = () => {
  const edit = loadEdit();
  const { fps } = useVideoConfig();
  const { shots, overlays, timeline, logoSrc } = edit;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Audio src={staticFile(timeline.audio)} />

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

      {timeline.debugOverlay ? <DebugOverlay edit={edit} /> : null}
    </AbsoluteFill>
  );
};
