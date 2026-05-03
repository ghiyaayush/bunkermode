import { NextResponse } from "next/server";

/**
 * POST /api/webhook/hypernative — Phase 2 stub.
 *
 * Hypernative posts JSON like:
 *   {
 *     "id": "hn-...",
 *     "ruleName": "Anomalous outflow",
 *     "severity": "Critical",
 *     "chain": "ethereum",
 *     "addresses": ["0x..."],
 *     "txHash": "0x...",
 *     "details": { ... },
 *     "alertUrl": "https://app.hypernative.io/alerts/..."
 *   }
 *
 * To activate: implement a translator (lib/hypernative.ts) mirroring
 * lib/forta.ts, then mirror app/api/webhook/forta/route.ts here.
 */
export async function POST(_req: Request) {
  return NextResponse.json(
    { error: "hypernative webhook not yet implemented (Phase 2)" },
    { status: 501 },
  );
}
