import { NextResponse } from "next/server";
import { evaluateReEntry, formatReEntryDigest } from "@/lib/reEntry";
import { getBlocks } from "@/lib/circuitBreaker";

/**
 * GET /api/re-entry?wallet=0x...&protocol=...&week=N
 *
 * Returns the current re-entry status for a protocol the user has been
 * forced out of. P10 + Module C combined.
 *
 * For the demo, the protocol checks are stubbed with realistic mid-recovery
 * values. Production version pulls from on-chain governance state.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const wallet = url.searchParams.get("wallet");
  const protocol = url.searchParams.get("protocol") ?? "kelp-dao";
  const week = Number(url.searchParams.get("week") ?? 3);

  if (!wallet) {
    return NextResponse.json({ error: "wallet required" }, { status: 400 });
  }

  const blocks = getBlocks(wallet);
  const block = blocks.find((b) => b.protocol === protocol);

  // Mid-recovery snapshot - some layers green, others not
  const status = evaluateReEntry({
    protocol,
    blockedSince: block?.blockedSince ?? new Date("2026-04-18T09:30:00Z"),
    blockDurationDays: 14,
    tokenChecks: {
      whitelistReinstated: true,
      whitelistTimelockHours: 48,
      erc20Validated: true,
      hasFeeOnTransfer: false,
      hasHoneypot: false,
      realLiquidityUsd: 12_000_000,
      liquiditySpreadAcrossPools: 3,
    },
    priceChecks: {
      twapWindowHours: 24,
      feedsAgreeing: 2,
      feedsWithinTolerance: true,
      deviationCircuitBreaker: true,
    },
    governanceChecks: {
      timelockHours: 48,
      multisigM: 2,
      multisigN: 5,
      hasHardwareWallets: true,
      allKeysRotated: false,
      durableNoncePreSigningAllowed: false,
      auditPublishedUrl: null,
    },
  });

  return NextResponse.json({
    status,
    digest: formatReEntryDigest(status, week),
    week,
  });
}
