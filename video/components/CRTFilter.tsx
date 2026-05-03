import React from "react";
import { AbsoluteFill, useCurrentFrame, random } from "remotion";

/**
 * CRT / VHS look v2. Closer to the Umbra reference.
 * Adds: stronger chroma bleed, tracking lines, screen glare,
 *       periodic VHS glitch frames, denser scanlines.
 */

export interface CRTFilterProps {
  children: React.ReactNode;
  intensity?: "subtle" | "medium" | "heavy";
  tint?: "none" | "amber" | "phosphor" | "blue";
  chromatic?: boolean;
  vignette?: boolean;
  grain?: boolean;
  glitch?: boolean;
}

export const CRTFilter: React.FC<CRTFilterProps> = ({
  children,
  intensity = "medium",
  tint = "none",
  chromatic = true,
  vignette = true,
  grain = true,
  glitch = true,
}) => {
  const frame = useCurrentFrame();

  // Periodic VHS tracking glitch (every ~120 frames, lasts ~3 frames)
  const glitchPhase = frame % 120;
  const isGlitching = glitch && glitchPhase < 3;
  const glitchOffset = isGlitching ? (random(`glitch-${frame}`) - 0.5) * 24 : 0;

  // Tracking line position (slow vertical roll)
  const trackingY = (frame * 1.2) % 1080;

  const grainOpacity = grain ? 0.06 + random(`g-${frame}`) * 0.05 : 0;

  const scanlineHeights = {
    subtle: { stripe: 1, gap: 4 },
    medium: { stripe: 1, gap: 3 },
    heavy: { stripe: 2, gap: 4 },
  };
  const scanlineOpacity = {
    subtle: 0.1,
    medium: 0.22,
    heavy: 0.36,
  };
  const tintColor = {
    none: "transparent",
    amber: "rgba(245, 158, 11, 0.06)",
    phosphor: "rgba(57, 255, 20, 0.05)",
    blue: "rgba(34, 211, 238, 0.05)",
  };

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      {/* Underlying content with chromatic aberration via dual offset layers */}
      <AbsoluteFill style={{ transform: `translateX(${glitchOffset}px)` }}>
        {chromatic ? (
          <>
            <AbsoluteFill
              style={{
                filter: "url(#chromR-v2)",
                mixBlendMode: "screen",
                opacity: 0.6,
                transform: "translateX(2.5px)",
              }}
            >
              {children}
            </AbsoluteFill>
            <AbsoluteFill
              style={{
                filter: "url(#chromB-v2)",
                mixBlendMode: "screen",
                opacity: 0.6,
                transform: "translateX(-2.5px)",
              }}
            >
              {children}
            </AbsoluteFill>
            <AbsoluteFill style={{ mixBlendMode: "screen" }}>{children}</AbsoluteFill>
          </>
        ) : (
          <AbsoluteFill>{children}</AbsoluteFill>
        )}
      </AbsoluteFill>

      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter id="chromR-v2">
            <feColorMatrix values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
          </filter>
          <filter id="chromB-v2">
            <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" />
          </filter>
        </defs>
      </svg>

      {/* Scanlines — denser, with subtle horizontal bleed */}
      <AbsoluteFill
        style={{
          backgroundImage: `repeating-linear-gradient(
            to bottom,
            rgba(0,0,0,${scanlineOpacity[intensity]}) 0px,
            rgba(0,0,0,${scanlineOpacity[intensity]}) ${scanlineHeights[intensity].stripe}px,
            transparent ${scanlineHeights[intensity].stripe}px,
            transparent ${scanlineHeights[intensity].gap}px
          )`,
          pointerEvents: "none",
        }}
      />

      {/* VHS tracking line — slow rolling brighter band */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(to bottom,
            transparent ${Math.max(0, trackingY - 80)}px,
            rgba(255,255,255,0.06) ${trackingY - 30}px,
            rgba(255,255,255,0.10) ${trackingY}px,
            rgba(255,255,255,0.06) ${trackingY + 30}px,
            transparent ${trackingY + 80}px
          )`,
          pointerEvents: "none",
          mixBlendMode: "screen",
        }}
      />

      {/* Color tint */}
      {tint !== "none" && (
        <AbsoluteFill style={{ backgroundColor: tintColor[tint], pointerEvents: "none" }} />
      )}

      {/* Vignette — heavier corners */}
      {vignette && (
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.45) 80%, rgba(0,0,0,0.75) 100%)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Screen glare — subtle top-left highlight */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 25% 20%, rgba(255,255,255,0.05) 0%, transparent 35%)",
          pointerEvents: "none",
          mixBlendMode: "screen",
        }}
      />

      {/* Animated grain */}
      {grain && (
        <AbsoluteFill
          style={{
            backgroundImage: `
              repeating-radial-gradient(
                circle at ${random(`gx-${frame}`) * 100}% ${random(`gy-${frame}`) * 100}%,
                rgba(255,255,255,${grainOpacity}) 0px,
                rgba(255,255,255,${grainOpacity}) 1px,
                transparent 1px,
                transparent 4px
              )
            `,
            pointerEvents: "none",
            mixBlendMode: "overlay",
          }}
        />
      )}

      {/* Glitch flash band */}
      {isGlitching && (
        <AbsoluteFill
          style={{
            background: `linear-gradient(to bottom,
              transparent ${random(`gly-${frame}`) * 100}%,
              rgba(255,255,255,0.15) ${random(`gly-${frame}`) * 100 + 2}%,
              transparent ${random(`gly-${frame}`) * 100 + 4}%
            )`,
            pointerEvents: "none",
            mixBlendMode: "screen",
          }}
        />
      )}
    </AbsoluteFill>
  );
};
