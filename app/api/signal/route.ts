import { NextResponse } from "next/server";
import { Signal } from "@/lib/types";
import { db } from "@/lib/db";

/**
 * POST /api/signal
 * Receives a threat signal from a feed (Forta, Hypernative, Twitter, etc.)
 * or from the demo console.
 *
 * Validates with Zod, stores in DB, returns the signal id.
 */
export async function POST(req: Request) {
  const auth = req.headers.get("x-bunker-secret");
  if (process.env.SIGNAL_WEBHOOK_SECRET && auth !== process.env.SIGNAL_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = Signal.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid signal", issues: parsed.error.issues }, { status: 400 });
  }

  const sig = await db.signal.create({
    data: {
      source: parsed.data.source,
      protocol: parsed.data.protocol,
      asset: parsed.data.asset,
      layer: parsed.data.layer,
      severity: parsed.data.severity,
      rawPayload: JSON.stringify(parsed.data.payload ?? {}),
    },
  });

  return NextResponse.json({ ok: true, id: sig.id });
}

export async function GET() {
  const recent = await db.signal.findMany({
    orderBy: { receivedAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ signals: recent });
}
