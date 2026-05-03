import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { CRTFilter } from "../components/CRTFilter";
import { COLORS, FONTS } from "../constants";

/**
 * 2:18 to 2:25 — Tagline + brand reveal.
 * "DeFi doesn't sleep. Neither do we."
 */

export const Tagline: React.FC = () => {
  const frame = useCurrentFrame();

  const line1Opacity = interpolate(frame, [0, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const line2Opacity = interpolate(frame, [80, 110], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const wordmarkOpacity = interpolate(frame, [180, 210], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const urlOpacity = interpolate(frame, [240, 270], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pulse for the green dot
  const pulse = (Math.sin(frame / 8) + 1) * 0.5;

  return (
    <CRTFilter intensity="subtle" tint="none" vignette grain={false}>
      <AbsoluteFill
        style={{
          background: "#0A0E13",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              opacity: line1Opacity,
              fontFamily: `'${FONTS.serif}', serif`,
              fontSize: 100,
              color: COLORS.muted,
              fontWeight: 600,
            }}
          >
            DeFi doesn't sleep.
          </div>
          <div
            style={{
              opacity: line2Opacity,
              fontFamily: `'${FONTS.serif}', serif`,
              fontSize: 120,
              color: COLORS.text,
              marginTop: 16,
              fontWeight: 700,
            }}
          >
            Neither do we.
          </div>

          <div style={{ marginTop: 100, opacity: wordmarkOpacity }}>
            <div
              style={{
                fontFamily: `'${FONTS.pixel}', monospace`,
                fontSize: 84,
                color: COLORS.accent,
                letterSpacing: "0.05em",
                textShadow: "0 0 20px rgba(16,185,129,0.6)",
              }}
            >
              BUNKER<span style={{ color: COLORS.text }}>MODE</span>
            </div>
            <div
              style={{
                fontFamily: `'${FONTS.mono}', monospace`,
                fontSize: 26,
                color: COLORS.muted,
                marginTop: 16,
                letterSpacing: "0.2em",
                opacity: urlOpacity,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 12,
                  height: 12,
                  background: COLORS.accent,
                  borderRadius: "50%",
                  opacity: 0.4 + pulse * 0.6,
                  marginRight: 12,
                  verticalAlign: "middle",
                }}
              />
              github.com/ghiyaayush/bunkermode
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </CRTFilter>
  );
};
