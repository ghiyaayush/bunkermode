/**
 * P11: Proactive Portfolio Governance Audit.
 *
 * Every other principle is reactive. P11 is the only proactive one.
 * Runs monthly across the user's portfolio and surfaces protocols that
 * match the Drift attack profile BEFORE anything has happened.
 *
 * The Drift Three-Question Screen (the heuristic that actually works):
 *   1. Can an admin assign an arbitrary oracle to a new market without governance vote?
 *   2. Is the timelock less than 48 hours?
 *   3. Is the multisig 2/5 or below?
 *
 * Three yes answers = exact Drift attack profile = CRITICAL flag.
 */

import type { GovernanceProfile, RiskLevel } from "./types";
import { matchesDprkProfile, type ProtocolGovernanceSnapshot } from "./threat-multiplier";

export interface ProtocolGovernanceData {
  protocol: string;
  timelockHours: number;
  multisigM: number;
  multisigN: number;
  oracleType: "chainlink" | "pyth" | "internal" | "admin";
  /** can admin assign new oracle without governance vote? */
  adminCanAssignOracle: boolean;
}

export function driftThreeQuestionScreen(p: ProtocolGovernanceData): {
  questions: { q: string; flag: "LOW" | "HIGH" }[];
  yesCount: number;
  matchesDriftProfile: boolean;
} {
  const questions = [
    {
      q: "Can an admin assign an arbitrary oracle to a new collateral market without governance vote?",
      flag: p.adminCanAssignOracle ? ("HIGH" as const) : ("LOW" as const),
    },
    {
      q: "Is the timelock less than 48 hours?",
      flag: p.timelockHours < 48 ? ("HIGH" as const) : ("LOW" as const),
    },
    {
      q: "Is the multisig 2/5 or below?",
      flag:
        p.multisigM <= 2 || p.multisigM / p.multisigN <= 0.4
          ? ("HIGH" as const)
          : ("LOW" as const),
    },
  ];
  const yesCount = questions.filter((q) => q.flag === "HIGH").length;
  return { questions, yesCount, matchesDriftProfile: yesCount === 3 };
}

export function classifyAuditRisk(p: ProtocolGovernanceData): GovernanceProfile {
  const screen = driftThreeQuestionScreen(p);
  const dprkMatch: ProtocolGovernanceSnapshot = {
    protocol: p.protocol,
    timelockHours: p.timelockHours,
    multisigM: p.multisigM,
    multisigN: p.multisigN,
    oracleType: p.oracleType,
  };

  let riskLevel: RiskLevel;
  if (screen.matchesDriftProfile) riskLevel = "CRITICAL";
  else if (matchesDprkProfile(dprkMatch)) riskLevel = "HIGH";
  else if (screen.yesCount >= 1) riskLevel = "ELEVATED";
  else riskLevel = "LOW";

  return {
    protocol: p.protocol,
    timelockHours: p.timelockHours,
    multisigM: p.multisigM,
    multisigN: p.multisigN,
    oracleType: p.oracleType,
    driftScore: screen.yesCount,
    riskLevel,
  };
}

/**
 * Format the monthly audit as a Telegram-ready digest.
 */
export function formatAuditDigest(profiles: GovernanceProfile[], month: string): string {
  const lines: string[] = [];
  lines.push(`Monthly Governance Health Check - ${month}`);
  lines.push("");
  lines.push("Protocol           Timelock   Multisig   Oracle      Risk");

  for (const p of profiles) {
    const tl = p.timelockHours === 0 ? "0h " : `${p.timelockHours}h`;
    const ms = `${p.multisigM}/${p.multisigN}`;
    const oracle = p.oracleType.padEnd(10);
    const risk = p.riskLevel;
    const indicator =
      p.riskLevel === "CRITICAL"
        ? "CRITICAL <- exit"
        : p.riskLevel === "HIGH"
          ? "HIGH"
          : p.riskLevel === "ELEVATED"
            ? "ELEV"
            : "LOW";
    lines.push(`${p.protocol.padEnd(18)} ${tl.padEnd(10)} ${ms.padEnd(10)} ${oracle} ${indicator}`);
  }

  const flagged = profiles.filter((p) => p.riskLevel === "CRITICAL").length;
  lines.push("");
  if (flagged > 0) {
    lines.push(`${flagged} protocol(s) flagged CRITICAL. Action recommended.`);
  } else {
    lines.push("No protocols match Drift attack profile.");
  }
  return lines.join("\n");
}
