import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../constants";

/**
 * Pixel/typewriter text reveal. Characters appear one at a time with a
 * subtle blink effect on the trailing cursor.
 */

interface PixelTextProps {
  children: string;
  startFrame?: number;
  charsPerSecond?: number;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  showCursor?: boolean;
  style?: React.CSSProperties;
}

export const PixelText: React.FC<PixelTextProps> = ({
  children,
  startFrame = 0,
  charsPerSecond = 18,
  fontSize = 64,
  color = COLORS.umbraCyan,
  fontFamily = FONTS.pixel,
  showCursor = true,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = Math.max(0, frame - startFrame);
  const charsToShow = Math.floor((localFrame / fps) * charsPerSecond);
  const visible = children.slice(0, Math.min(charsToShow, children.length));
  const isTyping = visible.length < children.length;
  const cursorBlink = Math.floor(localFrame / 15) % 2 === 0;

  return (
    <div
      style={{
        fontFamily: `'${fontFamily}', monospace`,
        fontSize,
        color,
        letterSpacing: "0.02em",
        whiteSpace: "pre-wrap",
        ...style,
      }}
    >
      {visible}
      {showCursor && (cursorBlink || isTyping) && (
        <span style={{ opacity: cursorBlink ? 1 : 0 }}>▋</span>
      )}
    </div>
  );
};

/**
 * Spring-animated entrance text. Used for hard cuts on dramatic beats.
 */
interface DropInTextProps {
  children: React.ReactNode;
  startFrame?: number;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  style?: React.CSSProperties;
}

export const DropInText: React.FC<DropInTextProps> = ({
  children,
  startFrame = 0,
  fontSize = 96,
  color = COLORS.text,
  fontFamily = FONTS.serif,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;
  const opacity = interpolate(localFrame, [0, 8], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const y = spring({
    frame: localFrame,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  return (
    <div
      style={{
        fontFamily: `'${fontFamily}', serif`,
        fontSize,
        color,
        opacity,
        transform: `translateY(${(1 - y) * 12}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
