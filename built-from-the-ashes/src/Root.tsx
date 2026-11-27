import React from "react";
import { Composition } from "remotion";
import { MusicVideo } from "./Video";
import { loadEdit } from "./timeline";

export const Root: React.FC = () => {
  const edit = loadEdit();
  return (
    <>
    <Composition
      id="BuiltFromTheAshes"
      component={MusicVideo}
      durationInFrames={edit.durationInFrames}
      fps={edit.timeline.fps}
      width={edit.timeline.width}
      height={edit.timeline.height}
    />
      {(edit.timeline.cutdowns ?? []).map((c) => (
        <Composition
          key={c.id}
          id={c.id}
          component={MusicVideo}
          durationInFrames={Math.round((c.end - c.start) * edit.timeline.fps)}
          fps={edit.timeline.fps}
          width={1080}
          height={1920}
          defaultProps={{ clip: { start: c.start, end: c.end, fadeOut: c.fadeOut ?? 1 }, hideDebug: true }}
        />
      ))}
    </>
  );
};
