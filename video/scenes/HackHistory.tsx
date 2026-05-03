import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Sequence } from "remotion";
import { CRTFilter } from "../components/CRTFilter";
import { COLORS, FONTS, FPS } from "../constants";

/**
 * 0:25 to 0:42 — Hack history.
 * Bybit, Drift, KelpDAO. Hard cuts on each. Numbers stack at the end.
 */

const HACKS = [
  { year: "2025", name: "BYBIT", amount: "$1.46B", subtitle: "Lazarus Group" },
  { year: "April 2026", name: "DRIFT PROTOCOL", amount: "$285M", subtitle: "DPRK attribution" },
  { year: "Three weeks later", name: "KELPDAO", amount: "$292M", subtitle: "LayerZero bridge" },
];

interface HackCardProps {
  year: string;
  name: string;
  amount: string;
  subtitle: string;
  startFrame: number;
}

const HackCard: React.FC<HackCardProps> = ({ year, name, amount, subtitle, startFrame }) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;
  const opacity = interpolate(local, [0, 8, 220, 240], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(local, [0, 14], [0.96, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity }}>
      <div style={{ textAlign: "center", transform: `scale(${scale})` }}>
        <div
          style={{
            fontFamily: `'${FONTS.mono}', monospace`,
            fontSize: 36,
            color: COLORS.muted,
            letterSpacing: "0.4em",
            marginBottom: 24,
          }}
        >
          {year}
        </div>
        <div
          style={{
            fontFamily: `'${FONTS.serif}', serif`,
            fontSize: 140,
            color: COLORS.text,
            fontWeight: 600,
            letterSpacing: "0.02em",
            marginBottom: 32,
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontFamily: `'${FONTS.pixel}', monospace`,
            fontSize: 200,
            color: COLORS.danger,
            textShadow: "0 0 24px rgba(239,68,68,0.45)",
          }}
        >
          {amount}
        </div>
        <div
          style={{
            fontFamily: `'${FONTS.mono}', monospace`,
            fontSize: 28,
            color: COLORS.muted,
            letterSpacing: "0.3em",
            marginTop: 24,
          }}
        >
          {subtitle.toUpperCase()}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const HackHistory: React.FC = () => {
  const frame = useCurrentFrame();
  // Final stacked summary appears in the last 4 seconds
  const summaryStart = 17 * FPS - 4 * FPS;
  const summaryOpacity = interpolate(frame, [summaryStart, summaryStart + 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <CRTFilter intensity="heavy" tint="amber" chromatic vignette grain>
      <AbsoluteFill style={{ background: "#000" }}>
        {/* Three sequential cards, ~4 seconds each */}
        <Sequence from={0} durationInFrames={4 * FPS}>
          <HackCard
            year={HACKS[0].year}
            name={HACKS[0].name}
            amount={HACKS[0].amount}
            subtitle={HACKS[0].subtitle}
            startFrame={0}
          />
        </Sequence>
        <Sequence from={4 * FPS} durationInFrames={4 * FPS}>
          <HackCard
            year={HACKS[1].year}
            name={HACKS[1].name}
            amount={HACKS[1].amount}
            subtitle={HACKS[1].subtitle}
            startFrame={4 * FPS}
          />
        </Sequence>
        <Sequence from={8 * FPS} durationInFrames={5 * FPS}>
          <HackCard
            year={HACKS[2].year}
            name={HACKS[2].name}
            amount={HACKS[2].amount}
            subtitle={HACKS[2].subtitle}
            startFrame={8 * FPS}
          />
        </Sequence>

        {/* Summary stack at end */}
        <AbsoluteFill
          style={{
            opacity: summaryOpacity,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: `'${FONTS.mono}', monospace`,
                fontSize: 28,
                color: COLORS.muted,
                letterSpacing: "0.4em",
                marginBottom: 36,
              }}
            >
              ALL DRAINED IN 12 MONTHS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {HACKS.map((h) => (
                <div
                  key={h.name}
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 80,
                    fontFamily: `'${FONTS.mono}', monospace`,
                    fontSize: 42,
                    color: COLORS.text,
                  }}
                >
                  <span style={{ color: COLORS.muted, width: 320, textAlign: "right" }}>{h.name}</span>
                  <span style={{ color: COLORS.danger, width: 200, textAlign: "left" }}>{h.amount}</span>
                </div>
              ))}
            </div>
            <div
              style={{
                fontFamily: `'${FONTS.serif}', serif`,
                fontSize: 56,
                color: COLORS.text,
                marginTop: 64,
                fontStyle: "italic",
              }}
            >
              $2 billion+ stolen.
            </div>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </CRTFilter>
  );
};
