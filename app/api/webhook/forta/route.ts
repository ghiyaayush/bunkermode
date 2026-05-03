import { NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import {
  FortaAlert,
  fortaToSignal,
  fortaTier,
  fortaAttackClassHint,
  verifyFortaSignature,
} from "@/lib/forta";
import { mapAddressesToNodeIds, expandToDownstreamNodes } from "@/lib/forta-address-mapper";
import { dispatchAlert, resolveTargets, type DispatchAlert } from "@/lib/telegram-dispatch";

/**
 * POST /api/webhook/forta
 *
 * Pipeline:
 *   1. HMAC verify (X-Forta-Signature against FORTA_WEBHOOK_SECRET)
 *   2. Validate payload (zod)
 *   3. Persist normalized Signal in Prisma (BunkerMode v2 audit trail)
 *   4. Map alert.addresses -> contagion-graph node IDs
 *   5. Walk contagion BFS to surface downstream-exposed nodes
 *   6. For each node, query Supabase for chat_ids with exposure
 *   7. Collapse to one target per chat (highest-weight exposure)
 *   8. Dispatch via Gyan's BOT_TOKEN with dedup (Prisma AlertDedup)
 */
export async function POST(req: Request) {
  const rawBody = await req.text();
  const secret = process.env.FORTA_WEBHOOK_SECRET;

  if (secret) {
    const sig = req.headers.get("x-forta-signature");
    if (!verifyFortaSignature(rawBody, sig, secret)) {
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = FortaAlert.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid forta alert", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const alert = parsed.data;

  // 1. Persist normalized signal (audit trail)
  const signal = fortaToSignal(alert);
  const stored = await prisma.signal.create({
    data: {
      source: signal.source,
      protocol: signal.protocol,
      asset: signal.asset,
      layer: signal.layer,
      severity: signal.severity,
      rawPayload: JSON.stringify(signal.payload ?? {}),
    },
  });

  // 2. Address -> node_id
  const directNodeIds = mapAddressesToNodeIds(alert.addresses);
  if (directNodeIds.length === 0) {
    return NextResponse.json({
      ok: true,
      signalId: stored.id,
      mappedNodes: 0,
      reason: "no addresses mapped to known graph nodes",
    });
  }

  // 3. Expand to downstream contagion
  const exposureNodes = expandToDownstreamNodes(directNodeIds);

  // 4. Resolve to per-chat dispatch targets via Supabase
  const targets = await resolveTargets(exposureNodes);
  if (targets.length === 0) {
    return NextResponse.json({
      ok: true,
      signalId: stored.id,
      mappedNodes: directNodeIds.length,
      cascadeNodes: exposureNodes.length,
      targets: 0,
    });
  }

  // 5. Build dispatch payload + send
  const dispatch: DispatchAlert = {
    provider: "forta",
    alertId: alert.alertHash ?? alert.alertId,
    name: alert.name,
    tier: fortaTier(alert),
    attackClass: fortaAttackClassHint(alert),
    protocol: alert.protocol ?? "unknown",
    chainId: alert.chainId,
    txHash: alert.transactionHash,
    description: alert.description,
    url: alert.source?.url,
  };

  const results = await Promise.all(targets.map((t) => dispatchAlert(dispatch, t)));

  return NextResponse.json({
    ok: true,
    signalId: stored.id,
    mappedNodes: directNodeIds.length,
    cascadeNodes: exposureNodes.length,
    targets: targets.length,
    delivered: results.filter((r) => r.delivered).length,
    deduped: results.filter((r) => r.dedupHit).length,
    results,
  });
}
