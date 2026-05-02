import { describe, expect, test } from "bun:test";
import { classifyAttack, profileFor, adjustWindow } from "../lib/classifier";
import type { Signal } from "../lib/types";

describe("P9 classifier", () => {
  test("supply chain has highest priority", () => {
    const signals: Signal[] = [
      {
        source: "supply_chain",
        protocol: "aave-v3",
        layer: 5,
        severity: "CRITICAL",
        payload: { trigger: "malicious extension" },
      },
      {
        source: "forta",
        protocol: "aave-v3",
        layer: 1,
        severity: "CRITICAL",
        payload: { dprk: true },
      },
    ];
    expect(classifyAttack(signals)).toBe("supply_chain");
  });

  test("DPRK attribution beats other classifications", () => {
    const signals: Signal[] = [
      {
        source: "hypernative",
        protocol: "kelp",
        layer: 1,
        severity: "CRITICAL",
        payload: { dprk: true, layerzero: true },
      },
    ];
    expect(classifyAttack(signals)).toBe("dprk_attributed");
  });

  test("bridge keywords map to bridge_verifier", () => {
    const signals: Signal[] = [
      {
        source: "forta",
        protocol: "kelp",
        layer: 1,
        severity: "CRITICAL",
        payload: { layerzero: "1-of-1 dvn", note: "anomalous bridge outflow" },
      },
    ];
    expect(classifyAttack(signals)).toBe("bridge_verifier");
  });

  test("governance source maps to spoof_token", () => {
    const signals: Signal[] = [
      {
        source: "governance",
        protocol: "drift",
        layer: 1,
        severity: "ELEVATED",
      },
    ];
    expect(classifyAttack(signals)).toBe("spoof_token");
  });

  test("multisig keywords map to access_control", () => {
    const signals: Signal[] = [
      {
        source: "twitter",
        protocol: "drift",
        layer: 4,
        severity: "ELEVATED",
        payload: { note: "durable nonce pre-signing detected" },
      },
    ];
    expect(classifyAttack(signals)).toBe("access_control");
  });

  test("oracle deviation maps to flash_loan_oracle", () => {
    const signals: Signal[] = [
      {
        source: "forta",
        protocol: "euler",
        layer: 2,
        severity: "ELEVATED",
        payload: { note: "oracle deviation 8%" },
      },
    ];
    expect(classifyAttack(signals)).toBe("flash_loan_oracle");
  });

  test("empty signals → unknown", () => {
    expect(classifyAttack([])).toBe("unknown");
  });

  test("recovery rates match v2 framework", () => {
    expect(profileFor("flash_loan_oracle").recoveryRate).toBeCloseTo(0.1874, 4);
    expect(profileFor("access_control").recoveryRate).toBeCloseTo(0.0247, 4);
    expect(profileFor("spoof_token").recoveryRate).toBeCloseTo(0.001, 4);
    expect(profileFor("dprk_attributed").recoveryRate).toBe(0);
  });

  test("auto-fire flag matches v2 framework", () => {
    expect(profileFor("bridge_verifier").autoFire).toBe(true);
    expect(profileFor("dprk_attributed").autoFire).toBe(true);
    expect(profileFor("flash_loan_oracle").autoFire).toBe(false);
    expect(profileFor("supply_chain").autoFire).toBe(false); // we refuse, we don't fire
  });

  test("threat env multiplier tightens window proportionally", () => {
    const baseline = profileFor("flash_loan_oracle"); // 180s
    const elevated = adjustWindow(baseline, 0.7); // -30%
    const critical = adjustWindow(baseline, 0.5); // -50%
    expect(elevated.t2WindowSeconds).toBe(125); // floor(180 * 0.7) = 125 (float math)
    expect(critical.t2WindowSeconds).toBe(90);
  });
});
