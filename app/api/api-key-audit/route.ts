import { NextResponse } from "next/server";
import { auditApiKey, summarizeAudit, type ApiKeyEntry } from "@/lib/apiKeyAudit";

/**
 * POST /api/api-key-audit
 *
 * Body: { keys: ApiKeyEntry[] }
 * Returns: per-key risk findings + summary
 *
 * The user feeds their inventory of API keys (manually or via export
 * from password manager). We score each one and return revocation
 * recommendations.
 */
export async function POST(req: Request) {
  const body = await req.json();
  const keys = (body.keys ?? []) as ApiKeyEntry[];

  // Re-hydrate Date objects
  const hydrated = keys.map((k) => ({
    ...k,
    createdAt: new Date(k.createdAt),
    lastUsed: k.lastUsed ? new Date(k.lastUsed) : null,
  }));

  const findings = hydrated.map((k) => auditApiKey(k));
  const summary = summarizeAudit(findings);

  return NextResponse.json({ findings, summary });
}

/**
 * GET /api/api-key-audit/example
 *
 * Returns a sample audit using a representative key inventory.
 */
export async function GET() {
  const sampleKeys: ApiKeyEntry[] = [
    {
      service: "binance",
      label: "Main trading bot",
      createdAt: new Date("2023-06-15"),
      lastUsed: new Date("2026-04-30"),
      permissions: ["read", "trade", "withdraw"],
      ipWhitelist: [],
      hasWithdrawalEnabled: true,
      appearsForgotten: false,
    },
    {
      service: "bybit",
      label: "Funding arb (legacy)",
      createdAt: new Date("2024-03-20"),
      lastUsed: new Date("2025-11-01"),
      permissions: ["read", "trade", "futures"],
      ipWhitelist: ["1.2.3.4"],
      hasWithdrawalEnabled: false,
      appearsForgotten: true,
    },
    {
      service: "coinbase",
      label: "Read-only dashboard",
      createdAt: new Date("2025-09-01"),
      lastUsed: new Date("2026-05-01"),
      permissions: ["read"],
      ipWhitelist: ["1.2.3.4"],
      hasWithdrawalEnabled: false,
      appearsForgotten: false,
    },
    {
      service: "okx",
      label: "Old account, unused",
      createdAt: new Date("2022-04-10"),
      lastUsed: null,
      permissions: ["read", "trade", "withdraw", "transfer", "futures", "margin"],
      ipWhitelist: [],
      hasWithdrawalEnabled: true,
      appearsForgotten: true,
    },
  ];
  const findings = sampleKeys.map((k) => auditApiKey(k));
  const summary = summarizeAudit(findings);
  return NextResponse.json({ findings, summary });
}
