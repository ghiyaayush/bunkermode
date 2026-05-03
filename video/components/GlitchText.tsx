import React from "react";
import { interpolate, useCurrentFrame, random } from "remotion";

/**
 * Glitch text reveal — characters scramble through random chars
 * before resolving to the final text. Closer to the Umbra typewriter
 * with RGB shift on entrance.
 */

interface GlitchTextProps {
  text: string;
  startFrame?: number;
  charDelayFrames?: number;
  scrambleFrames?: number;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  rgbShift?: boolean;
  style?: React.CSSProperties;
}

const SCRAMBLE_CHARS = "!<>-_\\/[]{}—=+*^?#@$%&|~";

export const GlitchText: React.FC<GlitchTextProps> = ({
  text,
  startFrame = 0,
  charDelayFrames = 2,
  scrambleFrames = 8,
  fontSize = 64,
  color = "#22d3ee",
  fontFamily = "VT323",
  rgbShift = true,
  style,
}) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;

  const renderChars = text.split("").map((targetChar, i) => {
    const charStart = i * charDelayFrames;
    const charEnd = charStart + scrambleFrames;
    if (local < charStart) return " ";
    if (local >= charEnd) return targetChar;
    // Mid-scramble: random character per frame
    if (targetChar === " ") return " ";
    const idx = Math.floor(random(`gc-${i}-${local}`) * SCRAMBLE_CHARS.length);
    return SCRAMBLE_CHARS[idx];
  });

  const visible = renderChars.join("");
  const baseStyle: React.CSSProperties = {
    fontFamily: `'${fontFamily}', monospace`,
    fontSize,
    color,
    letterSpacing: "0.02em",
    whiteSpace: "pre-wrap",
    ...style,
  };

  if (!rgbShift) {
    return <div style={baseStyle}>{visible}</div>;
  }

  // RGB shift overlay during scramble + first 24 frames after
  const shiftActive = local < text.length * charDelayFrames + 24;
  const shiftAmount = shiftActive ? interpolate(local, [0, text.length * charDelayFrames + 24], [3, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <div style={baseStyle}>{visible}</div>
      {shiftActive && (
        <>
          <div
            style={{
              ...baseStyle,
              color: "#ff0040",
              position: "absolute",
              top: 0,
              left: shiftAmount,
              opacity: 0.6,
              mixBlendMode: "screen",
            }}
          >
            {visible}
          </div>
          <div
            style={{
              ...baseStyle,
              color: "#00d4ff",
              position: "absolute",
              top: 0,
              left: -shiftAmount,
              opacity: 0.6,
              mixBlendMode: "screen",
            }}
          >
            {visible}
          </div>
        </>
      )}
    </div>
  );
};
