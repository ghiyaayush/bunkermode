/**
 * The corroboration state machine.
 *
 *   T1 = single source observed within window
 *   T2 = two sources within window, ask user to confirm exit
 *   T3 = three+ sources within window OR auto-fire attack class
 *   REFUSED = supply chain signal, do NOT auto-execute
 *
 * The window is per-attack-class (P9), tightened by threat env (P8), and
 * fast-tracked by the utilization signal (P4).
 */

import type {
  Signal,
  Tier,
  CorroboratorState,
  AttackClass,
  AttackProfile,
  ThreatEnv,
} from "./types";
import { classifyAttack, profileFor, adjustWindow } from "./classifier";
import { selectRoute, defaultLivenessProbe } from "./exit-router";

export interface CorroborateInput {
  signals: Signal[];
  policy: { exitRoute: string[]; autoFireOn: AttackClass[]; refuseOnSupplyChain: boolean };
  threatEnv: ThreatEnv;
  utilizationLockoutTriggered: boolean; // P4 fast-track
}

export function corroborate(input: CorroborateInput): CorroboratorState {
  const { signals, policy, threatEnv, utilizationLockoutTriggered } = input;
  const reasons: string[] = [];

  if (signals.length === 0) {
    return {
      signals,
      windowMs: 0,
      tier: "T1",
      attackClass: null,
      attackProfile: null,
      exitRoute: null,
      reasonCodes: ["no signals"],
    };
  }

  // P9: classify first
  const attackClass = classifyAttack(signals);
  let profile = profileFor(attackClass);

  // Module B: refuse on supply chain
  if (attackClass === "supply_chain" && policy.refuseOnSupplyChain) {
    reasons.push("Supply chain signal detected. Module B: REFUSE autonomous execution.");
    return {
      signals,
      windowMs: 0,
      tier: "REFUSED",
      attackClass,
      attackProfile: profile,
      exitRoute: null,
      reasonCodes: reasons,
    };
  }

  // P8: tighten window per threat environment
  profile = adjustWindow(profile, threatEnv.windowMultiplier);
  if (threatEnv.level !== "NORMAL") {
    reasons.push(
      `Threat env ${threatEnv.level}: window x${threatEnv.windowMultiplier} (${profile.t2WindowSeconds}s)`,
    );
  }

  // P4: utilization fast-track unconditionally escalates
  if (utilizationLockoutTriggered) {
    reasons.push("P4: utilization lockout fast-track. T3 auto-fire.");
    const route = selectRoute(policy.exitRoute, defaultLivenessProbe);
    return {
      signals,
      windowMs: 0,
      tier: "T3",
      attackClass,
      attackProfile: profile,
      exitRoute: route.chosen.name,
      reasonCodes: reasons,
    };
  }

  // P9 auto-fire on bridge_verifier / DPRK
  if (profile.autoFire || policy.autoFireOn.includes(attackClass)) {
    reasons.push(`P9: ${attackClass} class auto-fires (recovery rate ${(profile.recoveryRate * 100).toFixed(2)}%).`);
    const route = selectRoute(policy.exitRoute, defaultLivenessProbe);
    return {
      signals,
      windowMs: 0,
      tier: "T3",
      attackClass,
      attackProfile: profile,
      exitRoute: route.chosen.name,
      reasonCodes: reasons,
    };
  }

  // Standard corroboration counts distinct sources
  const distinctSources = new Set(signals.map((s) => s.source)).size;
  reasons.push(`Distinct sources: ${distinctSources}.`);

  let tier: Tier;
  if (distinctSources >= 3) {
    tier = "T3";
    reasons.push("3+ corroborating sources -> T3.");
  } else if (distinctSources >= 2) {
    tier = "T2";
    reasons.push(`2 corroborating sources -> T2 (${profile.t2WindowSeconds}s window).`);
  } else {
    tier = "T1";
    reasons.push("Single source -> T1 (alert only).");
  }

  let exitRoute: string | null = null;
  if (tier === "T3") {
    const route = selectRoute(policy.exitRoute, defaultLivenessProbe);
    exitRoute = route.chosen.name;
    reasons.push(`Exit route: ${route.chosen.name} - ${route.reason}`);
  }

  return {
    signals,
    windowMs: profile.t2WindowSeconds * 1000,
    tier,
    attackClass,
    attackProfile: profile,
    exitRoute,
    reasonCodes: reasons,
  };
}
