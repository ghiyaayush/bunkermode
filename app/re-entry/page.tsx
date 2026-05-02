"use client";

import { useEffect, useState } from "react";
import type { ReEntryStatus, LayerState } from "@/lib/reEntry";

interface Resp {
  status: ReEntryStatus;
  digest: string;
  week: number;
}

const FLAG: Record<LayerState, { text: string; cls: string }> = {
  GREEN: { text: "OK", cls: "text-bunker-accent" },
  YELLOW: { text: "WARN", cls: "text-bunker-warn" },
  RED: { text: "BLOCKED", cls: "text-bunker-critical" },
};

export default function ReEntryPage() {
  const [data, setData] = useState<Resp | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wallet = "0xdemoabc123456789demoabc123456789demoabc1";

  useEffect(() => {
    fetch(`/api/re-entry?wallet=${wallet}&protocol=kelp-dao&week=3`)
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setError(String(e)));
  }, []);

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-bunker-danger font-mono">{error}</div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-bunker-muted">Loading re-entry status...</div>
      </div>
    );
  }

  const s = data.status;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
      <div>
        <p className="font-mono text-bunker-muted text-sm">P10 + MODULE C / RE-ENTRY GATE</p>
        <h1 className="text-3xl font-bold">Re-entry verification</h1>
        <p className="text-bunker-muted mt-2 max-w-2xl">
          v1 told you when to leave. v2 tells you when it is safe to come back. All three trust
          layers must independently verify before BunkerMode unlocks re-entry. Cream Finance
          got hit twice three months apart. The vulnerability survived the first attack.
        </p>
      </div>

      <div className="bg-bunker-panel border border-bunker-border rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-mono text-xs text-bunker-muted">PROTOCOL</div>
            <div className="text-2xl font-bold">{s.protocol}</div>
            <div className="text-sm text-bunker-muted">
              Blocked since {new Date(s.blockedSince).toLocaleDateString()}
              {s.blockExpiresAt && (
                <> · auto-unblock at {new Date(s.blockExpiresAt).toLocaleDateString()}</>
              )}
            </div>
          </div>
          <div
            className={`text-right ${
              s.unlockable ? "text-bunker-accent" : "text-bunker-critical"
            }`}
          >
            <div className="text-sm font-mono text-bunker-muted">GATE</div>
            <div className="text-2xl font-bold">{s.unlockable ? "UNLOCKABLE" : "LOCKED"}</div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-bunker-panel border border-bunker-border rounded-lg p-5">
          <div className="flex justify-between mb-3">
            <div className="font-mono text-xs text-bunker-muted">TOKEN LAYER</div>
            <div className={`font-mono text-xs ${FLAG[s.tokenLayer.state].cls}`}>
              {FLAG[s.tokenLayer.state].text}
            </div>
          </div>
          <ul className="space-y-2 text-sm">
            <li>Whitelist reinstated: {bool(s.tokenLayer.whitelistReinstated)}</li>
            <li>Whitelist timelock: {s.tokenLayer.whitelistTimelockHours}h</li>
            <li>ERC-20 validated: {bool(s.tokenLayer.erc20Validated)}</li>
            <li>Honeypot detected: {bool(!s.tokenLayer.hasHoneypot)}</li>
            <li>Real liquidity: ${(s.tokenLayer.realLiquidityUsd / 1e6).toFixed(1)}M</li>
            <li>Liquidity pools: {s.tokenLayer.liquiditySpreadAcrossPools}</li>
          </ul>
        </div>

        <div className="bg-bunker-panel border border-bunker-border rounded-lg p-5">
          <div className="flex justify-between mb-3">
            <div className="font-mono text-xs text-bunker-muted">PRICE LAYER</div>
            <div className={`font-mono text-xs ${FLAG[s.priceLayer.state].cls}`}>
              {FLAG[s.priceLayer.state].text}
            </div>
          </div>
          <ul className="space-y-2 text-sm">
            <li>TWAP window: {s.priceLayer.twapWindowHours}h</li>
            <li>Feeds agreeing: {s.priceLayer.feedsAgreeing}</li>
            <li>Within tolerance: {bool(s.priceLayer.feedsWithinTolerance)}</li>
            <li>Deviation circuit breaker: {bool(s.priceLayer.deviationCircuitBreaker)}</li>
          </ul>
        </div>

        <div className="bg-bunker-panel border border-bunker-border rounded-lg p-5">
          <div className="flex justify-between mb-3">
            <div className="font-mono text-xs text-bunker-muted">GOVERNANCE LAYER</div>
            <div className={`font-mono text-xs ${FLAG[s.governanceLayer.state].cls}`}>
              {FLAG[s.governanceLayer.state].text}
            </div>
          </div>
          <ul className="space-y-2 text-sm">
            <li>Timelock: {s.governanceLayer.timelockHours}h</li>
            <li>
              Multisig: {s.governanceLayer.multisigM}/{s.governanceLayer.multisigN}
            </li>
            <li>Hardware wallets: {bool(s.governanceLayer.hasHardwareWallets)}</li>
            <li>All keys rotated: {bool(s.governanceLayer.allKeysRotated)}</li>
            <li>Durable nonce blocked: {bool(!s.governanceLayer.durableNoncePreSigningAllowed)}</li>
            <li>Audit published: {bool(!!s.governanceLayer.auditPublishedUrl)}</li>
          </ul>
        </div>
      </div>

      <div className="bg-bunker-panel border border-bunker-border rounded-lg p-5">
        <div className="font-mono text-xs text-bunker-muted mb-2">REASONING</div>
        <ul className="text-sm space-y-1 font-mono">
          {s.reasoning.map((r, i) => (
            <li key={i} className="text-bunker-muted">
              · {r}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-bunker-panel border border-bunker-border rounded-lg p-5">
        <div className="font-mono text-xs text-bunker-muted mb-2">
          WEEKLY TELEGRAM DIGEST PREVIEW (week {data.week})
        </div>
        <pre className="font-mono text-xs whitespace-pre-wrap leading-relaxed text-bunker-text">
{data.digest}
        </pre>
      </div>
    </div>
  );
}

function bool(b: boolean): string {
  return b ? "yes" : "no";
}
