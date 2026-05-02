import { describe, expect, test } from "bun:test";
import {
  computeThreatEnv,
  matchesDprkProfile,
  type RecentHack,
} from "../lib/threat-multiplier";

describe("P8 threat env multiplier", () => {
  const now = new Date("2026-04-22T00:00:00Z");

  test("no recent hacks → NORMAL", () => {
    const env = computeThreatEnv([], now);
    expect(env.level).toBe("NORMAL");
    expect(env.thresholdMultiplier).toBe(1.0);
    expect(env.windowMultiplier).toBe(1.0);
  });

  test("single $50M+ hack within 7d → ELEVATED", () => {
    const recent: RecentHack[] = [
      {
        protocol: "kelp",
        lossUsd: 75_000_000,
        attributedToDprk: false,
        occurredAt: new Date("2026-04-18T00:00:00Z"),
      },
    ];
    const env = computeThreatEnv(recent, now);
    expect(env.level).toBe("ELEVATED");
    expect(env.thresholdMultiplier).toBeLessThan(1.0);
  });

  test("two $100M+ hacks within 48h → CRITICAL", () => {
    const recent: RecentHack[] = [
      {
        protocol: "drift",
        lossUsd: 285_000_000,
        attributedToDprk: false,
        occurredAt: new Date("2026-04-21T12:00:00Z"),
      },
      {
        protocol: "kelp",
        lossUsd: 292_000_000,
        attributedToDprk: false,
        occurredAt: new Date("2026-04-21T18:00:00Z"),
      },
    ];
    const env = computeThreatEnv(recent, now);
    expect(env.level).toBe("CRITICAL");
    expect(env.windowMultiplier).toBe(0.5);
  });

  test("any DPRK attribution within 7d → CRITICAL", () => {
    const recent: RecentHack[] = [
      {
        protocol: "kelp",
        lossUsd: 75_000_000,
        attributedToDprk: true,
        occurredAt: new Date("2026-04-18T00:00:00Z"),
      },
    ];
    const env = computeThreatEnv(recent, now);
    expect(env.level).toBe("CRITICAL");
    expect(env.reason).toMatch(/DPRK/);
  });

  test("DPRK profile match: zero timelock + 2/5 multisig + admin oracle", () => {
    const match = matchesDprkProfile({
      protocol: "x",
      timelockHours: 0,
      multisigM: 2,
      multisigN: 5,
      oracleType: "admin",
    });
    expect(match).toBe(true);
  });

  test("DPRK profile non-match: long timelock", () => {
    const match = matchesDprkProfile({
      protocol: "aave",
      timelockHours: 48,
      multisigM: 8,
      multisigN: 12,
      oracleType: "chainlink",
    });
    expect(match).toBe(false);
  });
});
