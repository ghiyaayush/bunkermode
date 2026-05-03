import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { CRTFilter } from "../components/CRTFilter";
import { COLORS, FONTS } from "../constants";

/**
 * 1:32 to 1:48 — The proof.
 * Replays the Kelp incident timing visually with a fake monitor UI.
 */

const TIMELINE = [
  { t: 0, label: "T+0s", event: "Bridge drain detected", color: COLORS.warn },
  { t: 60, label: "T+5s", event: "Forta alert ingested", color: COLORS.warn },
  { t: 180, label: "T+12s", event: "Hypernative confirms DPRK", color: COLORS.danger },
  { t: 360, label: "T+30s", event: "Attack class: BRIDGE_VERIFIER", color: COLORS.danger },
  { t: 540, label: "T+50s", event: "Aave WETH utilization > 85%", color: COLORS.critical },
  { t: 720, label: "T+90s", event: "T3 FIRE — Two transactions out", color: COLORS.accent },
];

export const DemoProof: React.FC = () => {
  const frame = useCurrentFrame();

  // Utilization curve
  const utilization = interpolate(frame, [0, 540, 720, 960], [0.65, 0.85, 0.99, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Tier
  const tier = frame < 60 ? "WATCH" : frame < 540 ? "T1" : frame < 720 ? "T2" : "T3";
  const tierColor = frame < 60 ? COLORS.muted : frame < 540 ? COLORS.warn : frame < 720 ? COLORS.warn : COLORS.critical;

  return (
    <CRTFilter intensity="medium" tint="phosphor" chromatic vignette grain>
      <AbsoluteFill
        style={{
          background: "#000",
          padding: 80,
          flexDirection: "column",
        }}
      >
        {/* Title */}
        <div
          style={{
            fontFamily: `'${FONTS.mono}', monospace`,
            fontSize: 32,
            color: COLORS.muted,
            letterSpacing: "0.3em",
            marginBottom: 40,
          }}
        >
          KELPDAO INCIDENT — REPLAY
        </div>

        <div style={{ display: "flex", gap: 40, flex: 1 }}>
          {/* Left: timeline */}
          <div style={{ flex: 1.2, display: "flex", flexDirection: "column", gap: 20 }}>
            {TIMELINE.map((item) => {
              const opacity = interpolate(frame, [item.t, item.t + 10], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              return (
                <div
                  key={item.t}
                  style={{
                    opacity,
                    fontFamily: `'${FONTS.mono}', monospace`,
                    fontSize: 30,
                    color: item.color,
                    display: "flex",
                    gap: 24,
                  }}
                >
                  <span style={{ width: 110, color: COLORS.muted }}>{item.label}</span>
                  <span>{item.event}</span>
                </div>
              );
            })}
          </div>

          {/* Right: meters */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 40 }}>
            <div>
              <div
                style={{
                  fontFamily: `'${FONTS.mono}', monospace`,
                  fontSize: 24,
                  color: COLORS.muted,
                  letterSpacing: "0.3em",
                  marginBottom: 16,
                }}
              >
                CURRENT TIER
              </div>
              <div
                style={{
                  fontFamily: `'${FONTS.pixel}', monospace`,
                  fontSize: 200,
                  color: tierColor,
                  textShadow: `0 0 20px ${tierColor}`,
                  lineHeight: 1,
                }}
              >
                {tier}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontFamily: `'${FONTS.mono}', monospace`,
                  fontSize: 24,
                  color: COLORS.muted,
                  letterSpacing: "0.3em",
                  marginBottom: 16,
                }}
              >
                AAVE WETH UTILIZATION
              </div>
              <div
                style={{
                  height: 36,
                  background: COLORS.panel,
                  border: `1px solid ${COLORS.muted}`,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: `${utilization * 100}%`,
                    background: utilization > 0.85 ? COLORS.critical : COLORS.warn,
                    transition: "width 0.1s linear",
                  }}
                />
                {/* 85% threshold marker */}
                <div
                  style={{
                    position: "absolute",
                    left: "85%",
                    top: -8,
                    bottom: -8,
                    width: 2,
                    background: COLORS.text,
                  }}
                />
              </div>
              <div
                style={{
                  fontFamily: `'${FONTS.pixel}', monospace`,
                  fontSize: 64,
                  color: utilization > 0.85 ? COLORS.critical : COLORS.text,
                  marginTop: 12,
                }}
              >
                {(utilization * 100).toFixed(1)}%
              </div>
              <div
                style={{
                  fontFamily: `'${FONTS.mono}', monospace`,
                  fontSize: 22,
                  color: COLORS.muted,
                  marginTop: 4,
                }}
              >
                85% = last exit ramp · 100% = locked
              </div>
            </div>
          </div>
        </div>

        {/* Final fire flash */}
        {frame > 720 && (
          <AbsoluteFill
            style={{
              background: COLORS.accent,
              opacity: interpolate(frame, [720, 730, 760], [0, 0.35, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              pointerEvents: "none",
            }}
          />
        )}
      </AbsoluteFill>
    </CRTFilter>
  );
};
