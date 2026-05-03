import React from "react";
import { Composition } from "remotion";
import { Main } from "./Main";
import { UmbraCut } from "./scenes/UmbraCut";
import { FPS, WIDTH, HEIGHT, TOTAL_DURATION } from "./constants";
import { loadFont as loadVT323 } from "@remotion/google-fonts/VT323";
import { loadFont as loadIBMPlexMono } from "@remotion/google-fonts/IBMPlexMono";
import { loadFont as loadSourceSerifPro } from "@remotion/google-fonts/SourceSerif4";

loadVT323();
loadIBMPlexMono();
loadSourceSerifPro();

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="Main"
        component={Main}
        durationInFrames={TOTAL_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="UmbraCut"
        component={UmbraCut}
        durationInFrames={TOTAL_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
