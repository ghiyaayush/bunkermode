"use client";

import { SUPPLY_CHAIN_REFUSAL_MESSAGE } from "@/lib/postIncident";

export function SupplyChainRefusal() {
  return (
    <div className="bg-bunker-panel border-2 border-bunker-critical rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-mono text-bunker-critical text-sm">
          🚨 MODULE B / SUPPLY CHAIN MODE
        </div>
        <div className="font-mono text-xs text-bunker-muted">
          autonomous execution: DISABLED
        </div>
      </div>
      <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap text-bunker-text">
        {SUPPLY_CHAIN_REFUSAL_MESSAGE}
      </pre>
      <div className="text-xs text-bunker-muted border-t border-bunker-border pt-3">
        BunkerMode does not execute when the threat is on your device. The Bybit hack
        ($1.46B) succeeded because the signing interface was compromised. We cannot
        out-secure a compromised local environment - we can only refuse to amplify it.
      </div>
    </div>
  );
}
