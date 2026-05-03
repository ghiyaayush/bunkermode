import { NextResponse } from "next/server";

/**
 * POST /api/webhook/cyvers — Phase 2 stub.
 *
 * Cyvers posts JSON like:
 *   {
 *     "alertId": "cy-...",
 *     "title": "Suspicious approval pattern",
 *     "riskScore": 92,
 *     "chain": "Ethereum",
 *     "victimAddresses": ["0x..."],
 *     "attackerAddresses": ["0x..."],
 *     "txHashes": ["0x..."],
 *     "category": "approval_drainer",
 *     "url": "https://app.cyvers.ai/..."
 *   }
 *
 * To activate: implement lib/cyvers.ts mirroring lib/forta.ts and wire
 * the same dispatch path used by /api/webhook/forta.
 */
export async function POST(_req: Request) {
  return NextResponse.json(
    { error: "cyvers webhook not yet implemented (Phase 2)" },
    { status: 501 },
  );
}
