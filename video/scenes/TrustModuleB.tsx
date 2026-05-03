import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Sequence } from "remotion";
import { CRTFilter } from "../components/CRTFilter";
import { COLORS, FONTS, FPS } from "../constants";

/**
 * 1:48 to 2:05 — Trust + Module B refusal. (No voiceover.)
 *
 * Two acts:
 *   Act 1 (0-7s):  "No private keys. Just math."
 *   Act 2 (7-17s): The supply chain refusal banner.
 *
 * Module B is the unique differentiator — it gets the breathing room.
 */

const TrustAct: React.FC = () => {
  const frame = useCurrentFrame();
  const line1 = interpolate(frame, [0, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const line2 = interpolate(frame, [60, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [340, 380], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        opacity: fadeOut,
      }}
    >
      <div
        style={{
          opacity: line1,
          fontFamily: `'${FONTS.serif}', serif`,
          fontSize: 88,
          color: COLORS.muted,
          textAlign: "center",
          marginBottom: 32,
          letterSpacing: "0.01em",
        }}
      >
        No private keys.
      </div>
      <div
        style={{
          opacity: line2,
          fontFamily: `'${FONTS.pixel}', monospace`,
          fontSize: 140,
          color: COLORS.accent,
          textShadow: "0 0 32px rgba(16,185,129,0.55)",
          letterSpacing: "0.02em",
        }}
      >
        Just math.
      </div>
    </AbsoluteFill>
  );
};

const ModuleBAct: React.FC = () => {
  const frame = useCurrentFrame();
  const headerIn = interpolate(frame, [0, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const punchIn = interpolate(frame, [40, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const refusalIn = interpolate(frame, [110, 140], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tagIn = interpolate(frame, [220, 260], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Pulsing red border
  const pulse = (Math.sin(frame / 6) + 1) * 0.5;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 60 }}>
      <div
        style={{
          width: 1500,
          border: `4px solid ${COLORS.critical}`,
          background: "rgba(220,38,38,0.07)",
          padding: "56px 72px",
          boxShadow: `0 0 ${40 + pulse * 30}px ${15 + pulse * 15}px rgba(220,38,38,${0.45 + pulse * 0.25})`,
        }}
      >
        <div
          style={{
            opacity: headerIn,
            fontFamily: `'${FONTS.mono}', monospace`,
            fontSize: 32,
            color: COLORS.critical,
            letterSpacing: "0.4em",
            marginBottom: 32,
          }}
        >
          🚨 MODULE B — SUPPLY CHAIN ATTACK
        </div>
        <div
          style={{
            opacity: punchIn,
            fontFamily: `'${FONTS.pixel}', monospace`,
            fontSize: 88,
            color: COLORS.text,
            lineHeight: 1.1,
            marginBottom: 36,
          }}
        >
          The threat is on YOUR device.
        </div>
        <div
          style={{
            opacity: refusalIn,
            fontFamily: `'${FONTS.serif}', serif`,
            fontSize: 50,
            color: COLORS.muted,
            fontStyle: "italic",
            marginBottom: 44,
            lineHeight: 1.4,
          }}
        >
          BunkerMode is <span style={{ color: COLORS.text, fontWeight: 700 }}>NOT</span> executing any
          transactions.
          <br />
          Walk away from this machine.
        </div>
        <div
          style={{
            opacity: tagIn,
            fontFamily: `'${FONTS.mono}', monospace`,
            fontSize: 30,
            color: COLORS.warn,
            borderTop: `1px solid ${COLORS.muted}`,
            paddingTop: 24,
            letterSpacing: "0.05em",
          }}
        >
          Because automation can't out-trust a lie.
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const TrustModuleB: React.FC = () => {
  return (
    <CRTFilter intensity="medium" tint="amber" chromatic vignette grain>
      <AbsoluteFill style={{ background: "#0A0E13" }}>
        <Sequence from={0} durationInFrames={7 * FPS}>
          <TrustAct />
        </Sequence>
        <Sequence from={7 * FPS} durationInFrames={10 * FPS}>
          <ModuleBAct />
        </Sequence>
      </AbsoluteFill>
    </CRTFilter>
  );
};
