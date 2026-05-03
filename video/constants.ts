/**
 * Final video constants — with intro stinger.
 * 1:48 total at 60fps.
 */

export const FPS = 60;
export const WIDTH = 1920;
export const HEIGHT = 1080;

const INTRO = 90; // 1.5 seconds

export const BEATS = {
  s00_introStinger:   { start: 0,                  duration: INTRO },          // 0:00 - 0:01.5

  s01_aaveMorning:    { start: INTRO + 0,          duration: 4 * FPS },        // 0:01.5 - 0:05.5
  s02_drained:        { start: INTRO + 240,        duration: 4 * FPS },
  s03_amount:         { start: INTRO + 480,        duration: 4 * FPS },
  s04_dprk:           { start: INTRO + 720,        duration: 4 * FPS },
  s05_notAlone:       { start: INTRO + 960,        duration: 4 * FPS },
  s06_bybit:          { start: INTRO + 1200,       duration: 3 * FPS },
  s07_drift:          { start: INTRO + 1380,       duration: 3 * FPS },
  s08_kelp:           { start: INTRO + 1560,       duration: 3 * FPS },
  s09_cascade:        { start: INTRO + 1740,       duration: 4 * FPS },
  s10_everyTime:      { start: INTRO + 1980,       duration: 3 * FPS },
  s11_asleep:         { start: INTRO + 2160,       duration: 4 * FPS },
  s12_whatIf:         { start: INTRO + 2400,       duration: 4 * FPS },
  s13_watching:       { start: INTRO + 2640,       duration: 4 * FPS },
  s14_bunkermode:     { start: INTRO + 2880,       duration: 4 * FPS },

  p1_pasteWallet:     { start: INTRO + 3120,       duration: 6 * FPS },
  p2_contagionMap:    { start: INTRO + 3480,       duration: 6 * FPS },
  p3_watchEverywhere: { start: INTRO + 3840,       duration: 6 * FPS },
  p4_kelpReplay:      { start: INTRO + 4200,       duration: 6 * FPS },
  p5_telegramOrAct:   { start: INTRO + 4560,       duration: 6 * FPS },

  s15_sees:           { start: INTRO + 4920,       duration: 4 * FPS },
  s16_fires:          { start: INTRO + 5160,       duration: 4 * FPS },
  s17_orRefuses:      { start: INTRO + 5400,       duration: 4 * FPS },
  s18_theyWereFine:   { start: INTRO + 5640,       duration: 5 * FPS },
  s19_taglineBrand:   { start: INTRO + 5940,       duration: 7 * FPS },
};

export const TOTAL_DURATION = INTRO + 6360; // 1:47.5 at 60fps

export const COLORS = {
  bg: "#0A0E13",
  panel: "#11161D",
  text: "#E5E9F0",
  muted: "#7A8392",
  accent: "#10B981",
  danger: "#EF4444",
  warn: "#F59E0B",
  critical: "#DC2626",
  cyan: "#06B6D4",
  umbraCyan: "#22d3ee",
  phosphor: "#39ff14",
  paper: "#f5f1e8",
  inkBlue: "#1e40af",
  boxBg: "#ffffff",
  boxText: "#0d2538",
};

export const FONTS = {
  pixel: "VT323",
  mono: "IBM Plex Mono",
  serif: "Source Serif Pro",
  sans: "Inter",
};
