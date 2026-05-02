import { describe, expect, test } from "bun:test";
import { corroborate } from "../lib/corroborator";
import type { Signal, ThreatEnv, AttackClass } from "../lib/types";

const NORMAL_ENV: ThreatEnv = {
  level: "NORMAL",
  reason: "test",
  thresholdMultiplier: 1.0,
  windowMultiplier: 1.0,
  expiresAt: new Date(),
};

const POLICY = {
  exitRoute: ["usdc-base-cctp", "morpho-isolated", "native-eth"],
  autoFireOn: ["bridge_verifier", "dprk_attributed"] as AttackClass[],
  refuseOnSupplyChain: true,
};

describe("Corroborator (T1/T2/T3 + REFUSED)", () => {
  test("no signals → T1, no exit route", () => {
    const state = corroborate({
      signals: [],
      policy: POLICY,
      threatEnv: NORMAL_ENV,
      utilizationLockoutTriggered: false,
    });
    expect(state.tier).toBe("T1");
    expect(state.exitRoute).toBe(null);
  });

  test("single source → T1", () => {
    const signals: Signal[] = [
      { source: "forta", protocol: "aave-v3", layer: 1, severity: "ELEVATED" },
    ];
    const state = corroborate({
      signals,
      policy: POLICY,
      threatEnv: NORMAL_ENV,
      utilizationLockoutTriggered: false,
    });
    expect(state.tier).toBe("T1");
  });

  test("two distinct sources → T2", () => {
    const signals: Signal[] = [
      { source: "forta", protocol: "aave-v3", layer: 1, severity: "ELEVATED" },
      { source: "hypernative", protocol: "aave-v3", layer: 1, severity: "ELEVATED" },
    ];
    const state = corroborate({
      signals,
      policy: POLICY,
      threatEnv: NORMAL_ENV,
      utilizationLockoutTriggered: false,
    });
    expect(state.tier).toBe("T2");
    expect(state.attackClass).toBe("unknown");
  });

  test("three sources → T3 with exit route", () => {
    const signals: Signal[] = [
      { source: "forta", protocol: "aave-v3", layer: 1, severity: "ELEVATED" },
      { source: "hypernative", protocol: "aave-v3", layer: 1, severity: "ELEVATED" },
      { source: "twitter", protocol: "aave-v3", layer: 4, severity: "ELEVATED" },
    ];
    const state = corroborate({
      signals,
      policy: POLICY,
      threatEnv: NORMAL_ENV,
      utilizationLockoutTriggered: false,
    });
    expect(state.tier).toBe("T3");
    expect(state.exitRoute).toBe("usdc-base-cctp");
  });

  test("Module B refuses on supply_chain even with multiple signals", () => {
    const signals: Signal[] = [
      { source: "supply_chain", protocol: "aave-v3", layer: 5, severity: "CRITICAL" },
      { source: "forta", protocol: "aave-v3", layer: 1, severity: "CRITICAL" },
    ];
    const state = corroborate({
      signals,
      policy: POLICY,
      threatEnv: NORMAL_ENV,
      utilizationLockoutTriggered: false,
    });
    expect(state.tier).toBe("REFUSED");
    expect(state.exitRoute).toBe(null);
    expect(state.attackClass).toBe("supply_chain");
  });

  test("P4 utilization fast-track triggers T3 even on a single signal", () => {
    const signals: Signal[] = [
      { source: "utilization", protocol: "aave-v3", layer: 1, severity: "ELEVATED" },
    ];
    const state = corroborate({
      signals,
      policy: POLICY,
      threatEnv: NORMAL_ENV,
      utilizationLockoutTriggered: true,
    });
    expect(state.tier).toBe("T3");
    expect(state.exitRoute).toBe("usdc-base-cctp");
    expect(state.reasonCodes.some((r) => r.includes("P4"))).toBe(true);
  });

  test("DPRK attribution auto-fires immediately on a single signal", () => {
    const signals: Signal[] = [
      {
        source: "hypernative",
        protocol: "aave-v3",
        layer: 1,
        severity: "CRITICAL",
        payload: { dprk: true },
      },
    ];
    const state = corroborate({
      signals,
      policy: POLICY,
      threatEnv: NORMAL_ENV,
      utilizationLockoutTriggered: false,
    });
    expect(state.tier).toBe("T3");
    expect(state.attackClass).toBe("dprk_attributed");
    expect(state.attackProfile?.t2WindowSeconds).toBe(0);
  });

  test("threat env tightens window for non-auto-fire classes", () => {
    const signals: Signal[] = [
      {
        source: "forta",
        protocol: "euler",
        layer: 2,
        severity: "ELEVATED",
        payload: { note: "oracle deviation" },
      },
      {
        source: "hypernative",
        protocol: "euler",
        layer: 2,
        severity: "ELEVATED",
        payload: { note: "oracle deviation" },
      },
    ];
    const elevatedEnv: ThreatEnv = { ...NORMAL_ENV, level: "ELEVATED", windowMultiplier: 0.5 };
    const state = corroborate({
      signals,
      policy: POLICY,
      threatEnv: elevatedEnv,
      utilizationLockoutTriggered: false,
    });
    expect(state.tier).toBe("T2");
    expect(state.attackClass).toBe("flash_loan_oracle");
    expect(state.attackProfile?.t2WindowSeconds).toBe(90); // 180 * 0.5
  });
});
