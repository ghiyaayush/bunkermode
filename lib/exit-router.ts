/**
 * P7: Know where you're going before you exit.
 *
 * "Exit" is not a complete strategy. During the April 2026 crisis, users who
 * exited to the wrong place took secondary losses:
 *   Curve 3pool → high slippage, everyone was doing the same thing
 *   USDT → briefly depegged 0.3% from supply pressure
 *   Stay on Ethereum → exposed to bad debt governance vote
 *
 * The ranked safe destinations are computed in calm times and verified at
 * exit time. Each destination has a liveness check.
 */

import type { ExitDestination } from "./types";

export const RANKED_SAFE_DESTINATIONS: ExitDestination[] = [
  {
    rank: 1,
    name: "usdc-base-cctp",
    description: "USDC on Base via Circle CCTP. Separated from Ethereum panic.",
    chainId: 8453,
    livenessCheck: "Circle CCTP attestation responding within 2s",
  },
  {
    rank: 2,
    name: "morpho-isolated",
    description: "Morpho isolated pool. Ring-fenced architecture, lowest contagion exposure.",
    chainId: 1,
    livenessCheck: "Target market not paused, utilization under 70%",
  },
  {
    rank: 3,
    name: "sparklend",
    description: "SparkLend. Architecturally insulated, gained $790M during the Kelp crisis.",
    chainId: 1,
    livenessCheck: "rsETH not present in collateral list, market open",
  },
  {
    rank: 4,
    name: "native-eth",
    description: "Native ETH in self-custody. No protocol dependency at all.",
    chainId: 1,
    livenessCheck: "always available",
  },
];

export interface RouteSelection {
  chosen: ExitDestination;
  reason: string;
  fallbacks: ExitDestination[];
}

/**
 * Pick the highest-ranked destination from the user's policy that passes
 * its liveness check. Falls back through the policy's exit route order.
 */
export function selectRoute(
  policyExitRoute: string[],
  livenessProbe: (name: string) => boolean,
): RouteSelection {
  const ordered = policyExitRoute
    .map((name) => RANKED_SAFE_DESTINATIONS.find((d) => d.name === name))
    .filter((d): d is ExitDestination => d !== undefined)
    .sort((a, b) => a.rank - b.rank);

  for (const dest of ordered) {
    if (livenessProbe(dest.name)) {
      return {
        chosen: dest,
        reason: `Rank ${dest.rank}: ${dest.description}`,
        fallbacks: ordered.filter((d) => d !== dest),
      };
    }
  }

  // Final fallback: native ETH always works
  const eth = RANKED_SAFE_DESTINATIONS.find((d) => d.name === "native-eth")!;
  return {
    chosen: eth,
    reason: "All policy destinations failed liveness; defaulting to native ETH self-custody.",
    fallbacks: [],
  };
}

/**
 * Default liveness probe used when no real probe is wired up. In production
 * each destination has a real check (CCTP attestation, market status, etc.)
 */
export function defaultLivenessProbe(name: string): boolean {
  // For the hackathon, all destinations always pass except in supply-chain mode
  return name !== "compromised";
}
