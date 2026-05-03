import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Sequence } from "remotion";
import { CRTFilter } from "../components/CRTFilter";
import { COLORS, FONTS, FPS } from "../constants";

/**
 * 1:08 to 1:32 — What it does. (No voiceover.)
 * Four full-screen beats. Each holds 6 seconds. One idea per screen.
 *   1. Watches 24 hours a day
 *   2. Sees the bridge drain
 *   3. Sees the fake collateral
 *   4. Moves your funds. Autonomously.
 */

interface BigStatementProps {
  label: string;
  bigText: string;
  emphasis?: string;
  punchColor?: string;
}

const BigStatement: React.FC<BigStatementProps> = ({ label, bigText, emphasis, punchColor }) => {
  const frame = useCurrentFrame();
  const labelOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const bigOpacity = interpolate(frame, [16, 36], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const emphasisOpacity = interpolate(frame, [60, 84], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const fadeOut = interpolate(frame, [340, 360], [1, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        opacity: fadeOut,
        gap: 24,
      }}
    >
      <div
        style={{
          opacity: labelOpacity,
          fontFamily: `'${FONTS.mono}', monospace`,
          fontSize: 36,
          color: COLORS.umbraCyan,
          letterSpacing: "0.4em",
          marginBottom: 24,
          textShadow: "0 0 12px rgba(34,211,238,0.4)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          opacity: bigOpacity,
          fontFamily: `'${FONTS.serif}', serif`,
          fontSize: 120,
          color: COLORS.text,
          textAlign: "center",
          maxWidth: 1600,
          lineHeight: 1.05,
          fontWeight: 600,
        }}
      >
        {bigText}
      </div>
      {emphasis && (
        <div
          style={{
            opacity: emphasisOpacity,
            fontFamily: `'${FONTS.pixel}', monospace`,
            fontSize: 72,
            color: punchColor ?? COLORS.danger,
            marginTop: 32,
            textShadow: `0 0 20px ${punchColor ?? COLORS.danger}66`,
            letterSpacing: "0.02em",
          }}
        >
          {emphasis}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const WhatItDoes: React.FC = () => {
  const beatFrames = 6 * FPS; // 360 frames per beat = 6 seconds

  return (
    <CRTFilter intensity="medium" tint="blue" vignette grain>
      <AbsoluteFill style={{ background: "#0A0E13" }}>
        <Sequence from={0} durationInFrames={beatFrames}>
          <BigStatement
            label="WATCHES"
            bigText="24 hours a day."
            emphasis="Even when you sleep."
            punchColor={COLORS.umbraCyan}
          />
        </Sequence>

        <Sequence from={beatFrames} durationInFrames={beatFrames}>
          <BigStatement
            label="IT SEES"
            bigText="The bridge drain."
            emphasis="Before the price moves."
          />
        </Sequence>

        <Sequence from={beatFrames * 2} durationInFrames={beatFrames}>
          <BigStatement
            label="IT SEES"
            bigText="The fake token listed as collateral."
            emphasis="Before the funds are touched."
          />
        </Sequence>

        <Sequence from={beatFrames * 3} durationInFrames={beatFrames}>
          <BigStatement
            label="IT SEES"
            bigText="The bank run building."
            emphasis="Before the exit door closes."
          />
        </Sequence>
      </AbsoluteFill>
    </CRTFilter>
  );
};
