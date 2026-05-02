"use client";

import type { Tier } from "@/lib/types";

const TIER_CONFIG: Record<Tier, { label: string; color: string; description: string }> = {
  T1: { label: "T1 / WATCH", color: "tier-watch", description: "Single source observed. Notification only." },
  T2: { label: "T2 / ELEVATED", color: "tier-elevated", description: "Two sources corroborated. Confirm to exit." },
  T3: { label: "T3 / CRITICAL", color: "tier-critical", description: "Auto-fire. Exit in progress." },
  REFUSED: { label: "REFUSED / SUPPLY CHAIN", color: "tier-refused", description: "Module B: refusing autonomous execution." },
};

export function ThreatTierIndicator({ tier }: { tier: Tier }) {
  const cfg = TIER_CONFIG[tier];
  return (
    <div className="bg-bunker-panel border border-bunker-border rounded-lg p-4">
      <div className="font-mono text-xs text-bunker-muted mb-1">CURRENT TIER</div>
      <div className={`text-2xl font-bold ${cfg.color}`}>{cfg.label}</div>
      <div className="text-sm text-bunker-muted mt-1">{cfg.description}</div>
    </div>
  );
}
