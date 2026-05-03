import React from "react";

/**
 * BunkerMode brand mark. SVG shield + wordmark with cyan→orange gradient.
 * Two layouts:
 *   variant="header"  shield + BUNKER MODE inline, ~48px tall
 *   variant="hero"    full lockup with tagline + v2 pill, ~96px tall
 */
export function Logo({ variant = "header" }: { variant?: "header" | "hero" }) {
  const shieldSize = variant === "hero" ? 96 : 44;
  return (
    <div className="flex items-center gap-3">
      <ShieldMark size={shieldSize} />
      <div className="flex flex-col leading-none">
        <div className={variant === "hero" ? "flex items-baseline gap-3" : "flex items-baseline gap-2"}>
          <span
            className={
              variant === "hero"
                ? "font-bold text-white tracking-wider text-5xl"
                : "font-bold text-white tracking-wider text-2xl"
            }
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            BUNKER
          </span>
          <span
            className={
              variant === "hero"
                ? "font-bold tracking-wider text-5xl bg-clip-text text-transparent"
                : "font-bold tracking-wider text-2xl bg-clip-text text-transparent"
            }
            style={{
              fontFamily: "'Inter', sans-serif",
              backgroundImage: "linear-gradient(90deg, #22d3ee 0%, #f97316 100%)",
              WebkitBackgroundClip: "text",
            }}
          >
            MODE
          </span>
        </div>
        {variant === "hero" && (
          <div className="flex items-center gap-3 mt-3">
            <span className="font-mono text-[11px] tracking-[0.3em] text-cyan-400/80">
              DEFI CRISIS RESPONSE LAYER
            </span>
            <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
              v2
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function ShieldMark({ size }: { size: number }) {
  const id = React.useId();
  return (
    <svg
      width={size}
      height={(size * 5) / 4}
      viewBox="0 0 64 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`grad-${id}`} x1="8" y1="6" x2="56" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="55%" stopColor="#22d3ee" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
      </defs>

      {/* Outer shield */}
      <path
        d="M32 4 L8 12 L8 40 C8 58 18 70 32 76 C46 70 56 58 56 40 L56 12 Z"
        stroke={`url(#grad-${id})`}
        strokeWidth="2.2"
        fill="none"
        strokeLinejoin="round"
      />
      {/* Inner shield (subtle inset) */}
      <path
        d="M32 11 L14 17 L14 39 C14 54 22 64 32 69 C42 64 50 54 50 39 L50 17 Z"
        stroke="#22d3ee"
        strokeOpacity="0.25"
        strokeWidth="1"
        fill="none"
        strokeLinejoin="round"
      />
      {/* B letter */}
      <text
        x="32"
        y="38"
        textAnchor="middle"
        fill="#22d3ee"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontWeight="700"
        fontSize="16"
      >
        B
      </text>
      {/* Status bars */}
      <rect x="18" y="46" width="28" height="3" rx="1" fill="#22d3ee" />
      <rect x="18" y="52" width="18" height="3" rx="1" fill="#22d3ee" opacity="0.7" />
    </svg>
  );
}
