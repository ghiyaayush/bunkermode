import { NextResponse } from "next/server";

/**
 * POST /api/dev/forta-replay
 *
 * Fires a fake Forta-shaped alert against /api/webhook/forta so the demo
 * has something to show without wiring real Forta. Three canned scenarios:
 *
 *   ?scenario=kelp     (default) — bridge_verifier on rsETH (CRITICAL)
 *   ?scenario=drift    — access_control on Drift (HIGH)
 *   ?scenario=oracle   — flash_loan_oracle on a generic protocol (HIGH)
 *
 * Disabled if NODE_ENV=production unless DEV_REPLAY_ENABLED=1.
 */

const SCENARIOS = {
  kelp: {
    alertId: "BRIDGE-VERIFIER-ANOMALY-1",
    alertHash: "0xkelp" + Date.now().toString(16),
    name: "LayerZero DVN Verifier Anomaly",
    severity: "CRITICAL" as const,
    protocol: "kelp",
    chainId: 1,
    addresses: [
      "0xA1290d69c65A6Fe4DF752f95823fae25cB99e5A7", // rsETH token
      "0xfA1fDbBD71B0aA16162D76914d69cD8CB3Ef92da", // arsETH (Aave receipt)
    ],
    transactionHash: "0xdeadbeef" + Date.now().toString(16),
    description: "1-of-1 DVN configuration detected on outbound message — bridge verifier compromise pattern",
    metadata: { asset: "rsETH", layerzero: true, dvnConfig: "1-of-1" },
    source: { url: "https://explorer.forta.network/alert/0xkelp-replay" },
  },
  drift: {
    alertId: "ACCESS-CONTROL-DURABLE-NONCE-" + Date.now(),
    name: "Solana Durable Nonce Pre-signing",
    severity: "HIGH" as const,
    protocol: "drift",
    chainId: 101,
    addresses: ["0x000000000000000000000000000000000000dead"],
    description: "Multisig durable nonce pre-signing pattern detected on admin account",
    metadata: { admin: true, multisig: "2-of-3" },
    source: { url: "https://explorer.forta.network/alert/drift-replay" },
  },
  oracle: {
    alertId: "ORACLE-DEVIATION-" + Date.now(),
    name: "Oracle Price Deviation Spike",
    severity: "HIGH" as const,
    protocol: "aave-v3",
    chainId: 1,
    addresses: ["0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"], // USDC
    transactionHash: "0xoracle" + Date.now().toString(16),
    description: "Oracle deviation 8% within 2-block window — flash loan oracle manipulation pattern",
    metadata: { deviation: 0.08 },
    source: { url: "https://explorer.forta.network/alert/oracle-replay" },
  },
};

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production" && process.env.DEV_REPLAY_ENABLED !== "1") {
    return NextResponse.json({ error: "disabled in production" }, { status: 403 });
  }

  const url = new URL(req.url);
  const scenario = (url.searchParams.get("scenario") ?? "kelp") as keyof typeof SCENARIOS;
  const payload = SCENARIOS[scenario];
  if (!payload) {
    return NextResponse.json(
      { error: `unknown scenario; pick one of ${Object.keys(SCENARIOS).join(", ")}` },
      { status: 400 },
    );
  }

  const target = new URL("/api/webhook/forta", url.origin);
  const body = JSON.stringify(payload);

  // If FORTA_WEBHOOK_SECRET is set, sign the body so the webhook accepts it
  let sig: string | undefined;
  if (process.env.FORTA_WEBHOOK_SECRET) {
    const { createHmac } = await import("crypto");
    sig = createHmac("sha256", process.env.FORTA_WEBHOOK_SECRET).update(body).digest("hex");
  }

  const res = await fetch(target.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(sig ? { "x-forta-signature": sig } : {}),
    },
    body,
  });

  const text = await res.text();
  let data: unknown = text;
  try {
    data = JSON.parse(text);
  } catch {
    // webhook returned HTML (e.g. Next dev error page) — keep raw text
  }
  return NextResponse.json({ scenario, status: res.status, webhookResponse: data });
}

export async function GET() {
  return NextResponse.json({
    scenarios: Object.keys(SCENARIOS),
    usage: "POST /api/dev/forta-replay?scenario=kelp",
  });
}
