/**
 * BunkerMode v2 type system
 *
 * The whole framework reduced to TypeScript. If you understand this file,
 * you understand the v2 mental model.
 */

import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// P5: Signal Hierarchy
// ─────────────────────────────────────────────────────────────────────────────
export const SignalLayer = z.union([
  z.literal(1), // Bridge / Verifier signals (46+ min warning)
  z.literal(2), // Price signals (30-60 min)
  z.literal(3), // Liquidity signals (15-45 min)
  z.literal(4), // Social signals (unpredictable)
  z.literal(5), // On-chain consequences (minutes to zero)
]);
export type SignalLayer = z.infer<typeof SignalLayer>;

export const Severity = z.enum(["INFO", "WATCH", "ELEVATED", "CRITICAL"]);
export type Severity = z.infer<typeof Severity>;

export const SignalSource = z.enum([
  "forta",
  "hypernative",
  "twitter",
  "utilization", // P4 internal signal
  "governance",  // P11 internal signal
  "supply_chain", // Module B trigger
  "manual",
]);
export type SignalSource = z.infer<typeof SignalSource>;

export const Signal = z.object({
  source: SignalSource,
  protocol: z.string(),
  asset: z.string().optional(),
  layer: SignalLayer,
  severity: Severity,
  payload: z.record(z.unknown()).optional(),
});
export type Signal = z.infer<typeof Signal>;

// ─────────────────────────────────────────────────────────────────────────────
// Tiered response (T1/T2/T3 + REFUSED for Module B)
// ─────────────────────────────────────────────────────────────────────────────
export type Tier = "T1" | "T2" | "T3" | "REFUSED";

// ─────────────────────────────────────────────────────────────────────────────
// P9: Attack classification (recovery rate drives T2 window)
// ─────────────────────────────────────────────────────────────────────────────
export const AttackClass = z.enum([
  "flash_loan_oracle",  // 18.74% recovery, 180s window
  "access_control",     // 2.47%, 90s
  "spoof_token",        // 0.10%, 60s
  "zk_verifier",        // 0%, 45s
  "bridge_verifier",    // 0%, 0s (Kelp profile)
  "dprk_attributed",    // ~0%, 0s, no confirmation
  "supply_chain",       // Module B - refuses to auto-execute
  "unknown",
]);
export type AttackClass = z.infer<typeof AttackClass>;

export interface AttackProfile {
  class: AttackClass;
  recoveryRate: number; // 0..1
  t2WindowSeconds: number;
  description: string;
  autoFire: boolean; // skip T2 entirely
}

// ─────────────────────────────────────────────────────────────────────────────
// P3: Three-layer collateral risk
// ─────────────────────────────────────────────────────────────────────────────
export const CollateralLayer = z.enum(["token", "bridge", "verifier"]);
export type CollateralLayer = z.infer<typeof CollateralLayer>;

export const RiskLevel = z.enum(["LOW", "ELEVATED", "HIGH", "CRITICAL"]);
export type RiskLevel = z.infer<typeof RiskLevel>;

export interface CollateralRiskScore {
  asset: string;
  token: RiskLevel;
  bridge: RiskLevel;
  verifier: RiskLevel;
  overall: RiskLevel;
}

// ─────────────────────────────────────────────────────────────────────────────
// P2: Pool architecture
// ─────────────────────────────────────────────────────────────────────────────
export const PoolArchitecture = z.enum(["shared", "isolated"]);
export type PoolArchitecture = z.infer<typeof PoolArchitecture>;

// ─────────────────────────────────────────────────────────────────────────────
// P6: Contagion stratification
// ─────────────────────────────────────────────────────────────────────────────
export const PositionLayer = z.enum([
  "direct_holder",        // seconds to damage
  "shared_pool_supplier", // hours
  "isolated_pool_supplier", // unaffected if not the bad asset
  "leveraged_loop",       // minutes, magnified
  "native_holder",        // never
]);
export type PositionLayer = z.infer<typeof PositionLayer>;

// ─────────────────────────────────────────────────────────────────────────────
// P7: Exit routing
// ─────────────────────────────────────────────────────────────────────────────
export interface ExitDestination {
  rank: number;
  name: string;
  description: string;
  chainId: number;
  /** how to verify it's still safe at exit time */
  livenessCheck?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// P11: Governance audit (Drift Three-Question Screen)
// ─────────────────────────────────────────────────────────────────────────────
export interface GovernanceProfile {
  protocol: string;
  timelockHours: number;
  multisigM: number;
  multisigN: number;
  oracleType: "chainlink" | "pyth" | "internal" | "admin";
  driftScore: number; // 0..3 yes answers
  riskLevel: RiskLevel;
}

// ─────────────────────────────────────────────────────────────────────────────
// Bunker Policy DSL (the user-facing config language)
// ─────────────────────────────────────────────────────────────────────────────
export const BunkerPolicy = z.object({
  name: z.string(),
  templateKey: z.string(),
  asset: z.string(),
  protocol: z.string(),
  position: PositionLayer,
  rules: z.object({
    /** P4: utilization fast-track threshold */
    utilizationLockoutPct: z.number().min(0).max(100).default(85),
    /** P9: attack classes that auto-fire (skip T2) */
    autoFireOn: z.array(AttackClass).default([
      "bridge_verifier",
      "dprk_attributed",
    ]),
    /** P7: ranked exit destinations */
    exitRoute: z.array(z.string()).default([
      "usdc-base-cctp",
      "morpho-isolated",
      "sparklend",
      "native-eth",
    ]),
    /** P10: re-entry verification required */
    reEntryGate: z.boolean().default(true),
    /** Module B: refuse autonomous execution on supply chain signals */
    refuseOnSupplyChain: z.boolean().default(true),
    /** WYSIWYS: hardware wallet for above this threshold */
    hardwareWalletAbove: z.number().default(50_000),
  }),
});
export type BunkerPolicy = z.infer<typeof BunkerPolicy>;

// ─────────────────────────────────────────────────────────────────────────────
// Threat environment (P8)
// ─────────────────────────────────────────────────────────────────────────────
export interface ThreatEnv {
  level: "NORMAL" | "ELEVATED" | "CRITICAL";
  reason: string;
  thresholdMultiplier: number; // 1.0 normal, 0.65 elevated (-35%), 0.5 critical
  windowMultiplier: number;
  expiresAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// Corroboration state
// ─────────────────────────────────────────────────────────────────────────────
export interface CorroboratorState {
  signals: Signal[];
  windowMs: number;
  tier: Tier;
  attackClass: AttackClass | null;
  attackProfile: AttackProfile | null;
  exitRoute: string | null;
  reasonCodes: string[];
}
