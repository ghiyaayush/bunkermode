import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { corroborate } from "@/lib/corroborator";
import { computeThreatEnv, type RecentHack } from "@/lib/threat-multiplier";
import { mockUtilizationCurve, isLockoutImminent } from "@/lib/utilization";
import { validatePolicy } from "@/lib/policy";
import type { Signal } from "@/lib/types";

/**
 * GET /api/threat?wallet=0x...&since=ms
 *
 * Computes the current corroborated threat tier for a wallet by
 * pulling recent signals, the active threat environment, and the
 * utilization fast-track from P4.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const wallet = url.searchParams.get("wallet");
  const sinceMs = Number(url.searchParams.get("sinceMs") ?? 5 * 60 * 1000);
  const demoT = url.searchParams.get("demoT"); // demo console can drive a synthetic clock

  if (!wallet) {
    return NextResponse.json({ error: "wallet required" }, { status: 400 });
  }

  const w = await db.wallet.findUnique({
    where: { address: wallet.toLowerCase() },
    include: { policies: { where: { active: true }, take: 1 } },
  });
  if (!w || w.policies.length === 0) {
    return NextResponse.json({ error: "no active policy" }, { status: 404 });
  }
  const policy = validatePolicy(JSON.parse(w.policies[0].dsl));

  const signals = await db.signal.findMany({
    where: {
      receivedAt: { gte: new Date(Date.now() - sinceMs) },
      protocol: policy.protocol,
    },
    orderBy: { receivedAt: "desc" },
    take: 20,
  });

  // Map DB signals back to lib Signal shape
  const corroboratorSignals: Signal[] = signals.map((s) => ({
    source: s.source as Signal["source"],
    protocol: s.protocol,
    asset: s.asset ?? undefined,
    layer: s.layer as Signal["layer"],
    severity: s.severity as Signal["severity"],
    payload: s.rawPayload ? JSON.parse(s.rawPayload) : {},
  }));

  const recentHacks: RecentHack[] = [
    {
      protocol: "drift",
      lossUsd: 285_000_000,
      attributedToDprk: true,
      occurredAt: new Date("2026-04-01T12:00:00Z"),
    },
    {
      protocol: "kelp-dao",
      lossUsd: 292_000_000,
      attributedToDprk: true,
      occurredAt: new Date("2026-04-18T09:30:00Z"),
    },
  ];
  const threatEnv = computeThreatEnv(recentHacks);

  // P4 fast-track: in demo mode, drive utilization off the synthetic clock
  let utilization = 0.65;
  if (demoT !== null) {
    utilization = mockUtilizationCurve(Number(demoT));
  }
  const lockoutTriggered = isLockoutImminent(utilization, policy.rules.utilizationLockoutPct / 100);

  const state = corroborate({
    signals: corroboratorSignals,
    policy: {
      exitRoute: policy.rules.exitRoute,
      autoFireOn: policy.rules.autoFireOn,
      refuseOnSupplyChain: policy.rules.refuseOnSupplyChain,
    },
    threatEnv,
    utilizationLockoutTriggered: lockoutTriggered,
  });

  return NextResponse.json({
    state,
    threatEnv,
    utilization,
    lockoutTriggered,
    asOf: new Date().toISOString(),
  });
}
