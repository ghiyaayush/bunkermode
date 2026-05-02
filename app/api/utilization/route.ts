import { NextResponse } from "next/server";
import { mockUtilizationCurve, isLockoutImminent, estimateLockoutEta } from "@/lib/utilization";

/**
 * GET /api/utilization?demoT=N
 *
 * P4 utilization checker. In production this reads Aave V3 reserve data live.
 * For the demo it serves a deterministic curve driven by the demo console clock.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const t = Number(url.searchParams.get("demoT") ?? 0);
  const threshold = Number(url.searchParams.get("threshold") ?? 0.85);

  const utilization = mockUtilizationCurve(t);
  const lockoutTriggered = isLockoutImminent(utilization, threshold);
  const eta = estimateLockoutEta(utilization, 0.005);

  return NextResponse.json({
    asset: "rsETH/WETH",
    protocol: "aave-v3",
    utilization,
    threshold,
    lockoutTriggered,
    estimatedSecondsToLockout: eta,
    demoT: t,
  });
}
