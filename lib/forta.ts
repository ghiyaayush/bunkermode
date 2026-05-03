/**
 * Forta alert ingestion.
 *
 * Forta sends webhooks shaped roughly like this when a subscribed bot
 * fires on an address you're watching:
 *
 *   {
 *     "alertId": "ATTACK-DETECTOR-1",
 *     "alertHash": "0xabc...",
 *     "name": "Attack Detector",
 *     "severity": "CRITICAL",         // INFO | LOW | MEDIUM | HIGH | CRITICAL
 *     "protocol": "aave-v3",
 *     "chainId": 1,
 *     "addresses": ["0x..."],
 *     "transactionHash": "0x...",
 *     "description": "...",
 *     "metadata": { ... },
 *     "source": { "url": "https://explorer.forta.network/alert/0xabc" }
 *   }
 *
 * This module:
 *   1. Validates the payload shape
 *   2. Verifies HMAC signature
 *   3. Translates Forta -> normalized BunkerMode Signal
 *   4. Maps Forta severity -> BunkerMode tier
 */

import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";
import type { Signal, Tier, AttackClass } from "./types";

export const FortaSeverity = z.enum(["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export type FortaSeverity = z.infer<typeof FortaSeverity>;

export const FortaAlert = z.object({
  alertId: z.string(),
  alertHash: z.string().optional(),
  name: z.string(),
  severity: FortaSeverity,
  protocol: z.string().optional(),
  chainId: z.number().int().positive(),
  addresses: z.array(z.string()).default([]),
  transactionHash: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  source: z
    .object({ url: z.string().optional(), botId: z.string().optional() })
    .partial()
    .optional(),
});
export type FortaAlert = z.infer<typeof FortaAlert>;

/**
 * Verify the X-Forta-Signature header (HMAC-SHA256 of raw body).
 * Returns true on match, false otherwise. Constant-time comparison.
 */
export function verifyFortaSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature.replace(/^sha256=/, ""), "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Map Forta severity -> BunkerMode signal severity (P5/P8 grading).
 */
const SEVERITY_MAP: Record<FortaSeverity, Signal["severity"]> = {
  INFO: "INFO",
  LOW: "WATCH",
  MEDIUM: "WATCH",
  HIGH: "ELEVATED",
  CRITICAL: "CRITICAL",
};

/**
 * Translate Forta alert -> normalized Signal we already understand.
 * Best-effort layer assignment based on bot family (attack-detector
 * tends to be Layer 1 verifier/bridge or Layer 5 on-chain consequence).
 */
export function fortaToSignal(alert: FortaAlert): Signal {
  const nameLower = alert.name.toLowerCase();
  let layer: Signal["layer"] = 5;
  if (/bridge|verifier|dvn|layerzero/.test(nameLower)) layer = 1;
  else if (/oracle|price/.test(nameLower)) layer = 2;
  else if (/liquidity|utilization/.test(nameLower)) layer = 3;
  else if (/twitter|social/.test(nameLower)) layer = 4;

  return {
    source: "forta",
    protocol: alert.protocol ?? "unknown",
    asset: typeof alert.metadata?.asset === "string" ? (alert.metadata.asset as string) : undefined,
    layer,
    severity: SEVERITY_MAP[alert.severity],
    payload: {
      alertId: alert.alertId,
      alertHash: alert.alertHash,
      name: alert.name,
      chainId: alert.chainId,
      addresses: alert.addresses,
      transactionHash: alert.transactionHash,
      description: alert.description,
      metadata: alert.metadata,
      source: alert.source,
    },
  };
}

/**
 * Map Forta severity directly to a tier when this single alert is
 * already self-confirming (for HIGH/CRITICAL bots whose precision
 * makes single-source escalation acceptable). Most alerts get T1
 * and rely on corroboration to escalate.
 */
export function fortaTier(alert: FortaAlert): Tier {
  if (alert.severity === "CRITICAL") return "T2";
  if (alert.severity === "HIGH") return "T1";
  return "T1";
}

/**
 * Best-effort attack-class hint from Forta bot name.
 * Real classification still runs in lib/classifier.ts when corroborating,
 * but this gives the dispatch message a useful initial label.
 */
export function fortaAttackClassHint(alert: FortaAlert): AttackClass | null {
  const n = alert.name.toLowerCase();
  if (/bridge|dvn|verifier|layerzero/.test(n)) return "bridge_verifier";
  if (/flash[- ]?loan|oracle/.test(n)) return "flash_loan_oracle";
  if (/multisig|admin|access[- ]?control|durable nonce/.test(n)) return "access_control";
  if (/governance|spoof|new collateral/.test(n)) return "spoof_token";
  if (/supply[- ]?chain/.test(n)) return "supply_chain";
  if (/dprk|lazarus/.test(n)) return "dprk_attributed";
  return null;
}
