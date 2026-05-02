import { NextRequest, NextResponse } from "next/server";
import { detectChain } from "@/lib/known-contracts";
import { fetchEthereumPositions, fetchSolanaPositions } from "@/lib/position-fetcher";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address")?.trim();
  if (!address) return NextResponse.json({ error: "address required" }, { status: 400 });

  const chain = detectChain(address);
  if (chain === "unknown") return NextResponse.json({ error: "Unrecognised address format" }, { status: 400 });

  try {
    const positions = chain === "ethereum"
      ? await fetchEthereumPositions(address)
      : await fetchSolanaPositions(address);

    return NextResponse.json({ address, chain, positions });
  } catch (err) {
    console.error("position fetch error", err);
    return NextResponse.json({ error: "Failed to fetch positions" }, { status: 500 });
  }
}
