import { describe, expect, test } from "bun:test";
import {
  driftThreeQuestionScreen,
  classifyAuditRisk,
  formatAuditDigest,
  type ProtocolGovernanceData,
} from "../lib/audit";

const SAFE: ProtocolGovernanceData = {
  protocol: "Aave V3",
  timelockHours: 48,
  multisigM: 8,
  multisigN: 12,
  oracleType: "chainlink",
  adminCanAssignOracle: false,
};

const DRIFT_PROFILE: ProtocolGovernanceData = {
  protocol: "New Protocol X",
  timelockHours: 0,
  multisigM: 2,
  multisigN: 5,
  oracleType: "admin",
  adminCanAssignOracle: true,
};

describe("P11 governance audit", () => {
  test("Drift Three-Question Screen catches the exact attack profile", () => {
    const screen = driftThreeQuestionScreen(DRIFT_PROFILE);
    expect(screen.yesCount).toBe(3);
    expect(screen.matchesDriftProfile).toBe(true);
    expect(screen.questions.every((q) => q.flag === "HIGH")).toBe(true);
  });

  test("safe protocol scores 0 on the screen", () => {
    const screen = driftThreeQuestionScreen(SAFE);
    expect(screen.yesCount).toBe(0);
    expect(screen.matchesDriftProfile).toBe(false);
  });

  test("Drift profile classifies as CRITICAL", () => {
    const profile = classifyAuditRisk(DRIFT_PROFILE);
    expect(profile.riskLevel).toBe("CRITICAL");
    expect(profile.driftScore).toBe(3);
  });

  test("safe protocol classifies as LOW", () => {
    const profile = classifyAuditRisk(SAFE);
    expect(profile.riskLevel).toBe("LOW");
  });

  test("partial match (1 yes) classifies as ELEVATED", () => {
    const partial: ProtocolGovernanceData = { ...SAFE, timelockHours: 24 };
    const profile = classifyAuditRisk(partial);
    expect(profile.driftScore).toBe(1);
    expect(profile.riskLevel).toBe("ELEVATED");
  });

  test("digest includes CRITICAL flag for matched protocols", () => {
    const profiles = [classifyAuditRisk(SAFE), classifyAuditRisk(DRIFT_PROFILE)];
    const digest = formatAuditDigest(profiles, "May 2026");
    expect(digest).toContain("CRITICAL");
    expect(digest).toContain("New Protocol X");
    expect(digest).toContain("1 protocol(s) flagged CRITICAL");
  });
});
