import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fireWorkflow, chargeViaX402 } from "@/lib/keeperhub";
import { validatePolicy } from "@/lib/policy";
import { addBlock, createBlockEntry } from "@/lib/circuitBreaker";
import { POST_INCIDENT_SEQUENCE, fillTemplate } from "@/lib/postIncident";
import { enqueue } from "@/lib/scheduler";
import type { AttackClass } from "@/lib/types";

/**
 * POST /api/fire
 *
 * Executes a T3 fire. Calls KeeperHub (with viem fallback), records the
 * event, charges via x402, adds the protocol to the drained-pool circuit
 * breaker, and schedules the Module A post-incident message sequence.
 */
export async function POST(req: Request) {
  const body = await req.json();
  const { walletAddress, exitRoute, attackClass, reason, refused } = body as {
    walletAddress: string;
    exitRoute?: string;
    attackClass?: AttackClass;
    reason?: string;
    refused?: boolean;
  };

  if (!walletAddress) {
    return NextResponse.json({ error: "walletAddress required" }, { status: 400 });
  }

  const w = await db.wallet.findUnique({
    where: { address: walletAddress.toLowerCase() },
    include: { policies: { where: { active: true }, take: 1 } },
  });
  if (!w || w.policies.length === 0) {
    return NextResponse.json({ error: "no active policy" }, { status: 404 });
  }
  const policy = validatePolicy(JSON.parse(w.policies[0].dsl));

  // Module B: refusal path. No fire, no circuit breaker, no scheduling.
  if (refused) {
    const ev = await db.event.create({
      data: {
        walletId: w.id,
        policyId: w.policies[0].id,
        tier: "REFUSED",
        attackClass: attackClass ?? "supply_chain",
        outcome: "refused",
        notes: reason ?? "Module B refused autonomous execution.",
      },
    });
    return NextResponse.json({ ok: true, refused: true, eventId: ev.id });
  }

  if (!exitRoute || !attackClass) {
    return NextResponse.json({ error: "exitRoute and attackClass required" }, { status: 400 });
  }

  // 1) execute via KeeperHub (or fallback)
  const fired = await fireWorkflow({
    walletAddress,
    policyId: w.policies[0].id,
    exitRoute,
    attackClass,
    reason: reason ?? "T3 corroboration met",
  });

  // 2) charge via x402
  const charge = await chargeViaX402(walletAddress, fired.fees.x402Usd);

  // 3) record event
  const event = await db.event.create({
    data: {
      walletId: w.id,
      policyId: w.policies[0].id,
      tier: "T3",
      attackClass,
      exitRoute,
      outcome: fired.ok ? "executed" : "aborted",
      notes: [
        `KeeperHub via=${fired.via}`,
        `executionId=${fired.executionId}`,
        `gasUsd=${fired.fees.gasUsd}`,
        `x402Usd=${fired.fees.x402Usd}`,
        `x402Tx=${charge.txHash}`,
        `policyName=${policy.name}`,
      ].join(" | "),
    },
  });

  // 4) drained pool circuit breaker - block re-interaction for 14 days
  addBlock(
    walletAddress.toLowerCase(),
    createBlockEntry(policy.protocol, `T3 fire on ${attackClass}`),
  );

  // 5) schedule Module A post-incident timed messages
  const ctx = {
    attackClass,
    recoveryPct: "0.00",
    protocol: policy.protocol,
    protocolList: policy.protocol,
    affectedProtocols: "Aave V3, Morpho, SparkLend, Fluid",
    realizedLossUsd: "0",
    recoveredUsd: "0",
    netLossUsd: "0",
    reEntryStatus: "see /re-entry",
  };
  const messages = POST_INCIDENT_SEQUENCE.filter(
    (m) => m.applicableTo === "all" || m.applicableTo.includes(attackClass),
  );
  for (const m of messages) {
    enqueue(
      {
        id: `${event.id}-${m.delaySeconds}`,
        walletAddress,
        delayMs: m.delaySeconds * 1000,
        payload: {
          subject: m.subject,
          body: fillTemplate(m.body, ctx),
        },
        kind: "post-incident-message",
        createdAt: new Date(),
      },
      async (task) => {
        // In production: send via Telegram bot. Demo mode: log to stdout.
        console.log(
          `[scheduled] ${task.kind} for ${task.walletAddress} t+${task.delayMs / 1000}s:`,
          task.payload,
        );
      },
    );
  }

  return NextResponse.json({
    ok: true,
    eventId: event.id,
    keeperhub: fired,
    charge,
    moduleAScheduled: messages.length,
  });
}
