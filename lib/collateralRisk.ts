/**
 * P3: Collateral is always three layers deep.
 *
 * Every token used as collateral has three layers of risk beneath it,
 * and the failure usually happens at the layer nobody is watching:
 *
 *   Layer 3: The token itself (is the restaking contract safe?)
 *   Layer 2: The bridge it crosses chains on (is LayerZero configured right?)
 *   Layer 1: The verifier that attests cross-chain messages (is the DVN honest?)
 *
 * The Kelp hack failed at Layer 1. The token looked fine. The bridge
 * looked fine. The verifier - one operator - was compromised via RPC node
 * manipulation. Nobody watching Layers 2 or 3 would have seen anything.
 *
 * Every collateral asset in your policy gets a three-layer risk score.
 * A CRITICAL rating at Layer 1 means BunkerMode watches that asset at 3x
 * normal sensitivity - any anomaly fires immediately.
 */

import type { CollateralRiskScore, RiskLevel } from "./types";

export interface CollateralFacts {
  asset: string;
  /** Layer 3 (token) facts */
  tokenContractAuditedAt: Date | null;
  tokenIsRestakingShare: boolean;
  tokenHasUpgradeAdmin: boolean;
  /** Layer 2 (bridge) facts */
  bridgeProtocol: "layerzero" | "ccip" | "wormhole" | "native" | "unknown";
  bridgeIsCanonical: boolean;
  /** Layer 1 (verifier) facts */
  verifierThreshold: string; // e.g. "1-of-1", "3-of-5"
  verifierOperators: number;
  verifierHasIndependentAudit: boolean;
}

function scoreToken(f: CollateralFacts): RiskLevel {
  let bad = 0;
  if (!f.tokenContractAuditedAt) bad++;
  else {
    const ageDays = (Date.now() - f.tokenContractAuditedAt.getTime()) / (24 * 3600 * 1000);
    if (ageDays > 365) bad++;
  }
  if (f.tokenIsRestakingShare) bad++; // restaking shares carry beacon-chain dependency
  if (f.tokenHasUpgradeAdmin) bad++;
  if (bad >= 3) return "CRITICAL";
  if (bad === 2) return "HIGH";
  if (bad === 1) return "ELEVATED";
  return "LOW";
}

function scoreBridge(f: CollateralFacts): RiskLevel {
  if (f.bridgeProtocol === "native") return "LOW";
  if (f.bridgeProtocol === "ccip" && f.bridgeIsCanonical) return "LOW";
  if (f.bridgeProtocol === "layerzero") {
    return f.bridgeIsCanonical ? "ELEVATED" : "HIGH";
  }
  if (f.bridgeProtocol === "wormhole") return "ELEVATED";
  if (f.bridgeProtocol === "unknown") return "CRITICAL";
  return "ELEVATED";
}

function scoreVerifier(f: CollateralFacts): RiskLevel {
  if (f.verifierThreshold === "1-of-1") return "CRITICAL";
  if (f.verifierOperators < 3) return "HIGH";
  if (f.verifierOperators < 5) return "ELEVATED";
  if (!f.verifierHasIndependentAudit) {
    // demote one notch
    return "ELEVATED";
  }
  return "LOW";
}

const ORDER: RiskLevel[] = ["LOW", "ELEVATED", "HIGH", "CRITICAL"];
function worst(...levels: RiskLevel[]): RiskLevel {
  return levels.reduce((a, b) => (ORDER.indexOf(a) > ORDER.indexOf(b) ? a : b));
}

export function scoreCollateral(f: CollateralFacts): CollateralRiskScore {
  const token = scoreToken(f);
  const bridge = scoreBridge(f);
  const verifier = scoreVerifier(f);
  return {
    asset: f.asset,
    token,
    bridge,
    verifier,
    overall: worst(token, bridge, verifier),
  };
}

/**
 * Sensitivity multiplier from the worst layer score.
 * CRITICAL at Layer 1 means BunkerMode escalates 3x faster on any signal.
 */
export function sensitivityMultiplier(score: CollateralRiskScore): number {
  if (score.verifier === "CRITICAL") return 3.0;
  if (score.overall === "CRITICAL") return 2.5;
  if (score.overall === "HIGH") return 1.6;
  if (score.overall === "ELEVATED") return 1.25;
  return 1.0;
}

/**
 * Built-in fact set for the assets most relevant to the demo.
 * Production version reads from a curated registry.
 */
export const COLLATERAL_FACTS: Record<string, CollateralFacts> = {
  rsETH: {
    asset: "rsETH",
    tokenContractAuditedAt: new Date("2025-08-12"),
    tokenIsRestakingShare: true,
    tokenHasUpgradeAdmin: true,
    bridgeProtocol: "layerzero",
    bridgeIsCanonical: false,
    verifierThreshold: "1-of-1",
    verifierOperators: 1,
    verifierHasIndependentAudit: false,
  },
  USDC: {
    asset: "USDC",
    tokenContractAuditedAt: new Date("2024-12-01"),
    tokenIsRestakingShare: false,
    tokenHasUpgradeAdmin: true,
    bridgeProtocol: "ccip",
    bridgeIsCanonical: true,
    verifierThreshold: "5-of-9",
    verifierOperators: 9,
    verifierHasIndependentAudit: true,
  },
  sUSDS: {
    asset: "sUSDS",
    tokenContractAuditedAt: new Date("2025-06-15"),
    tokenIsRestakingShare: false,
    tokenHasUpgradeAdmin: true,
    bridgeProtocol: "native",
    bridgeIsCanonical: true,
    verifierThreshold: "5-of-9",
    verifierOperators: 9,
    verifierHasIndependentAudit: true,
  },
};
