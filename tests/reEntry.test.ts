import { describe, expect, test } from "bun:test";
import { evaluateReEntry } from "../lib/reEntry";

describe("P10 + Module C re-entry gate", () => {
  const baseTokenChecks = {
    whitelistReinstated: true,
    whitelistTimelockHours: 48,
    erc20Validated: true,
    hasFeeOnTransfer: false,
    hasHoneypot: false,
    realLiquidityUsd: 12_000_000,
    liquiditySpreadAcrossPools: 3,
  };
  const basePriceChecks = {
    twapWindowHours: 24,
    feedsAgreeing: 2,
    feedsWithinTolerance: true,
    deviationCircuitBreaker: true,
  };
  const baseGovChecks = {
    timelockHours: 72,
    multisigM: 5,
    multisigN: 9,
    hasHardwareWallets: true,
    allKeysRotated: true,
    durableNoncePreSigningAllowed: false,
    auditPublishedUrl: "https://example.com/audit",
  };

  test("all green + block elapsed → unlockable", () => {
    const status = evaluateReEntry({
      protocol: "test",
      blockedSince: new Date("2026-04-01"),
      blockDurationDays: 14,
      tokenChecks: baseTokenChecks,
      priceChecks: basePriceChecks,
      governanceChecks: baseGovChecks,
      now: new Date("2026-04-30"),
    });
    expect(status.unlockable).toBe(true);
    expect(status.tokenLayer.state).toBe("GREEN");
    expect(status.priceLayer.state).toBe("GREEN");
    expect(status.governanceLayer.state).toBe("GREEN");
  });

  test("block period not elapsed → locked even if all green", () => {
    const status = evaluateReEntry({
      protocol: "test",
      blockedSince: new Date("2026-04-25"),
      blockDurationDays: 14,
      tokenChecks: baseTokenChecks,
      priceChecks: basePriceChecks,
      governanceChecks: baseGovChecks,
      now: new Date("2026-04-30"),
    });
    expect(status.unlockable).toBe(false);
    expect(status.reasoning.some((r) => r.includes("circuit breaker"))).toBe(true);
  });

  test("audit not published → governance RED, locked", () => {
    const status = evaluateReEntry({
      protocol: "test",
      blockedSince: new Date("2026-04-01"),
      tokenChecks: baseTokenChecks,
      priceChecks: basePriceChecks,
      governanceChecks: { ...baseGovChecks, auditPublishedUrl: null },
      now: new Date("2026-04-30"),
    });
    expect(status.governanceLayer.state).toBe("RED");
    expect(status.unlockable).toBe(false);
  });

  test("Cream double-hit protection: secondary exploit forces lock", () => {
    const status = evaluateReEntry({
      protocol: "test",
      blockedSince: new Date("2026-04-01"),
      tokenChecks: baseTokenChecks,
      priceChecks: basePriceChecks,
      governanceChecks: baseGovChecks,
      secondaryExploitDetected: true,
      now: new Date("2026-04-30"),
    });
    expect(status.unlockable).toBe(false);
    expect(status.reasoning.some((r) => r.includes("Cream"))).toBe(true);
  });

  test("low liquidity → token layer RED", () => {
    const status = evaluateReEntry({
      protocol: "test",
      blockedSince: new Date("2026-04-01"),
      tokenChecks: { ...baseTokenChecks, realLiquidityUsd: 1_000_000 },
      priceChecks: basePriceChecks,
      governanceChecks: baseGovChecks,
      now: new Date("2026-04-30"),
    });
    expect(status.tokenLayer.state).toBe("RED");
    expect(status.unlockable).toBe(false);
  });

  test("durable nonce pre-signing allowed → governance RED", () => {
    const status = evaluateReEntry({
      protocol: "test",
      blockedSince: new Date("2026-04-01"),
      tokenChecks: baseTokenChecks,
      priceChecks: basePriceChecks,
      governanceChecks: { ...baseGovChecks, durableNoncePreSigningAllowed: true },
      now: new Date("2026-04-30"),
    });
    expect(status.governanceLayer.state).toBe("RED");
  });
});
