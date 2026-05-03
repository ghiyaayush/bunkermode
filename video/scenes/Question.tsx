import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { CRTFilter } from "../components/CRTFilter";
import { PixelText } from "../components/PixelText";
import { COLORS, FONTS } from "../constants";

/**
 * 0:55 to 1:08 — The question.
 * "So we asked one question.
 *  What if someone was watching — always — so you didn't have to?"
 */

export const Question: React.FC = () => {
  const frame = useCurrentFrame();
  const setupOpacity = interpolate(frame, [0, 30, 180, 220], [0, 1, 1, 0.4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <CRTFilter intensity="subtle" tint="blue" vignette grain>
      <AbsoluteFill
        style={{
          background: "#0A0E13",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 60,
        }}
      >
        <div
          style={{
            opacity: setupOpacity,
            fontFamily: `'${FONTS.serif}', serif`,
            fontSize: 56,
            color: COLORS.muted,
            fontStyle: "italic",
          }}
        >
          So we asked one question.
        </div>

        <div style={{ marginTop: 80, maxWidth: 1500, textAlign: "center" }}>
          <PixelText
            startFrame={120}
            charsPerSecond={26}
            fontSize={76}
            color={COLORS.umbraCyan}
            fontFamily={FONTS.pixel}
            style={{
              textShadow: "0 0 16px rgba(34,211,238,0.4)",
              lineHeight: 1.3,
            }}
          >
            What if someone was watching — always — so you didn't have to?
          </PixelText>
        </div>
      </AbsoluteFill>
    </CRTFilter>
  );
};
