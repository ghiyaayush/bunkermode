import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { CRTFilter } from "../components/CRTFilter";
import { COLORS, FONTS } from "../constants";

/**
 * 2:05 to 2:18 — Morning, redux.
 * "They woke up at 8 AM. Read the news.
 *  And for the first time in DeFi history — they were fine."
 *
 * Mirrors the opening visually: clock at 8 AM (was 7:00), wallet
 * balance flat (was $0.00), then the side-by-side PnL chart.
 */

export const MorningRedux: React.FC = () => {
  const frame = useCurrentFrame();

  const clockOpacity = interpolate(frame, [0, 30, 200, 240], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const finOpacity = interpolate(frame, [240, 300, 540, 600], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const chartOpacity = interpolate(frame, [600, 660], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Animated chart lines
  const chartProgress = interpolate(frame, [660, 780], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <CRTFilter intensity="subtle" tint="none" vignette grain>
      <AbsoluteFill
        style={{
          background: "#0A0E13",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* 8:00 AM clock — mirrors opening */}
        <div style={{ opacity: clockOpacity, position: "absolute", textAlign: "center" }}>
          <div
            style={{
              fontFamily: `'${FONTS.pixel}', monospace`,
              fontSize: 280,
              color: COLORS.text,
              letterSpacing: "0.05em",
              textShadow: "0 0 12px rgba(16,185,129,0.3)",
            }}
          >
            8:00
          </div>
          <div
            style={{
              fontFamily: `'${FONTS.pixel}', monospace`,
              fontSize: 60,
              color: COLORS.accent,
              letterSpacing: "0.4em",
            }}
          >
            AM
          </div>
        </div>

        {/* "they were fine" reveal */}
        <div
          style={{
            opacity: finOpacity,
            position: "absolute",
            textAlign: "center",
            maxWidth: 1500,
          }}
        >
          <div
            style={{
              fontFamily: `'${FONTS.serif}', serif`,
              fontSize: 56,
              color: COLORS.muted,
              marginBottom: 32,
              fontStyle: "italic",
            }}
          >
            They woke up at 8 AM. Read the news.
          </div>
          <div
            style={{
              fontFamily: `'${FONTS.serif}', serif`,
              fontSize: 80,
              color: COLORS.text,
              marginBottom: 32,
            }}
          >
            And for the first time in DeFi history —
          </div>
          <div
            style={{
              fontFamily: `'${FONTS.pixel}', monospace`,
              fontSize: 160,
              color: COLORS.accent,
              textShadow: "0 0 24px rgba(16,185,129,0.6)",
            }}
          >
            they were fine.
          </div>
        </div>

        {/* PnL chart */}
        <div
          style={{
            opacity: chartOpacity,
            position: "absolute",
            width: 1400,
            height: 500,
            background: COLORS.panel,
            border: `1px solid ${COLORS.muted}`,
            padding: 40,
          }}
        >
          <div
            style={{
              fontFamily: `'${FONTS.mono}', monospace`,
              fontSize: 24,
              color: COLORS.muted,
              letterSpacing: "0.3em",
              marginBottom: 24,
            }}
          >
            21 DAYS POST-INCIDENT
          </div>
          <svg viewBox="0 0 1320 380" style={{ width: "100%", height: 380 }}>
            {/* Axis */}
            <line x1="0" y1="190" x2={1320 * chartProgress} y2="190" stroke="#1F2730" strokeWidth="1" />
            {/* Protected line — flat at zero */}
            <line
              x1="0"
              y1="190"
              x2={1320 * chartProgress}
              y2={190 - 8}
              stroke={COLORS.accent}
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Unprotected line — drops to -23% */}
            <polyline
              points={`0,190 ${100 * chartProgress},${190 + 30 * chartProgress} ${300 * chartProgress},${190 + 80 * chartProgress} ${600 * chartProgress},${190 + 140 * chartProgress} ${900 * chartProgress},${190 + 175 * chartProgress} ${1320 * chartProgress},${190 + 184 * chartProgress}`}
              fill="none"
              stroke={COLORS.danger}
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Labels */}
            <text x={1320 * chartProgress + 4} y={190 - 8} fill={COLORS.accent} fontFamily="monospace" fontSize="22">+0%</text>
            <text x={1320 * chartProgress + 4} y={190 + 184 * chartProgress} fill={COLORS.danger} fontFamily="monospace" fontSize="22">-23%</text>
          </svg>
          <div
            style={{
              display: "flex",
              gap: 48,
              fontFamily: `'${FONTS.mono}', monospace`,
              fontSize: 22,
              color: COLORS.muted,
              marginTop: 24,
            }}
          >
            <div>
              <span style={{ color: COLORS.accent }}>━</span> Protected by BunkerMode
            </div>
            <div>
              <span style={{ color: COLORS.danger }}>━</span> Unprotected · locked out 14 days
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </CRTFilter>
  );
};
