/**
 * P4: Utilization is the lockout signal.
 *
 * When a DeFi protocol gets drained, the mechanism that traps you is not the
 * exploit. It is utilization climbing toward 100%. At 100% utilization,
 * withdrawals are impossible.
 *
 * The Aave WETH market hit 100% utilization 7 hours BEFORE the Protocol
 * Guardian officially froze the rsETH market. Anyone waiting for the
 * announcement was already locked.
 *
 * BunkerMode T3 fast-tracks at 85% - the last exit ramp.
 * 95% is the wall.
 */

import { createPublicClient, http, parseAbi } from "viem";
import { mainnet } from "viem/chains";

const AAVE_V3_POOL_ADDRESS = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2" as const;

const reserveAbi = parseAbi([
  "function getReserveData(address asset) external view returns (uint256, uint128, uint128, uint128, uint128, uint128, uint40, uint16, address, address, address, address, uint128, uint128, uint128)",
]);

export interface UtilizationReading {
  protocol: string;
  asset: string;
  totalSupply: bigint;
  totalBorrow: bigint;
  utilization: number; // 0..1
  observedAt: Date;
}

/**
 * Read utilization for a given asset on Aave V3.
 * Falls back to mocked data if RPC is unavailable (hackathon mode).
 */
export async function readAaveUtilization(
  assetAddress: `0x${string}`,
  rpcUrl?: string,
): Promise<UtilizationReading | null> {
  try {
    const client = createPublicClient({
      chain: mainnet,
      transport: http(rpcUrl ?? "https://eth.llamarpc.com"),
    });
    const data = await client.readContract({
      address: AAVE_V3_POOL_ADDRESS,
      abi: reserveAbi,
      functionName: "getReserveData",
      args: [assetAddress],
    });
    // Index 12 = aTokenSupply (representing total supply)
    // Index 13 = totalDebt (total borrow). This shape mirrors Aave V3's tuple.
    const totalSupply = data[12];
    const totalBorrow = data[13];
    const utilization =
      totalSupply > 0n ? Number((totalBorrow * 10_000n) / totalSupply) / 10_000 : 0;
    return {
      protocol: "aave-v3",
      asset: assetAddress,
      totalSupply,
      totalBorrow,
      utilization,
      observedAt: new Date(),
    };
  } catch {
    return null;
  }
}

/**
 * Mock reading for hackathon demo. Walks utilization upward to simulate
 * the Kelp cascade. Used by the demo console to drive the live demo.
 */
export function mockUtilizationCurve(secondsSinceIncident: number): number {
  // T+0 to T+30s: normal 65%
  if (secondsSinceIncident < 30) return 0.65;
  // T+30 to T+50: rapid climb as panic withdrawals start
  if (secondsSinceIncident < 50) return 0.65 + ((secondsSinceIncident - 30) / 20) * 0.2; // 0.65 → 0.85
  // T+50 to T+90: continues to climb as supply leaves faster than borrows can repay
  if (secondsSinceIncident < 90) return 0.85 + ((secondsSinceIncident - 50) / 40) * 0.13; // 0.85 → 0.98
  // T+90+: 100% locked
  return 1.0;
}

export function isLockoutImminent(utilization: number, threshold: number = 0.85): boolean {
  return utilization >= threshold;
}

/**
 * Returns time-until-lockout estimate in seconds, given current utilization
 * and rate of change. Used for the Monitor screen countdown.
 */
export function estimateLockoutEta(
  current: number,
  ratePerSec: number,
): number | null {
  if (current >= 1) return 0;
  if (ratePerSec <= 0) return null;
  return Math.max(0, (1 - current) / ratePerSec);
}
