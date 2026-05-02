import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { classifyAuditRisk, formatAuditDigest, type ProtocolGovernanceData } from "@/lib/audit";

/**
 * GET /api/audit?wallet=0x...
 *
 * P11: monthly proactive governance audit. Returns the Drift Three-Question
 * Screen results across all protocols in the user's portfolio, plus a
 * Telegram-ready digest.
 *
 * The portfolio is hardcoded to a representative set for the demo.
 * Production version would read from a portfolio indexer.
 */
const PORTFOLIO_GOVERNANCE: ProtocolGovernanceData[] = [
  {
    protocol: "Aave V3",
    timelockHours: 48,
    multisigM: 8,
    multisigN: 12,
    oracleType: "chainlink",
    adminCanAssignOracle: false,
  },
  {
    protocol: "Morpho",
    timelockHours: 72,
    multisigM: 5,
    multisigN: 9,
    oracleType: "pyth",
    adminCanAssignOracle: false,
  },
  {
    protocol: "Cetus CLMM",
    timelockHours: 24,
    multisigM: 3,
    multisigN: 5,
    oracleType: "internal",
    adminCanAssignOracle: false,
  },
  {
    protocol: "Sky USDS",
    timelockHours: 48,
    multisigM: 5,
    multisigN: 9,
    oracleType: "chainlink",
    adminCanAssignOracle: false,
  },
  {
    protocol: "New Protocol X",
    timelockHours: 0,
    multisigM: 2,
    multisigN: 5,
    oracleType: "admin",
    adminCanAssignOracle: true,
  },
];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const wallet = url.searchParams.get("wallet");
  if (!wallet) {
    return NextResponse.json({ error: "wallet required" }, { status: 400 });
  }

  const profiles = PORTFOLIO_GOVERNANCE.map(classifyAuditRisk);
  const month = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
  const digest = formatAuditDigest(profiles, month);

  // Persist
  const w = await db.wallet.upsert({
    where: { address: wallet.toLowerCase() },
    create: { address: wallet.toLowerCase() },
    update: {},
  });
  for (const p of profiles) {
    await db.audit.create({
      data: {
        walletId: w.id,
        protocol: p.protocol,
        timelock: p.timelockHours,
        multisigM: p.multisigM,
        multisigN: p.multisigN,
        oracleType: p.oracleType,
        driftScore: p.driftScore,
        riskLevel: p.riskLevel,
      },
    });
  }

  return NextResponse.json({ profiles, digest, month });
}
