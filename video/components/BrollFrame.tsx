import React from "react";
import { AbsoluteFill, Img, useCurrentFrame, interpolate, staticFile } from "remotion";
import { CRTFilter } from "./CRTFilter";

/**
 * Full-screen B-roll image with Ken Burns slow zoom + CRT filter.
 * Umbra uses this for every scene — image scaled up slightly with
 * subtle drift and the VHS treatment.
 */

export interface BrollFrameProps {
  src: string; // filename in video/assets/broll/
  startScale?: number;
  endScale?: number;
  startX?: number; // px shift at start
  startY?: number;
  endX?: number;
  endY?: number;
  durationFrames: number;
  intensity?: "subtle" | "medium" | "heavy";
  tint?: "none" | "amber" | "phosphor" | "blue";
  chromatic?: boolean;
  glitch?: boolean;
  brightness?: number; // 0-1.5
  saturate?: number; // 0-2
  halftone?: boolean; // dithered/print look
  children?: React.ReactNode;
}

export const BrollFrame: React.FC<BrollFrameProps> = ({
  src,
  startScale = 1.05,
  endScale = 1.18,
  startX = 0,
  startY = 0,
  endX = 0,
  endY = 0,
  durationFrames,
  intensity = "medium",
  tint = "blue",
  chromatic = true,
  glitch = true,
  brightness = 1.0,
  saturate = 1.1,
  halftone = false,
  children,
}) => {
  const frame = useCurrentFrame();
  const t = frame / durationFrames; // 0..1
  const scale = startScale + (endScale - startScale) * t;
  const x = startX + (endX - startX) * t;
  const y = startY + (endY - startY) * t;

  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <CRTFilter
        intensity={intensity}
        tint={tint}
        chromatic={chromatic}
        vignette
        grain
        glitch={glitch}
      >
        <AbsoluteFill
          style={{
            transform: `scale(${scale}) translate(${x}px, ${y}px)`,
            transition: "none",
          }}
        >
          <Img
            src={staticFile(`broll/${src}`)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: `brightness(${brightness}) saturate(${saturate}) ${halftone ? "contrast(1.4)" : ""}`,
            }}
          />
        </AbsoluteFill>
        {/* Halftone dither overlay - matches Umbra hand frame look */}
        {halftone && (
          <>
            <AbsoluteFill
              style={{
                backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.7) 0px, rgba(0,0,0,0.7) 1.4px, transparent 1.6px)`,
                backgroundSize: "5px 5px",
                pointerEvents: "none",
                mixBlendMode: "multiply",
                opacity: 0.55,
              }}
            />
            <AbsoluteFill
              style={{
                backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1.2px)`,
                backgroundSize: "5px 5px",
                backgroundPosition: "2.5px 2.5px",
                pointerEvents: "none",
                mixBlendMode: "screen",
                opacity: 0.4,
              }}
            />
          </>
        )}
      </CRTFilter>
      {children}
    </AbsoluteFill>
  );
};
