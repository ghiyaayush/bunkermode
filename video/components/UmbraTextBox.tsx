import React from "react";
import { useCurrentFrame, interpolate, random } from "remotion";
import { FONTS } from "../constants";

/**
 * Umbra's signature visual element — a white rectangular text box
 * floating over B-roll, with monospace dark text inside it.
 *
 * The Umbra video uses these for almost every text reveal. The text
 * appears with a subtle scramble/punch-in, the box has a tiny rotation,
 * and there's a soft drop shadow.
 */

export interface UmbraTextBoxProps {
  text: string;
  startFrame?: number;
  fontSize?: number;
  rotation?: number;
  colorBg?: string;
  colorText?: string;
  position?: { left?: string | number; top?: string | number; right?: string | number; bottom?: string | number };
  width?: string | number;
  punchOnEntry?: boolean;
  cursor?: boolean;
  fontFamily?: string;
}

const SCRAMBLE_CHARS = "!<>-_\\/[]{}—=+*^?#@$%&|~01";

export const UmbraTextBox: React.FC<UmbraTextBoxProps> = ({
  text,
  startFrame = 0,
  fontSize = 64,
  rotation = -1.2,
  colorBg = "#ffffff",
  colorText = "#0d2538",
  position,
  width = "auto",
  punchOnEntry = true,
  cursor = false,
  fontFamily = FONTS.pixel,
}) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;

  // Punch-in animation
  const scale = punchOnEntry
    ? interpolate(local, [0, 6, 10], [1.08, 0.97, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 1;
  const opacity = interpolate(local, [0, 4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Scramble effect for first ~10 frames
  const renderText = () => {
    if (local >= 14) return text;
    if (local < 4) return "";
    const showRatio = (local - 4) / 10;
    return text
      .split("")
      .map((c, i) => {
        if (c === " ") return " ";
        const charProgress = showRatio - i / text.length;
        if (charProgress < 0) return " ";
        if (charProgress < 0.3) {
          const idx = Math.floor(random(`s-${i}-${frame}`) * SCRAMBLE_CHARS.length);
          return SCRAMBLE_CHARS[idx];
        }
        return c;
      })
      .join("");
  };

  const cursorBlink = cursor ? Math.floor(local / 12) % 2 === 0 : false;

  return (
    <div
      style={{
        position: "absolute",
        ...position,
        opacity,
        transform: `rotate(${rotation}deg) scale(${scale})`,
        background: colorBg,
        padding: "16px 32px",
        boxShadow: "6px 8px 0 rgba(0,0,0,0.18), 0 4px 24px rgba(0,0,0,0.25)",
        width,
        whiteSpace: "nowrap",
      }}
    >
      <div
        style={{
          fontFamily: `'${fontFamily}', monospace`,
          fontSize,
          color: colorText,
          fontWeight: 700,
          letterSpacing: "0.02em",
          lineHeight: 1.05,
        }}
      >
        {renderText()}
        {cursor && cursorBlink && local >= 14 && (
          <span style={{ opacity: 0.85 }}>|</span>
        )}
      </div>
    </div>
  );
};
