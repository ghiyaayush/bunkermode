import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { CRTFilter } from "../components/CRTFilter";
import { COLORS, FONTS } from "../constants";

/**
 * 0:42 to 0:55 — The pattern.
 * "Every single time, the same story.
 *  Someone was asleep.
 *  No warning. No window. No way out."
 */

const LINES = [
  { text: "every single time", at: 0 },
  { text: "the same story.", at: 60 },
  { text: "someone was asleep.", at: 200 },
  { text: "no warning.", at: 380 },
  { text: "no window.", at: 480 },
  { text: "no way out.", at: 580 },
];

export const Pattern: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <CRTFilter intensity="medium" tint="amber" vignette grain>
      <AbsoluteFill
        style={{
          background: "#0A0E13",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 1400 }}>
          {LINES.map((line, i) => {
            const opacity = interpolate(
              frame,
              [line.at, line.at + 12, line.at + 200, line.at + 220],
              [0, 1, 1, i < 2 ? 0.25 : 0.7],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            );
            const isPunchline = i >= 3;
            return (
              <div
                key={i}
                style={{
                  fontFamily: `'${isPunchline ? FONTS.serif : FONTS.pixel}', serif`,
                  fontSize: isPunchline ? 96 : 76,
                  color: isPunchline ? COLORS.danger : COLORS.text,
                  opacity,
                  marginTop: i === 0 ? 0 : isPunchline ? 24 : 16,
                  letterSpacing: isPunchline ? "0.02em" : "0.03em",
                  fontWeight: isPunchline ? 700 : 400,
                  textShadow: isPunchline ? "0 0 16px rgba(239,68,68,0.4)" : "none",
                }}
              >
                {line.text}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </CRTFilter>
  );
};
