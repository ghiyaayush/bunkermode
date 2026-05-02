import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { listTemplates, loadTemplate, validatePolicy, type TemplateKey } from "@/lib/policy";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const wallet = url.searchParams.get("wallet");

  if (url.searchParams.get("templates") === "1") {
    return NextResponse.json({ templates: listTemplates() });
  }

  if (!wallet) {
    return NextResponse.json({ error: "wallet required" }, { status: 400 });
  }

  const w = await db.wallet.findUnique({
    where: { address: wallet.toLowerCase() },
    include: { policies: true },
  });
  return NextResponse.json({ policies: w?.policies ?? [] });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { walletAddress, templateKey, dsl } = body as {
    walletAddress: string;
    templateKey?: TemplateKey;
    dsl?: unknown;
  };

  if (!walletAddress) {
    return NextResponse.json({ error: "walletAddress required" }, { status: 400 });
  }

  const policy = templateKey ? loadTemplate(templateKey) : validatePolicy(dsl);

  const wallet = await db.wallet.upsert({
    where: { address: walletAddress.toLowerCase() },
    create: { address: walletAddress.toLowerCase() },
    update: {},
  });

  const created = await db.policy.create({
    data: {
      walletId: wallet.id,
      name: policy.name,
      templateKey: policy.templateKey,
      dsl: JSON.stringify(policy),
    },
  });

  return NextResponse.json({ ok: true, policyId: created.id, policy });
}
