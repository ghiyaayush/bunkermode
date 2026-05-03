import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/alerts
 *
 * Returns recent webhook signals + their dedup state for the /alerts UI.
 * Read-only, used by the alerts page to surface the Forta pipeline activity.
 */
export async function GET() {
  const [signals, dedup] = await Promise.all([
    db.signal.findMany({
      orderBy: { receivedAt: "desc" },
      take: 50,
    }),
    db.alertDedup.findMany({
      orderBy: { lastSeen: "desc" },
      take: 50,
    }),
  ]);

  return NextResponse.json({
    signals: signals.map((s) => ({
      id: s.id,
      source: s.source,
      protocol: s.protocol,
      asset: s.asset,
      layer: s.layer,
      severity: s.severity,
      receivedAt: s.receivedAt,
      payload: safeParse(s.rawPayload),
    })),
    dedup: dedup.map((d) => ({
      key: d.key,
      provider: d.provider,
      walletId: d.walletId,
      count: d.count,
      firstSeen: d.firstSeen,
      lastSeen: d.lastSeen,
      expiresAt: d.expiresAt,
    })),
  });
}

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
