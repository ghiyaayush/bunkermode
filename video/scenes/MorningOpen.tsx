import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { CRTFilter } from "../components/CRTFilter";
import { COLORS, FONTS } from "../constants";

/**
 * 0:00 to 0:18 — The morning.
 * "It was 7 AM. I checked my positions. My wallet was empty.
 *  Two hundred and forty-seven thousand dollars. Gone overnight.
 *  To a hacker in North Korea I'll never see."
 *
 * Visual: black, slow fade up on a clock at 7:00 AM. Then the wallet
 * UI flashes in showing $0.00. Then the $247K number burns in red.
 */
export const MorningOpen: React.FC = () => {
  const frame = useCurrentFrame();

  const clockOpacity = interpolate(frame, [0, 60, 240, 280], [0, 1, 1, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const walletOpacity = interpolate(frame, [280, 340, 540, 580], [0, 1, 1, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const lossOpacity = interpolate(frame, [580, 640, 1020, 1080], [0, 1, 1, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  return (
    <CRTFilter intensity="heavy" tint="amber" chromatic vignette grain>
      <AbsoluteFill
        style={{
          background: "#0A0E13",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* 7:00 AM clock */}
        <div
          style={{
            opacity: clockOpacity,
            position: "absolute",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: `'${FONTS.pixel}', monospace`,
              fontSize: 280,
              color: COLORS.text,
              letterSpacing: "0.05em",
              textShadow: "0 0 12px rgba(229,233,240,0.4)",
            }}
          >
            7:00
          </div>
          <div
            style={{
              fontFamily: `'${FONTS.pixel}', monospace`,
              fontSize: 60,
              color: COLORS.muted,
              letterSpacing: "0.4em",
            }}
          >
            AM
          </div>
        </div>

        {/* Wallet $0.00 */}
        <div
          style={{
            opacity: walletOpacity,
            position: "absolute",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: `'${FONTS.mono}', monospace`,
              fontSize: 36,
              color: COLORS.muted,
              letterSpacing: "0.2em",
              marginBottom: 24,
            }}
          >
            WALLET BALANCE
          </div>
          <div
            style={{
              fontFamily: `'${FONTS.pixel}', monospace`,
              fontSize: 200,
              color: COLORS.danger,
              textShadow: "0 0 24px rgba(239,68,68,0.6)",
            }}
          >
            $0.00
          </div>
        </div>

        {/* Loss reveal */}
        <div
          style={{
            opacity: lossOpacity,
            position: "absolute",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: `'${FONTS.mono}', monospace`,
              fontSize: 28,
              color: COLORS.muted,
              letterSpacing: "0.3em",
              marginBottom: 32,
            }}
          >
            STOLEN OVERNIGHT
          </div>
          <div
            style={{
              fontFamily: `'${FONTS.pixel}', monospace`,
              fontSize: 240,
              color: COLORS.critical,
              textShadow: "0 0 32px rgba(220,38,38,0.55)",
            }}
          >
            $247,000
          </div>
          <div
            style={{
              fontFamily: `'${FONTS.mono}', monospace`,
              fontSize: 32,
              color: COLORS.muted,
              letterSpacing: "0.2em",
              marginTop: 32,
            }}
          >
            DESTINATION: DPRK
          </div>
        </div>
      </AbsoluteFill>
    </CRTFilter>
  );
};
