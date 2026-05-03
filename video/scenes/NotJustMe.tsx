import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { CRTFilter } from "../components/CRTFilter";
import { COLORS, FONTS } from "../constants";

/**
 * 0:18 to 0:25 — Not just me.
 * "I'm not the only one. And this isn't the first time."
 *
 * Visual: faux Twitter screenshots scrolling, blurred to suggest scale.
 * For the placeholder version we just stack pseudo-tweets.
 */

const TWEETS = [
  {
    handle: "@degen_anon",
    body: "just woke up to a $50k drain. wallet wiped. on aave. cant be real",
  },
  {
    handle: "@onchainwatch",
    body: "another bridge exploit confirmed. lazarus signature all over it",
  },
  {
    handle: "@morningwhale",
    body: "lost 14 ETH overnight. didnt even click anything wrong. checking approvals now",
  },
  {
    handle: "@anonretail",
    body: "cant withdraw from aave. utilization at 100. this is bad",
  },
  {
    handle: "@cryptosleuth",
    body: "tracking the funds across 6 chains in real time. they were prepared for weeks",
  },
];

export const NotJustMe: React.FC = () => {
  const frame = useCurrentFrame();
  // Slow vertical scroll across the tweets stack
  const scrollY = interpolate(frame, [0, 420], [0, -260], { extrapolateRight: "clamp" });

  return (
    <CRTFilter intensity="medium" tint="amber" vignette grain>
      <AbsoluteFill style={{ background: "#0A0E13" }}>
        <div
          style={{
            position: "absolute",
            top: 100,
            left: "50%",
            transform: `translateX(-50%) translateY(${scrollY}px)`,
            width: 900,
            display: "flex",
            flexDirection: "column",
            gap: 28,
          }}
        >
          {TWEETS.map((t, i) => (
            <div
              key={i}
              style={{
                background: "#11161D",
                border: "1px solid #1F2730",
                borderRadius: 12,
                padding: "20px 24px",
                fontFamily: `'${FONTS.mono}', monospace`,
                color: COLORS.text,
              }}
            >
              <div style={{ color: COLORS.muted, fontSize: 18, marginBottom: 8 }}>{t.handle}</div>
              <div style={{ fontSize: 26, lineHeight: 1.4 }}>{t.body}</div>
            </div>
          ))}
        </div>

        {/* Overlay text after 3 seconds */}
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
            opacity: interpolate(frame, [120, 180], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            background: "linear-gradient(transparent 0%, rgba(10,14,19,0.85) 40%, rgba(10,14,19,0.95) 100%)",
          }}
        >
          <div
            style={{
              fontFamily: `'${FONTS.pixel}', monospace`,
              fontSize: 96,
              color: COLORS.umbraCyan,
              textAlign: "center",
              textShadow: "0 0 16px rgba(34,211,238,0.4)",
              marginTop: 360,
            }}
          >
            i'm not the only one.
          </div>
          <div
            style={{
              fontFamily: `'${FONTS.pixel}', monospace`,
              fontSize: 64,
              color: COLORS.muted,
              textAlign: "center",
              marginTop: 32,
              opacity: interpolate(frame, [240, 300], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            }}
          >
            this isn't the first time.
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </CRTFilter>
  );
};
