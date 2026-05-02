import { NextResponse } from "next/server";
import { COLLATERAL_FACTS, scoreCollateral, sensitivityMultiplier } from "@/lib/collateralRisk";

/**
 * GET /api/collateral-risk?asset=rsETH
 *
 * P3: returns the three-layer risk score for a given collateral asset
 * (token / bridge / verifier) plus the sensitivity multiplier we apply
 * to that asset's signals.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const asset = url.searchParams.get("asset");

  if (asset) {
    const facts = COLLATERAL_FACTS[asset];
    if (!facts) {
      return NextResponse.json({ error: `unknown asset: ${asset}` }, { status: 404 });
    }
    const score = scoreCollateral(facts);
    return NextResponse.json({
      asset,
      facts,
      score,
      sensitivityMultiplier: sensitivityMultiplier(score),
    });
  }

  const all = Object.values(COLLATERAL_FACTS).map((f) => {
    const s = scoreCollateral(f);
    return { asset: f.asset, score: s, sensitivityMultiplier: sensitivityMultiplier(s) };
  });
  return NextResponse.json({ assets: all });
}
