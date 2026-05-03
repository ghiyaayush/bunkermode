import React from "react";
import { AbsoluteFill, Sequence, Img, useCurrentFrame, interpolate, staticFile, random } from "remotion";
import { BrollFrame } from "../components/BrollFrame";
import { UmbraTextBox } from "../components/UmbraTextBox";
import { CRTFilter } from "../components/CRTFilter";
import { COLORS, FONTS, FPS, BEATS } from "../constants";

/**
 * 19 micro-scenes, 80-second Umbra-style cut.
 * Each scene is a BrollFrame (image + Ken Burns + filter) with one
 * UmbraTextBox or pixel-typewriter overlay.
 */

// ─── 0. Intro stinger — BUNKERMODE glitches in cold ──────────────
const IntroStinger = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 4, 70, 88], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(frame, [0, 6, 14, 88], [1.6, 0.92, 1.04, 1.08], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const offset = frame < 14 ? (random(`int-${frame}`) - 0.5) * 16 : 0;

  // RGB shift on the entrance
  const rgbShift = interpolate(frame, [0, 14], [10, 0], { extrapolateRight: "clamp" });

  return (
    <CRTFilter intensity="heavy" tint="none" chromatic vignette grain glitch>
      <AbsoluteFill
        style={{
          background: "#000",
          alignItems: "center",
          justifyContent: "center",
          transform: `translate(${offset}px, ${offset}px)`,
        }}
      >
        <div style={{ position: "relative", opacity }}>
          <div
            style={{
              fontFamily: `'${FONTS.pixel}', monospace`,
              fontSize: 240,
              color: COLORS.accent,
              letterSpacing: "0.06em",
              textShadow: "0 0 40px rgba(16,185,129,0.9), 0 0 80px rgba(16,185,129,0.5)",
              transform: `scale(${scale})`,
              lineHeight: 1,
            }}
          >
            BUNKER<span style={{ color: COLORS.text }}>MODE</span>
          </div>
          {/* Red channel */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: rgbShift,
              fontFamily: `'${FONTS.pixel}', monospace`,
              fontSize: 240,
              color: "#ff0040",
              letterSpacing: "0.06em",
              opacity: 0.5,
              mixBlendMode: "screen",
              transform: `scale(${scale})`,
              lineHeight: 1,
              pointerEvents: "none",
            }}
          >
            BUNKERMODE
          </div>
          {/* Blue channel */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: -rgbShift,
              fontFamily: `'${FONTS.pixel}', monospace`,
              fontSize: 240,
              color: "#00d4ff",
              letterSpacing: "0.06em",
              opacity: 0.5,
              mixBlendMode: "screen",
              transform: `scale(${scale})`,
              lineHeight: 1,
              pointerEvents: "none",
            }}
          >
            BUNKERMODE
          </div>
        </div>
      </AbsoluteFill>
    </CRTFilter>
  );
};

// ─── 1. Aave dashboard, no overlay yet ──────────────────────────────
const Scene01 = () => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 240], [1.0, 1.08], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <CRTFilter intensity="medium" tint="none" chromatic vignette grain glitch>
        <AbsoluteFill style={{ transform: `scale(${scale})` }}>
          <Img
            src={staticFile("broll/aave-good-morning.png")}
            style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.95)" }}
          />
        </AbsoluteFill>
      </CRTFilter>
    </AbsoluteFill>
  );
};

// ─── 2. "drained." over the Aave morning screen ─────────────────────
const Scene02 = () => (
  <BrollFrame
    src="aave-good-morning.png"
    durationFrames={BEATS.s02_drained.duration}
    startScale={1.08}
    endScale={1.18}
    intensity="medium"
    tint="amber"
  >
    <UmbraTextBox
      text="drained"
      startFrame={6}
      fontSize={140}
      rotation={-1.4}
      position={{ left: "20%", top: "55%" }}
    />
  </BrollFrame>
);

// ─── 3. "$247,000." big on dark with metamask backdrop ──────────────
const Scene03 = () => (
  <BrollFrame
    src="metamask-zero.png"
    durationFrames={BEATS.s03_amount.duration}
    startScale={1.10}
    endScale={1.22}
    intensity="heavy"
    tint="amber"
    chromatic
  >
    <UmbraTextBox
      text="$247K"
      startFrame={4}
      fontSize={160}
      rotation={1.8}
      position={{ left: "18%", top: "30%" }}
    />
  </BrollFrame>
);

// ─── 4. "DPRK." over hacker mask, halftone ──────────────────────────
const Scene04 = () => (
  <BrollFrame
    src="masked-computer.jpg"
    durationFrames={BEATS.s04_dprk.duration}
    startScale={1.05}
    endScale={1.20}
    intensity="heavy"
    tint="phosphor"
    chromatic
    glitch
    brightness={0.85}
    halftone
  >
    <UmbraTextBox
      text="DPRK"
      startFrame={6}
      fontSize={180}
      rotation={-1.0}
      position={{ left: "22%", top: "65%" }}
    />
  </BrollFrame>
);

// ─── 5. "i'm not the only one." over code monitor ───────────────────
const Scene05 = () => (
  <BrollFrame
    src="text-monitor.jpg"
    durationFrames={BEATS.s05_notAlone.duration}
    startScale={1.05}
    endScale={1.15}
    intensity="medium"
    tint="phosphor"
    brightness={0.75}
  >
    <UmbraTextBox
      text="i'm not the only one"
      startFrame={6}
      fontSize={84}
      rotation={-1.2}
      position={{ left: "12%", top: "42%" }}
    />
  </BrollFrame>
);

// ─── 6. BYBIT $1.46B ────────────────────────────────────────────────
const HackBeat = ({ name, amount }: { name: string; amount: string }) => (
  <BrollFrame
    src="text-monitor.jpg"
    durationFrames={3 * FPS}
    startScale={1.10}
    endScale={1.22}
    intensity="heavy"
    tint="amber"
    brightness={0.55}
    chromatic
  >
    <UmbraTextBox
      text={name}
      startFrame={4}
      fontSize={120}
      rotation={-1.3}
      position={{ left: "12%", top: "32%" }}
    />
    <UmbraTextBox
      text={amount}
      startFrame={28}
      fontSize={140}
      rotation={1.5}
      position={{ left: "30%", top: "55%" }}
      colorBg={COLORS.danger}
      colorText="#ffffff"
    />
  </BrollFrame>
);

const Scene06 = () => <HackBeat name="BYBIT" amount="$1.46B" />;
const Scene07 = () => <HackBeat name="DRIFT" amount="$285M" />;
const Scene08 = () => <HackBeat name="KELP" amount="$292M" />;

// ─── 9. "$13B in cascade." ──────────────────────────────────────────
const Scene09 = () => (
  <BrollFrame
    src="text-monitor.jpg"
    durationFrames={BEATS.s09_cascade.duration}
    startScale={1.15}
    endScale={1.25}
    intensity="heavy"
    tint="amber"
    brightness={0.4}
    chromatic
    glitch
  >
    <UmbraTextBox
      text="$13B cascade"
      startFrame={6}
      fontSize={120}
      rotation={-1.5}
      position={{ left: "16%", top: "45%" }}
      colorBg={COLORS.critical}
      colorText="#ffffff"
    />
  </BrollFrame>
);

// ─── 10. "every time," ──────────────────────────────────────────────
const Scene10 = () => (
  <BrollFrame
    src="masked-computer.jpg"
    durationFrames={BEATS.s10_everyTime.duration}
    startScale={1.18}
    endScale={1.25}
    intensity="medium"
    tint="phosphor"
    brightness={0.7}
    halftone
  >
    <UmbraTextBox
      text="every time"
      startFrame={6}
      fontSize={120}
      rotation={1.3}
      position={{ left: "30%", top: "42%" }}
    />
  </BrollFrame>
);

// ─── 11. "someone was asleep." ──────────────────────────────────────
const Scene11 = () => (
  <BrollFrame
    src="laptop-mug.jpg"
    durationFrames={BEATS.s11_asleep.duration}
    startScale={1.05}
    endScale={1.18}
    intensity="medium"
    tint="amber"
    brightness={0.7}
  >
    <UmbraTextBox
      text="someone was asleep"
      startFrame={6}
      fontSize={104}
      rotation={-1.0}
      position={{ left: "10%", top: "65%" }}
    />
  </BrollFrame>
);

// ─── 12. "what if someone was watching?" pixel typewriter ───────────
const Scene12 = () => {
  const frame = useCurrentFrame();
  const text = "what if someone was watching?";
  const charsPerSec = 22;
  const visible = text.slice(0, Math.floor((frame / FPS) * charsPerSec));
  const cursorBlink = Math.floor(frame / 12) % 2 === 0;
  return (
    <BrollFrame
      src="network-rack.jpg"
      durationFrames={BEATS.s12_whatIf.duration}
      startScale={1.05}
      endScale={1.15}
      intensity="medium"
      tint="blue"
      brightness={0.75}
    >
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            background: "#fff",
            padding: "20px 36px",
            transform: "rotate(-0.6deg)",
            boxShadow: "6px 8px 0 rgba(0,0,0,0.18)",
            fontFamily: `'${FONTS.pixel}', monospace`,
            fontSize: 96,
            color: COLORS.boxText,
            fontWeight: 700,
            letterSpacing: "0.02em",
          }}
        >
          {visible}
          {cursorBlink && <span>|</span>}
        </div>
      </AbsoluteFill>
    </BrollFrame>
  );
};

// ─── 13. "while you sleep." ─────────────────────────────────────────
const Scene13 = () => (
  <BrollFrame
    src="network-rack.jpg"
    durationFrames={BEATS.s13_watching.duration}
    startScale={1.15}
    endScale={1.25}
    intensity="medium"
    tint="blue"
    brightness={0.7}
  >
    <UmbraTextBox
      text="while you sleep"
      startFrame={6}
      fontSize={130}
      rotation={1.2}
      position={{ left: "14%", top: "50%" }}
    />
  </BrollFrame>
);

// ─── 14. BUNKERMODE wordmark — punchy reveal + real product ────────
const Scene14 = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const scale = interpolate(
    frame,
    [0, 8, 14, 24, 240],
    [1.4, 0.92, 1.04, 1.0, 1.04],
    { extrapolateRight: "clamp" },
  );
  // Real product UI fades in behind the wordmark at 1.5s
  const productReveal = interpolate(frame, [90, 130, 240], [0, 0.45, 0.6], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const productScale = interpolate(frame, [90, 240], [1.06, 1.14], { extrapolateRight: "clamp" });
  const taglineOpacity = interpolate(frame, [60, 90], [0, 1], { extrapolateRight: "clamp" });
  const shake = frame < 12 ? (random(`shake-${frame}`) - 0.5) * 8 : 0;

  return (
    <CRTFilter intensity="heavy" tint="none" chromatic vignette grain glitch>
      <AbsoluteFill style={{ background: "#0A0E13", overflow: "hidden" }}>
        {/* Real product UI behind */}
        <AbsoluteFill
          style={{
            opacity: productReveal,
            transform: `scale(${productScale})`,
          }}
        >
          <Img
            src={staticFile("broll/bm-home.png")}
            style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(2px) brightness(0.7)" }}
          />
        </AbsoluteFill>
        {/* Wordmark + tagline overlay */}
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 24,
            transform: `translate(${shake}px, ${shake}px)`,
          }}
        >
          <div
            style={{
              opacity,
              transform: `scale(${scale})`,
              fontFamily: `'${FONTS.pixel}', monospace`,
              fontSize: 280,
              color: COLORS.accent,
              letterSpacing: "0.06em",
              textShadow: "0 0 48px rgba(16,185,129,0.9), 0 0 96px rgba(16,185,129,0.5)",
              lineHeight: 1,
            }}
          >
            BUNKER<span style={{ color: COLORS.text }}>MODE</span>
          </div>
          <div
            style={{
              opacity: taglineOpacity,
              fontFamily: `'${FONTS.mono}', monospace`,
              fontSize: 32,
              color: COLORS.muted,
              letterSpacing: "0.4em",
              marginTop: 24,
              background: "rgba(10,14,19,0.6)",
              padding: "8px 24px",
            }}
          >
            DEFI CRISIS RESPONSE
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </CRTFilter>
  );
};

// ═══════════════════════════════════════════════════════════════════
// PRODUCT SHOWCASE — 5 beats × 6s = 30s, inserted between scene 14 and 15
// ═══════════════════════════════════════════════════════════════════

// ─── P1: paste wallet ──────────────────────────────────────────────
const ScenePaste = () => (
  <BrollFrame
    src="bm-setup.png"
    durationFrames={BEATS.p1_pasteWallet.duration}
    startScale={1.05}
    endScale={1.18}
    intensity="subtle"
    tint="none"
    chromatic={false}
    brightness={0.92}
  >
    <UmbraTextBox
      text="paste your wallet"
      startFrame={6}
      fontSize={104}
      rotation={-1.2}
      position={{ left: "20%", top: "62%" }}
    />
    <UmbraTextBox
      text="that's the whole setup"
      startFrame={120}
      fontSize={48}
      rotation={1.0}
      position={{ left: "26%", top: "78%" }}
      colorBg={COLORS.accent}
      colorText="#0d2538"
    />
  </BrollFrame>
);

// ─── P2: contagion map ─────────────────────────────────────────────
const SceneContagion = () => (
  <BrollFrame
    src="contagion-map.png"
    durationFrames={BEATS.p2_contagionMap.duration}
    startScale={1.02}
    endScale={1.12}
    intensity="medium"
    tint="none"
    chromatic
    brightness={0.95}
  >
    <UmbraTextBox
      text="we map your contagion path"
      startFrame={6}
      fontSize={68}
      rotation={-1.0}
      position={{ left: "10%", top: "10%" }}
    />
    <UmbraTextBox
      text="every protocol every chain"
      startFrame={140}
      fontSize={40}
      rotation={1.0}
      position={{ left: "12%", top: "84%" }}
      colorBg={COLORS.umbraCyan}
      colorText="#0d2538"
    />
  </BrollFrame>
);

// ─── P3: watch everywhere — multi-feed mock ────────────────────────
const SceneWatch = () => {
  const frame = useCurrentFrame();
  const feeds = [
    { name: "FORTA",          color: COLORS.warn,      delay: 10 },
    { name: "HYPERNATIVE",    color: COLORS.warn,      delay: 22 },
    { name: "TWITTER",        color: COLORS.umbraCyan, delay: 36 },
    { name: "GOVERNANCE",     color: COLORS.accent,    delay: 50 },
    { name: "UTILIZATION",    color: COLORS.danger,    delay: 64 },
    { name: "TELEGRAM",       color: COLORS.umbraCyan, delay: 78 },
    { name: "ON-CHAIN",       color: COLORS.accent,    delay: 92 },
    { name: "FIRE-EYE INTEL", color: COLORS.warn,      delay: 106 },
  ];
  return (
    <CRTFilter intensity="medium" tint="none" chromatic vignette grain glitch>
      <AbsoluteFill style={{ background: "#0A0E13", padding: 80, alignItems: "center", justifyContent: "center" }}>
        <div style={{ marginBottom: 40, alignSelf: "flex-start" }}>
          <UmbraTextBox
            text="we watch everywhere"
            startFrame={0}
            fontSize={84}
            rotation={-0.8}
            position={{ left: "auto", top: "auto" }}
            punchOnEntry={false}
          />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 28,
            width: "85%",
            marginTop: 40,
          }}
        >
          {feeds.map((f, i) => {
            const opacity = interpolate(frame, [f.delay, f.delay + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const pulse = (Math.sin((frame - f.delay) / 8) + 1) * 0.5;
            return (
              <div
                key={i}
                style={{
                  opacity,
                  border: `2px solid ${f.color}`,
                  background: `${f.color}11`,
                  padding: "28px 24px",
                  fontFamily: `'${FONTS.mono}', monospace`,
                  fontSize: 32,
                  color: f.color,
                  letterSpacing: "0.18em",
                  textAlign: "center",
                  boxShadow: `0 0 ${10 + pulse * 20}px ${f.color}55`,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: f.color,
                    marginRight: 12,
                    verticalAlign: "middle",
                    opacity: 0.5 + pulse * 0.5,
                  }}
                />
                {f.name}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </CRTFilter>
  );
};

// ─── P4: KelpDAO replay (live demo) ────────────────────────────────
const SceneKelpReplay = () => {
  const frame = useCurrentFrame();
  const events = [
    { at: 12,  label: "[t+5s]",  text: "forta: bridge anomaly detected",      color: COLORS.warn },
    { at: 36,  label: "[t+12s]", text: "hypernative: dprk-attributed",         color: COLORS.danger },
    { at: 60,  label: "[t+22s]", text: "twitter: mass mention spike",          color: COLORS.umbraCyan },
    { at: 90,  label: "[t+30s]", text: "P9 classifier: BRIDGE_VERIFIER",       color: COLORS.danger },
    { at: 130, label: "[t+50s]", text: "P4 utilization > 85% - fast-track",    color: COLORS.critical },
    { at: 180, label: "[t+90s]", text: "T3 FIRE - withdraw to USDC on Base",   color: COLORS.accent },
  ];
  const tier = frame < 90 ? "T1" : frame < 130 ? "T2" : "T3";
  const tierColor = frame < 90 ? COLORS.warn : frame < 130 ? COLORS.warn : COLORS.critical;
  const flash = interpolate(frame, [180, 188, 220], [0, 0.55, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <CRTFilter intensity="subtle" tint="none" chromatic={false} vignette grain glitch>
      <AbsoluteFill style={{ background: "#000", padding: 50, flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div style={{ fontFamily: `'${FONTS.pixel}', monospace`, fontSize: 38, color: COLORS.accent, letterSpacing: "0.08em" }}>
            BUNKER<span style={{ color: COLORS.text }}>MODE</span>
            <span style={{ marginLeft: 24, fontSize: 22, color: COLORS.muted, letterSpacing: "0.3em" }}>/ KELPDAO REPLAY</span>
          </div>
          <div style={{ fontFamily: `'${FONTS.mono}', monospace`, fontSize: 24, color: COLORS.muted }}>
            <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: COLORS.accent, marginRight: 10 }} />
            LIVE
          </div>
        </div>
        <div style={{ display: "flex", gap: 40, marginBottom: 32 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: `'${FONTS.mono}', monospace`, fontSize: 20, color: COLORS.muted, letterSpacing: "0.4em", marginBottom: 12 }}>
              TIER
            </div>
            <div style={{ fontFamily: `'${FONTS.pixel}', monospace`, fontSize: 240, color: tierColor, textShadow: `0 0 30px ${tierColor}`, lineHeight: 0.9 }}>
              {tier}
            </div>
          </div>
          <div style={{ flex: 2 }}>
            <div style={{ fontFamily: `'${FONTS.mono}', monospace`, fontSize: 20, color: COLORS.muted, letterSpacing: "0.4em", marginBottom: 12 }}>
              SIGNAL FEED
            </div>
            <div style={{ fontFamily: `'${FONTS.mono}', monospace`, fontSize: 22, color: COLORS.text, display: "flex", flexDirection: "column", gap: 6 }}>
              {events.map((e, i) => {
                const opacity = interpolate(frame, [e.at, e.at + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                return (
                  <div key={i} style={{ opacity, display: "flex", gap: 16 }}>
                    <span style={{ color: COLORS.muted, width: 110 }}>{e.label}</span>
                    <span style={{ color: e.color, flex: 1 }}>{e.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div style={{ marginTop: "auto", marginBottom: 20, alignSelf: "center" }}>
          <UmbraTextBox
            text={frame < 180 ? "we replay your worst day" : "exit in 8 seconds"}
            startFrame={frame < 180 ? 0 : 180}
            fontSize={60}
            rotation={-0.6}
            position={{ left: "auto", top: "auto" }}
            colorBg={frame < 180 ? "#fff" : COLORS.accent}
            colorText="#0d2538"
            punchOnEntry={false}
          />
        </div>
        <AbsoluteFill style={{ background: COLORS.accent, opacity: flash, pointerEvents: "none" }} />
      </AbsoluteFill>
    </CRTFilter>
  );
};

// ─── P5: Telegram alert / take action ──────────────────────────────
const SceneTelegram = () => {
  const frame = useCurrentFrame();
  const msg1 = interpolate(frame, [10, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const msg2 = interpolate(frame, [80, 100], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const action = interpolate(frame, [160, 180], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tag = interpolate(frame, [240, 260], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const Bubble: React.FC<{ children: React.ReactNode; opacity: number; bg?: string; color?: string }> = ({ children, opacity, bg = "#1a2733", color = COLORS.text }) => (
    <div
      style={{
        opacity,
        background: bg,
        color,
        padding: "20px 28px",
        borderRadius: "20px 20px 20px 4px",
        fontFamily: `'${FONTS.mono}', monospace`,
        fontSize: 26,
        lineHeight: 1.5,
        maxWidth: 680,
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      }}
    >
      {children}
    </div>
  );

  return (
    <CRTFilter intensity="subtle" tint="blue" chromatic={false} vignette grain>
      <AbsoluteFill
        style={{
          background: "#0F1419",
          padding: 80,
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: 24,
        }}
      >
        <div
          style={{
            fontFamily: `'${FONTS.mono}', monospace`,
            fontSize: 22,
            color: COLORS.muted,
            letterSpacing: "0.3em",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: "50%", background: COLORS.accent }} />
          @bunkermode_bot · 03:47 IST
        </div>

        <Bubble opacity={msg1}>
          <span style={{ color: COLORS.warn }}>⚠ T2 ALERT</span>
          <br />
          Bridge anomaly detected on KelpDAO LayerZero verifier.
          <br />
          DPRK-attributed. Confidence: 0.93.
        </Bubble>

        <Bubble opacity={msg2}>
          <span style={{ color: COLORS.critical }}>🚨 T3 FIRE</span>
          <br />
          Aave WETH utilization crossed 85%.
          <br />
          Auto-firing exit per your policy. Stand by.
        </Bubble>

        <Bubble opacity={action} bg={COLORS.accent} color="#0d2538">
          <span style={{ fontWeight: 700 }}>✓ EXIT COMPLETE</span>
          <br />
          $247K → USDC on Base via CCTP.
          <br />
          Fee: $12.34 gas + $2.50 x402.
          <br />
          Tx: 0xa3f...de91
        </Bubble>

        <div style={{ position: "absolute", bottom: 80, right: 80, opacity: tag }}>
          <UmbraTextBox
            text="we ping you or we act"
            startFrame={0}
            fontSize={56}
            rotation={-1.0}
            position={{ left: "auto", top: "auto" }}
            colorBg={COLORS.boxBg}
            colorText="#0d2538"
            punchOnEntry={false}
          />
        </div>
      </AbsoluteFill>
    </CRTFilter>
  );
};

// ─── 15. "it sees the drain." over real Re-entry UI ────────────────
const Scene15 = () => (
  <BrollFrame
    src="bm-reentry.png"
    durationFrames={BEATS.s15_sees.duration}
    startScale={1.05}
    endScale={1.18}
    intensity="subtle"
    tint="none"
    brightness={0.85}
    chromatic={false}
  >
    <UmbraTextBox
      text="it sees the drain"
      startFrame={6}
      fontSize={104}
      rotation={-1.0}
      position={{ left: "16%", top: "45%" }}
    />
    <UmbraTextBox
      text="before the price moves"
      startFrame={50}
      fontSize={56}
      rotation={1.0}
      position={{ left: "20%", top: "62%" }}
    />
  </BrollFrame>
);

// ─── 16. "fires before the cascade." with INLINE BunkerMode Monitor ─
const Scene16 = () => {
  const frame = useCurrentFrame();
  // Tier escalation: T1 → T2 → T3 over 4 seconds
  const tier = frame < 60 ? "T1" : frame < 130 ? "T2" : "T3";
  const tierColor =
    frame < 60 ? COLORS.warn : frame < 130 ? COLORS.warn : COLORS.critical;
  const utilization = interpolate(frame, [0, 60, 130, 200], [0.65, 0.78, 0.92, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const flash = interpolate(frame, [130, 138, 165], [0, 0.55, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <CRTFilter intensity="subtle" tint="none" chromatic={false} vignette grain glitch>
      <AbsoluteFill style={{ background: "#000", padding: 60 }}>
        {/* Mock BunkerMode Monitor screen */}
        <div
          style={{
            background: COLORS.bg,
            border: `2px solid ${COLORS.muted}`,
            padding: 40,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 32,
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div
              style={{
                fontFamily: `'${FONTS.pixel}', monospace`,
                fontSize: 52,
                color: COLORS.accent,
                letterSpacing: "0.08em",
              }}
            >
              BUNKER<span style={{ color: COLORS.text }}>MODE</span>
            </div>
            <div
              style={{
                fontFamily: `'${FONTS.mono}', monospace`,
                fontSize: 24,
                color: COLORS.muted,
                letterSpacing: "0.3em",
              }}
            >
              MONITOR / LIVE
            </div>
          </div>

          {/* Tier indicator + utilization */}
          <div style={{ display: "flex", gap: 40, flex: 1 }}>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: `'${FONTS.mono}', monospace`,
                  fontSize: 22,
                  color: COLORS.muted,
                  letterSpacing: "0.4em",
                  marginBottom: 16,
                }}
              >
                CURRENT TIER
              </div>
              <div
                style={{
                  fontFamily: `'${FONTS.pixel}', monospace`,
                  fontSize: 320,
                  color: tierColor,
                  textShadow: `0 0 40px ${tierColor}`,
                  lineHeight: 0.9,
                }}
              >
                {tier}
              </div>
              <div
                style={{
                  fontFamily: `'${FONTS.mono}', monospace`,
                  fontSize: 26,
                  color: tierColor,
                  marginTop: 20,
                  letterSpacing: "0.2em",
                }}
              >
                {tier === "T1" && "single-source signal"}
                {tier === "T2" && "two sources corroborated"}
                {tier === "T3" && "AUTO-FIRE — exit in progress"}
              </div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div
                style={{
                  fontFamily: `'${FONTS.mono}', monospace`,
                  fontSize: 22,
                  color: COLORS.muted,
                  letterSpacing: "0.4em",
                  marginBottom: 16,
                }}
              >
                AAVE WETH UTILIZATION
              </div>
              <div
                style={{
                  height: 52,
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
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: "85%",
                    top: -6,
                    bottom: -6,
                    width: 3,
                    background: COLORS.text,
                  }}
                />
              </div>
              <div
                style={{
                  fontFamily: `'${FONTS.pixel}', monospace`,
                  fontSize: 100,
                  color: utilization > 0.85 ? COLORS.critical : COLORS.text,
                  marginTop: 16,
                }}
              >
                {(utilization * 100).toFixed(1)}%
              </div>
              <div
                style={{
                  fontFamily: `'${FONTS.mono}', monospace`,
                  fontSize: 22,
                  color: COLORS.muted,
                  marginTop: 8,
                  letterSpacing: "0.1em",
                }}
              >
                85% = last exit ramp / 100% = locked
              </div>
            </div>
          </div>

          {/* Signal log */}
          <div
            style={{
              fontFamily: `'${FONTS.mono}', monospace`,
              fontSize: 24,
              color: COLORS.muted,
              borderTop: `1px solid ${COLORS.muted}`,
              paddingTop: 20,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ opacity: frame > 20 ? 1 : 0 }}>
              <span style={{ color: COLORS.warn }}>[t+5s]</span> forta: bridge anomaly detected
            </div>
            <div style={{ opacity: frame > 60 ? 1 : 0 }}>
              <span style={{ color: COLORS.warn }}>[t+12s]</span> hypernative: dprk-attributed
            </div>
            <div style={{ opacity: frame > 130 ? 1 : 0, color: COLORS.critical }}>
              <span>[t+90s]</span> T3 FIRE — withdraw → bridge usdc → done
            </div>
          </div>
        </div>

        {/* Flash overlay */}
        <AbsoluteFill
          style={{ background: COLORS.accent, opacity: flash, pointerEvents: "none" }}
        />
      </AbsoluteFill>
    </CRTFilter>
  );
};

// ─── 17. "or refuses." (Module B) — halftone ────────────────────────
const Scene17 = () => (
  <BrollFrame
    src="masked-computer.jpg"
    durationFrames={BEATS.s17_orRefuses.duration}
    startScale={1.10}
    endScale={1.22}
    intensity="heavy"
    tint="amber"
    brightness={0.65}
    chromatic
    glitch
    halftone
  >
    <UmbraTextBox
      text="or refuses"
      startFrame={6}
      fontSize={140}
      rotation={-1.3}
      position={{ left: "18%", top: "30%" }}
      colorBg={COLORS.critical}
      colorText="#fff"
    />
    <UmbraTextBox
      text="if your screen is lying"
      startFrame={60}
      fontSize={64}
      rotation={1.2}
      position={{ left: "20%", top: "60%" }}
    />
  </BrollFrame>
);

// ─── 18. "they were fine." over Aave morning screen ─────────────────
const Scene18 = () => (
  <BrollFrame
    src="aave-good-morning.png"
    durationFrames={BEATS.s18_theyWereFine.duration}
    startScale={1.05}
    endScale={1.15}
    intensity="subtle"
    tint="none"
    chromatic={false}
    glitch={false}
  >
    <UmbraTextBox
      text="they woke up at 8 AM"
      startFrame={6}
      fontSize={68}
      rotation={-0.8}
      position={{ left: "14%", top: "30%" }}
    />
    <UmbraTextBox
      text="they were fine"
      startFrame={90}
      fontSize={120}
      rotation={1.4}
      position={{ left: "20%", top: "55%" }}
      colorBg={COLORS.accent}
      colorText="#0d2538"
    />
  </BrollFrame>
);

// ─── 19. Tagline + brand on clouds ──────────────────────────────────
const Scene19 = () => {
  const frame = useCurrentFrame();
  const line1 = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });
  const line2 = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: "clamp" });
  const brand = interpolate(frame, [140, 170], [0, 1], { extrapolateRight: "clamp" });
  const url = interpolate(frame, [220, 250], [0, 1], { extrapolateRight: "clamp" });
  const scale = interpolate(frame, [0, 420], [1.0, 1.10], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <CRTFilter intensity="subtle" tint="none" chromatic={false} vignette grain={false} glitch={false}>
        <AbsoluteFill style={{ transform: `scale(${scale})` }}>
          <Img
            src={staticFile("broll/clouds.jpg")}
            style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.95) saturate(0.9)" }}
          />
        </AbsoluteFill>
      </CRTFilter>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div
          style={{
            opacity: line1,
            fontFamily: `'${FONTS.serif}', serif`,
            fontSize: 88,
            color: "rgba(13,37,56,0.85)",
            fontWeight: 600,
            textShadow: "0 2px 12px rgba(255,255,255,0.6)",
          }}
        >
          DeFi doesn't sleep
        </div>
        <div
          style={{
            opacity: line2,
            fontFamily: `'${FONTS.serif}', serif`,
            fontSize: 110,
            color: "#0d2538",
            fontWeight: 700,
            textShadow: "0 2px 12px rgba(255,255,255,0.6)",
          }}
        >
          Neither do we
        </div>
        <div
          style={{
            opacity: brand,
            marginTop: 60,
            fontFamily: `'${FONTS.pixel}', monospace`,
            fontSize: 120,
            color: COLORS.text,
            letterSpacing: "0.05em",
            background: "rgba(13,37,56,0.92)",
            padding: "12px 36px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          BUNKER<span style={{ color: COLORS.accent }}>MODE</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Export the full sequenced cut ──────────────────────────────────
export const UmbraCut: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Sequence from={BEATS.s00_introStinger.start} durationInFrames={BEATS.s00_introStinger.duration}><IntroStinger /></Sequence>
    <Sequence from={BEATS.s01_aaveMorning.start} durationInFrames={BEATS.s01_aaveMorning.duration}><Scene01 /></Sequence>
    <Sequence from={BEATS.s02_drained.start} durationInFrames={BEATS.s02_drained.duration}><Scene02 /></Sequence>
    <Sequence from={BEATS.s03_amount.start} durationInFrames={BEATS.s03_amount.duration}><Scene03 /></Sequence>
    <Sequence from={BEATS.s04_dprk.start} durationInFrames={BEATS.s04_dprk.duration}><Scene04 /></Sequence>
    <Sequence from={BEATS.s05_notAlone.start} durationInFrames={BEATS.s05_notAlone.duration}><Scene05 /></Sequence>
    <Sequence from={BEATS.s06_bybit.start} durationInFrames={BEATS.s06_bybit.duration}><Scene06 /></Sequence>
    <Sequence from={BEATS.s07_drift.start} durationInFrames={BEATS.s07_drift.duration}><Scene07 /></Sequence>
    <Sequence from={BEATS.s08_kelp.start} durationInFrames={BEATS.s08_kelp.duration}><Scene08 /></Sequence>
    <Sequence from={BEATS.s09_cascade.start} durationInFrames={BEATS.s09_cascade.duration}><Scene09 /></Sequence>
    <Sequence from={BEATS.s10_everyTime.start} durationInFrames={BEATS.s10_everyTime.duration}><Scene10 /></Sequence>
    <Sequence from={BEATS.s11_asleep.start} durationInFrames={BEATS.s11_asleep.duration}><Scene11 /></Sequence>
    <Sequence from={BEATS.s12_whatIf.start} durationInFrames={BEATS.s12_whatIf.duration}><Scene12 /></Sequence>
    <Sequence from={BEATS.s13_watching.start} durationInFrames={BEATS.s13_watching.duration}><Scene13 /></Sequence>
    <Sequence from={BEATS.s14_bunkermode.start} durationInFrames={BEATS.s14_bunkermode.duration}><Scene14 /></Sequence>
    <Sequence from={BEATS.p1_pasteWallet.start} durationInFrames={BEATS.p1_pasteWallet.duration}><ScenePaste /></Sequence>
    <Sequence from={BEATS.p2_contagionMap.start} durationInFrames={BEATS.p2_contagionMap.duration}><SceneContagion /></Sequence>
    <Sequence from={BEATS.p3_watchEverywhere.start} durationInFrames={BEATS.p3_watchEverywhere.duration}><SceneWatch /></Sequence>
    <Sequence from={BEATS.p4_kelpReplay.start} durationInFrames={BEATS.p4_kelpReplay.duration}><SceneKelpReplay /></Sequence>
    <Sequence from={BEATS.p5_telegramOrAct.start} durationInFrames={BEATS.p5_telegramOrAct.duration}><SceneTelegram /></Sequence>
    <Sequence from={BEATS.s15_sees.start} durationInFrames={BEATS.s15_sees.duration}><Scene15 /></Sequence>
    <Sequence from={BEATS.s16_fires.start} durationInFrames={BEATS.s16_fires.duration}><Scene16 /></Sequence>
    <Sequence from={BEATS.s17_orRefuses.start} durationInFrames={BEATS.s17_orRefuses.duration}><Scene17 /></Sequence>
    <Sequence from={BEATS.s18_theyWereFine.start} durationInFrames={BEATS.s18_theyWereFine.duration}><Scene18 /></Sequence>
    <Sequence from={BEATS.s19_taglineBrand.start} durationInFrames={BEATS.s19_taglineBrand.duration}><Scene19 /></Sequence>
  </AbsoluteFill>
);
