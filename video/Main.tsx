import React from "react";
import { AbsoluteFill, Sequence, Audio, staticFile, useCurrentFrame } from "remotion";
import { BEATS, FPS, COLORS } from "./constants";
import { UmbraCut } from "./scenes/UmbraCut";

/**
 * Hard-cut transition flashes on every scene boundary.
 */
const TransitionFlashes: React.FC = () => {
  const frame = useCurrentFrame();
  const beatStarts = Object.values(BEATS).map((b) => b.start);
  const isFlash = beatStarts.some(
    (start) => start > 0 && frame >= start && frame < start + 2,
  );
  return isFlash ? (
    <AbsoluteFill style={{ background: "#ffffff", opacity: 0.85, pointerEvents: "none" }} />
  ) : null;
};

// Typewriter clicks for every text reveal — synced to scene starts
const TYPEWRITER_BEATS: number[] = [];
const buildTypewriter = (start: number, count: number, spacing: number) => {
  for (let i = 0; i < count; i++) TYPEWRITER_BEATS.push(start + i * spacing);
};
// Build clicks for the major text reveals
buildTypewriter(BEATS.s02_drained.start + 8, 7, 3);
buildTypewriter(BEATS.s03_amount.start + 6, 6, 3);
buildTypewriter(BEATS.s04_dprk.start + 8, 4, 3);
buildTypewriter(BEATS.s05_notAlone.start + 8, 18, 2);
buildTypewriter(BEATS.s09_cascade.start + 8, 13, 3);
buildTypewriter(BEATS.s10_everyTime.start + 8, 10, 3);
buildTypewriter(BEATS.s11_asleep.start + 8, 17, 3);
buildTypewriter(BEATS.s12_whatIf.start + 8, 27, 2);
buildTypewriter(BEATS.s13_watching.start + 8, 16, 3);
buildTypewriter(BEATS.p1_pasteWallet.start + 8, 17, 3);
buildTypewriter(BEATS.p2_contagionMap.start + 8, 26, 3);
buildTypewriter(BEATS.p3_watchEverywhere.start + 4, 19, 3);
buildTypewriter(BEATS.p5_telegramOrAct.start + 14, 60, 1);

// SFX hits — punchier with drops at climactic moments
const SFX_HITS = [
  // Intro stinger
  { src: "thud.mp3", at: BEATS.s00_introStinger.start + 4, vol: 0.7 },
  { src: "glitch.mp3", at: BEATS.s00_introStinger.start + 4, vol: 0.5 },

  // Story beats
  { src: "thud.mp3", at: BEATS.s02_drained.start + 6, vol: 0.45 },
  { src: "thud.mp3", at: BEATS.s03_amount.start + 4, vol: 0.6 },
  { src: "thud.mp3", at: BEATS.s04_dprk.start + 6, vol: 0.55 },
  { src: "whoosh.mp3", at: BEATS.s05_notAlone.start, vol: 0.35 },

  // Hack history rapid hits
  { src: "thud.mp3", at: BEATS.s06_bybit.start + 28, vol: 0.5 },
  { src: "thud.mp3", at: BEATS.s07_drift.start + 28, vol: 0.5 },
  { src: "thud.mp3", at: BEATS.s08_kelp.start + 28, vol: 0.55 },

  // CASCADE DROP — first big drop
  { src: "riser.mp3", at: BEATS.s09_cascade.start - 60, vol: 0.45 },
  { src: "drop.mp3", at: BEATS.s09_cascade.start + 4, vol: 0.7 },
  { src: "glitch.mp3", at: BEATS.s09_cascade.start + 4, vol: 0.5 },

  { src: "whoosh.mp3", at: BEATS.s12_whatIf.start, vol: 0.4 },

  // BUNKERMODE BRAND DROP — second big drop
  { src: "riser.mp3", at: BEATS.s14_bunkermode.start - 70, vol: 0.5 },
  { src: "drop.mp3", at: BEATS.s14_bunkermode.start, vol: 0.85 },
  { src: "thud.mp3", at: BEATS.s14_bunkermode.start, vol: 0.6 },

  // Product showcase beats
  { src: "click.mp3", at: BEATS.p1_pasteWallet.start + 6, vol: 0.45 },
  { src: "whoosh.mp3", at: BEATS.p2_contagionMap.start, vol: 0.4 },
  { src: "whoosh.mp3", at: BEATS.p3_watchEverywhere.start, vol: 0.4 },

  // T3 FIRE DROP — third big drop (climactic)
  { src: "riser.mp3", at: BEATS.p4_kelpReplay.start + 120, vol: 0.55 },
  { src: "drop.mp3", at: BEATS.p4_kelpReplay.start + 180, vol: 0.95 },
  { src: "glitch.mp3", at: BEATS.p4_kelpReplay.start + 180, vol: 0.5 },
  { src: "thud.mp3", at: BEATS.p4_kelpReplay.start + 180, vol: 0.7 },

  // Telegram chat
  { src: "click.mp3", at: BEATS.p5_telegramOrAct.start + 12, vol: 0.4 },
  { src: "click.mp3", at: BEATS.p5_telegramOrAct.start + 82, vol: 0.4 },
  { src: "thud.mp3", at: BEATS.p5_telegramOrAct.start + 162, vol: 0.55 },

  // Inline monitor T3 fire
  { src: "glitch.mp3", at: BEATS.s16_fires.start + 120, vol: 0.5 },
  { src: "thud.mp3", at: BEATS.s16_fires.start + 120, vol: 0.7 },

  // Final tagline
  { src: "whoosh.mp3", at: BEATS.s19_taglineBrand.start, vol: 0.4 },
  { src: "thud.mp3", at: BEATS.s19_taglineBrand.start + 140, vol: 0.5 },
];

export const Main: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* Background music — slightly louder during build, quieter during product showcase */}
      <Audio src={staticFile("music.mp3")} volume={0.65} />
      {SFX_HITS.map((h, i) => (
        <Sequence key={i} from={h.at} durationInFrames={Math.ceil(2.5 * FPS)}>
          <Audio src={staticFile(h.src)} volume={h.vol} />
        </Sequence>
      ))}
      {/* Typewriter clicks on text reveals */}
      {TYPEWRITER_BEATS.map((at, i) => (
        <Sequence key={`tw-${i}`} from={at} durationInFrames={6}>
          <Audio src={staticFile("click.mp3")} volume={0.18} />
        </Sequence>
      ))}
      <UmbraCut />
      <TransitionFlashes />
    </AbsoluteFill>
  );
};
