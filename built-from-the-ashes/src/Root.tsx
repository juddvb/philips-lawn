import React from "react";
import { Composition } from "remotion";
import { MusicVideo } from "./Video";
import { loadEdit } from "./timeline";

export const Root: React.FC = () => {
  const edit = loadEdit();
  return (
    <Composition
      id="BuiltFromTheAshes"
      component={MusicVideo}
      durationInFrames={edit.durationInFrames}
      fps={edit.timeline.fps}
      width={edit.timeline.width}
      height={edit.timeline.height}
    />
  );
};
