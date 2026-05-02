/**
 * Module A: Post-Incident Classifier with timed Telegram sequence.
 *
 * After T3 fires, the system delivers a different guide for each attack class,
 * timed to arrive when each piece of information is needed:
 *
 *   T+0:      Exit receipt + attack class + recovery rate
 *   T+30 min: Stop all interactions reminder + compromised protocol list
 *   T+2 h:    Secondary cascade scan
 *   T+12 h:   Victim registry checklist
 *   T+24 h:   Mango negotiation check (non-DPRK only)
 *   T+7 d:    Re-entry readiness check
 *   T+30 d:   Final reconciliation + tax docs
 */

import type { AttackClass, AttackProfile } from "./types";

export interface TimedMessage {
  delaySeconds: number;
  subject: string;
  body: string;
  applicableTo: AttackClass[] | "all";
}

export const POST_INCIDENT_SEQUENCE: TimedMessage[] = [
  {
    delaySeconds: 0,
    subject: "T+0: Exit confirmed",
    body: `Exited safely. Below are the actions for the next 12 hours.
Attack class: {attackClass}
Recovery rate for this class: {recoveryPct}%
Your next 3 actions:
  1. Screenshot all position states NOW (victim registry needs timestamps)
  2. Do NOT interact with this protocol on any chain
  3. Check secondary exposure to protocols using their vaults`,
    applicableTo: "all",
  },
  {
    delaySeconds: 30 * 60,
    subject: "T+30min: Lockdown reminder",
    body: `Stop all interactions with the compromised protocol on every chain.
The drained pool circuit breaker is active on your wallet for 14 days.
Compromised protocol list: {protocolList}`,
    applicableTo: "all",
  },
  {
    delaySeconds: 2 * 3600,
    subject: "T+2h: Secondary cascade scan",
    body: `Secondary exposure scan complete.
Protocols using {protocol}'s tokens as collateral: {affectedProtocols}
Check positions in each. Apply your bunker policy if exposed.`,
    applicableTo: "all",
  },
  {
    delaySeconds: 12 * 3600,
    subject: "T+12h: Victim registry checklist",
    body: `File a claim in the victim registry within the next 12 hours.
Required: exit receipt, position state at T+0, transaction history export.
[ View victim registry ] [ Export transaction history ]`,
    applicableTo: ["spoof_token", "access_control", "flash_loan_oracle"],
  },
  {
    delaySeconds: 24 * 3600,
    subject: "T+24h: Mango negotiation check",
    body: `Has the attacker wallet moved funds in the last 24 hours?
If no, negotiation is possible (Euler returned $197M after 20 days).
We will check daily until day 30.`,
    applicableTo: ["flash_loan_oracle", "access_control"], // skipped for DPRK
  },
  {
    delaySeconds: 7 * 24 * 3600,
    subject: "T+7d: Re-entry readiness",
    body: `Has the protocol published an audit?
Three trust layers must all be green before BunkerMode unlocks re-entry:
  - Token: whitelist reinstated, ERC-20 validated, real liquidity verified
  - Price: TWAP 24h+, two feeds agreeing within 2%, deviation circuit breaker
  - Governance: 48-72h timelock, 4/7 multisig, all keys rotated, audit published
Current status: {reEntryStatus}`,
    applicableTo: "all",
  },
  {
    delaySeconds: 30 * 24 * 3600,
    subject: "T+30d: Final reconciliation",
    body: `Final reconciliation. Tax documentation:
- Realized losses: {realizedLossUsd}
- Recovered funds: {recoveredUsd}
- Net loss for tax purposes: {netLossUsd}
[ Export 8949 form ] [ Export cost-basis adjustments ]`,
    applicableTo: "all",
  },
];

export function relevantMessagesFor(attackClass: AttackClass): TimedMessage[] {
  return POST_INCIDENT_SEQUENCE.filter(
    (m) => m.applicableTo === "all" || m.applicableTo.includes(attackClass),
  );
}

export interface SubstitutionContext {
  attackClass: AttackClass;
  recoveryPct: string;
  protocol: string;
  protocolList: string;
  affectedProtocols: string;
  realizedLossUsd: string;
  recoveredUsd: string;
  netLossUsd: string;
  reEntryStatus: string;
}

export function fillTemplate(body: string, ctx: SubstitutionContext): string {
  return body.replace(/\{(\w+)\}/g, (_, k: keyof SubstitutionContext) => {
    return ctx[k] ?? `{${k}}`;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Module B: Supply Chain Emergency Mode
// ─────────────────────────────────────────────────────────────────────────────
export const SUPPLY_CHAIN_REFUSAL_MESSAGE = `🚨 SUPPLY CHAIN ATTACK - EMERGENCY MODE

Your local environment may be compromised.
BunkerMode is NOT executing any transactions.

DO NOW:
1. STOP all DApp interactions on this device
2. On a CLEAN, ISOLATED device: move assets to hardware wallet
3. Generate new seed phrases on air-gapped hardware
4. Every key that touched the compromised DApp is exposed

⚠️ A hardware wallet does NOT protect you if the
   signing interface was compromised.
   Verify every transaction on the device screen directly.`;

export const SUPPLY_CHAIN_TRIGGERS = [
  "Confirmed malicious package in a DApp you've interacted with",
  "DPRK-linked developer identity confirmed at a protocol in your portfolio",
  "Compromised frontend (DNS attack) matches your recent interaction history",
];
