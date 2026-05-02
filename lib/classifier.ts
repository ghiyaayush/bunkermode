/**
 * P9: Classify the attack first.
 *
 * Different attack classes have wildly different recovery rates and T2 windows.
 * This drives the rest of the response.
 *
 * Recovery rates from the v2 framework:
 *   flash_loan_oracle:    18.74%   (Euler returned $197M)
 *   access_control:        2.47%
 *   spoof_token:           0.10%
 *   zk_verifier:              0%
 *   bridge_verifier:          0%   (Kelp profile)
 *   dprk_attributed:       ~0%     (state actors don't negotiate)
 */

import type { Signal, AttackClass, AttackProfile } from "./types";

export const ATTACK_PROFILES: Record<AttackClass, AttackProfile> = {
  flash_loan_oracle: {
    class: "flash_loan_oracle",
    recoveryRate: 0.1874,
    t2WindowSeconds: 180,
    description: "Flash loan oracle manipulation. Negotiation possible.",
    autoFire: false,
  },
  access_control: {
    class: "access_control",
    recoveryRate: 0.0247,
    t2WindowSeconds: 90,
    description: "Compromised admin/multisig. Watch for exchange freezes.",
    autoFire: false,
  },
  spoof_token: {
    class: "spoof_token",
    recoveryRate: 0.001,
    t2WindowSeconds: 60,
    description: "Fake collateral added via governance. Document, file victim registry.",
    autoFire: false,
  },
  zk_verifier: {
    class: "zk_verifier",
    recoveryRate: 0,
    t2WindowSeconds: 45,
    description: "ZK proof verifier compromise. Accept loss, tax documentation.",
    autoFire: false,
  },
  bridge_verifier: {
    class: "bridge_verifier",
    recoveryRate: 0,
    t2WindowSeconds: 0,
    description: "Bridge verifier compromise (Kelp profile). Auto-fire, no confirmation.",
    autoFire: true,
  },
  dprk_attributed: {
    class: "dprk_attributed",
    recoveryRate: 0,
    t2WindowSeconds: 0,
    description: "DPRK attribution. Funds never recovered. Immediate T3.",
    autoFire: true,
  },
  supply_chain: {
    class: "supply_chain",
    recoveryRate: 0,
    t2WindowSeconds: 0,
    description: "Supply chain compromise. REFUSE autonomous execution. Module B.",
    autoFire: false, // we refuse, we don't fire
  },
  unknown: {
    class: "unknown",
    recoveryRate: 0,
    t2WindowSeconds: 120,
    description: "Unclassified. Default to conservative window.",
    autoFire: false,
  },
};

/**
 * Heuristic classifier. Production version would use richer signal payloads.
 * This is rule-based: pattern-match on signal sources, payloads, and protocols.
 */
export function classifyAttack(signals: Signal[]): AttackClass {
  if (signals.length === 0) return "unknown";

  // Module B trigger has highest priority
  if (signals.some((s) => s.source === "supply_chain")) {
    return "supply_chain";
  }

  // DPRK attribution comes from off-chain intel (TRM, Elliptic) carried in payload
  if (signals.some((s) => s.payload?.dprk === true)) {
    return "dprk_attributed";
  }

  // Bridge verifier: signal mentions DVN, LayerZero, bridge in payload
  const mentionsBridge = signals.some((s) =>
    JSON.stringify(s.payload ?? {}).match(/dvn|layerzero|bridge|verifier/i),
  );
  if (mentionsBridge) return "bridge_verifier";

  // Spoof token / governance: payload mentions new collateral or oracle change
  const governanceSignal = signals.some(
    (s) =>
      s.source === "governance" ||
      JSON.stringify(s.payload ?? {}).match(/new collateral|oracle change|admin transfer/i),
  );
  if (governanceSignal) return "spoof_token";

  // Access control: multisig anomaly
  const accessControl = signals.some((s) =>
    JSON.stringify(s.payload ?? {}).match(/multisig|durable nonce|admin role/i),
  );
  if (accessControl) return "access_control";

  // Flash loan oracle: large supply movement + price deviation
  const oracleSignal = signals.some((s) =>
    JSON.stringify(s.payload ?? {}).match(/oracle deviation|flash loan|price manipulation/i),
  );
  if (oracleSignal) return "flash_loan_oracle";

  return "unknown";
}

export function profileFor(attackClass: AttackClass): AttackProfile {
  return ATTACK_PROFILES[attackClass];
}

/**
 * Apply threat environment multiplier (P8) to an attack profile's T2 window.
 * Tightens the window during ELEVATED/CRITICAL threat environments.
 */
export function adjustWindow(profile: AttackProfile, windowMultiplier: number): AttackProfile {
  return {
    ...profile,
    t2WindowSeconds: Math.floor(profile.t2WindowSeconds * windowMultiplier),
  };
}
