/**
 * P8: Raise sensitivity after a major hack.
 *
 * After Drift: 12 more hacks in 16 days, $606M in additional losses.
 * Either DPRK running multi-front operations, or copycats emboldened.
 *
 * Rules:
 *   After any hack > $50M:    ELEVATED for 7 days, thresholds tighten 30-40%
 *   After two hacks > $100M
 *     in 48h:                 CRITICAL, thresholds halve, windows halve
 *   On DPRK attribution:      Portfolio-wide CRITICAL scan for matching profile
 */

import type { ThreatEnv } from "./types";

export const THREAT_LEVELS = {
  NORMAL: { thresholdMultiplier: 1.0, windowMultiplier: 1.0 },
  ELEVATED: { thresholdMultiplier: 0.65, windowMultiplier: 0.7 },
  CRITICAL: { thresholdMultiplier: 0.5, windowMultiplier: 0.5 },
} as const;

export interface RecentHack {
  protocol: string;
  lossUsd: number;
  attributedToDprk: boolean;
  occurredAt: Date;
}

/**
 * Compute the current threat environment from the recent hack history.
 * Pure function - state is held in DB, this just tells you what level to be at.
 */
export function computeThreatEnv(recentHacks: RecentHack[], now: Date = new Date()): ThreatEnv {
  const last48h = recentHacks.filter(
    (h) => now.getTime() - h.occurredAt.getTime() < 48 * 3600 * 1000,
  );
  const last7d = recentHacks.filter(
    (h) => now.getTime() - h.occurredAt.getTime() < 7 * 24 * 3600 * 1000,
  );

  // CRITICAL: two $100M+ hacks in 48h, OR any DPRK attribution in last 7d
  const big48h = last48h.filter((h) => h.lossUsd >= 100_000_000);
  const dprkRecent = last7d.some((h) => h.attributedToDprk);
  if (big48h.length >= 2 || dprkRecent) {
    return {
      level: "CRITICAL",
      reason: dprkRecent
        ? "DPRK-attributed attack within last 7 days; portfolio-wide CRITICAL scan active."
        : "Two hacks above $100M in last 48 hours.",
      thresholdMultiplier: THREAT_LEVELS.CRITICAL.thresholdMultiplier,
      windowMultiplier: THREAT_LEVELS.CRITICAL.windowMultiplier,
      expiresAt: new Date(now.getTime() + 7 * 24 * 3600 * 1000),
    };
  }

  // ELEVATED: any single hack >$50M in last 7d
  const big7d = last7d.find((h) => h.lossUsd >= 50_000_000);
  if (big7d) {
    return {
      level: "ELEVATED",
      reason: `Major hack within 7 days: ${big7d.protocol} ($${(big7d.lossUsd / 1e6).toFixed(0)}M).`,
      thresholdMultiplier: THREAT_LEVELS.ELEVATED.thresholdMultiplier,
      windowMultiplier: THREAT_LEVELS.ELEVATED.windowMultiplier,
      expiresAt: new Date(big7d.occurredAt.getTime() + 7 * 24 * 3600 * 1000),
    };
  }

  return {
    level: "NORMAL",
    reason: "No major hacks in last 7 days.",
    thresholdMultiplier: 1.0,
    windowMultiplier: 1.0,
    expiresAt: new Date(now.getTime() + 24 * 3600 * 1000),
  };
}

/**
 * DPRK profile match: zero/short timelock + 2/5 multisig + admin-controlled oracle.
 * Triggers immediate CRITICAL flag on protocols matching this profile.
 */
export interface ProtocolGovernanceSnapshot {
  protocol: string;
  timelockHours: number;
  multisigM: number;
  multisigN: number;
  oracleType: "chainlink" | "pyth" | "internal" | "admin";
}

export function matchesDprkProfile(snapshot: ProtocolGovernanceSnapshot): boolean {
  const zeroTimelock = snapshot.timelockHours <= 0;
  const lowMultisig =
    snapshot.multisigM <= 2 || snapshot.multisigM / snapshot.multisigN <= 0.4;
  const adminOracle = snapshot.oracleType === "admin" || snapshot.oracleType === "internal";
  // Drift had all three. Two of three is also concerning.
  return [zeroTimelock, lowMultisig, adminOracle].filter(Boolean).length >= 2;
}
