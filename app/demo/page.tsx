"use client";

import { useEffect, useRef, useState } from "react";
import { PnLChart } from "@/components/PnLChart";
import { SupplyChainRefusal } from "@/components/SupplyChainRefusal";
import type { CorroboratorState, ThreatEnv } from "@/lib/types";

interface ThreatResponse {
  state: CorroboratorState;
  threatEnv: ThreatEnv;
  utilization: number;
  lockoutTriggered: boolean;
}

const DEMO_WALLET = "0xdemoabc123456789demoabc123456789demoabc1";

interface DemoStep {
  t: number; // simulated seconds since incident
  label: string;
  signal?: { source: string; protocol: string; asset?: string; layer: 1 | 2 | 3 | 4 | 5; severity: string; payload?: Record<string, unknown> };
}

const KELP_TIMELINE: DemoStep[] = [
  { t: 0, label: "T+0s: Bridge drain detected on rsETH" },
  {
    t: 5,
    label: "T+5s: Forta alert ingested",
    signal: {
      source: "forta",
      protocol: "aave-v3",
      asset: "rsETH",
      layer: 1,
      severity: "ELEVATED",
      payload: { dvn: "1-of-1", rationale: "anomalous bridge outflow" },
    },
  },
  {
    t: 12,
    label: "T+12s: Hypernative confirms cross-chain anomaly",
    signal: {
      source: "hypernative",
      protocol: "aave-v3",
      asset: "rsETH",
      layer: 1,
      severity: "CRITICAL",
      payload: { layerzero: true, dprk: true, source_address: "0xLazarus..." },
    },
  },
  {
    t: 22,
    label: "T+22s: Twitter mass-mention spike for KelpDAO",
    signal: {
      source: "twitter",
      protocol: "aave-v3",
      asset: "rsETH",
      layer: 4,
      severity: "ELEVATED",
      payload: { mentions_per_min: 4200, sentiment: "panic" },
    },
  },
  { t: 30, label: "T+30s: P9 classifier confirms BRIDGE_VERIFIER class. Recovery rate ~0%." },
  { t: 50, label: "T+50s: Aave WETH market utilization crosses 85%. P4 fast-track armed." },
  { t: 90, label: "T+90s: T3 fires. KeeperHub workflow executes exit to USDC on Base via CCTP." },
  { t: 120, label: "T+2min: x402 charged $2.50. Exit complete." },
];

export default function DemoPage() {
  const [running, setRunning] = useState(false);
  const [t, setT] = useState(0);
  const [data, setData] = useState<ThreatResponse | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [fired, setFired] = useState(false);
  const [refused, setRefused] = useState(false);
  const [showPnl, setShowPnl] = useState(false);
  const sentSignals = useRef<Set<number>>(new Set());

  // Reset demo state
  async function reset() {
    setT(0);
    setLogs([]);
    setFired(false);
    setRefused(false);
    setShowPnl(false);
    sentSignals.current = new Set();
    await fetch("/api/demo/reset", { method: "POST" }).catch(() => undefined);
    appendLog("[demo] reset complete");
  }

  function appendLog(line: string) {
    setLogs((prev) => [...prev.slice(-30), line]);
  }

  // Drive the demo clock
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setT((tt) => tt + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  // Send signals as the clock advances
  useEffect(() => {
    if (!running) return;
    KELP_TIMELINE.forEach(async (step) => {
      if (step.signal && t >= step.t && !sentSignals.current.has(step.t)) {
        sentSignals.current.add(step.t);
        appendLog(`[t+${step.t}s] ${step.label}`);
        await fetch("/api/signal", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-bunker-secret": "dev-secret-change-me",
          },
          body: JSON.stringify(step.signal),
        });
      } else if (!step.signal && t >= step.t && !sentSignals.current.has(step.t)) {
        sentSignals.current.add(step.t);
        appendLog(`[t+${step.t}s] ${step.label}`);
      }
    });

    // Auto-fire when T3 + show PnL chart at end
    if (t >= 90 && !fired) {
      setFired(true);
      void (async () => {
        const res = await fetch("/api/fire", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress: DEMO_WALLET,
            exitRoute: "usdc-base-cctp",
            attackClass: "bridge_verifier",
            reason: "P4 utilization fast-track + multi-source corroboration",
          }),
        });
        const d = await res.json();
        appendLog(
          `[fire] keeperhub=${d.keeperhub?.via} exec=${d.keeperhub?.executionId} x402=$${d.keeperhub?.fees?.x402Usd}`,
        );
      })();
    }

    if (t >= 130 && !showPnl) {
      setShowPnl(true);
    }
  }, [t, running, fired, showPnl]);

  // Poll threat state
  useEffect(() => {
    if (!running) return;
    const tick = async () => {
      const res = await fetch(`/api/threat?wallet=${DEMO_WALLET}&demoT=${t}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [running, t]);

  async function triggerSupplyChain() {
    setRefused(true);
    appendLog("[demo] simulating supply chain compromise");
    await fetch("/api/signal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bunker-secret": "dev-secret-change-me",
      },
      body: JSON.stringify({
        source: "supply_chain",
        protocol: "aave-v3",
        layer: 5,
        severity: "CRITICAL",
        payload: { trigger: "malicious VS Code extension confirmed" },
      }),
    });
    await fetch("/api/fire", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletAddress: DEMO_WALLET,
        attackClass: "supply_chain",
        refused: true,
        reason: "Module B: refusing autonomous execution",
      }),
    });
    appendLog("[fire] REFUSED - Module B engaged");
  }

  async function startDemo() {
    // Ensure demo wallet has a policy
    await fetch("/api/policy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress: DEMO_WALLET, templateKey: "aave-rseth-cascade" }),
    });
    setRunning(true);
    appendLog("[demo] Kelp incident replay initiated");
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-6">
      <div>
        <p className="font-mono text-bunker-muted text-sm">03 / DEMO</p>
        <h1 className="text-3xl font-bold">KelpDAO replay</h1>
        <p className="text-bunker-muted">
          Simulates the April 18, 2026 incident timeline with the demo wallet protected by
          BunkerMode v2.
        </p>
      </div>

      <div className="bg-bunker-panel border border-bunker-border rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={startDemo}
            disabled={running}
            className="bg-bunker-accent text-bunker-bg px-4 py-2 rounded font-mono text-sm disabled:opacity-50"
          >
            ▶ Start Kelp replay
          </button>
          <button
            onClick={reset}
            className="bg-bunker-bg border border-bunker-border px-4 py-2 rounded font-mono text-sm"
          >
            ⟲ Reset
          </button>
          <button
            onClick={triggerSupplyChain}
            disabled={refused}
            className="bg-bunker-bg border border-bunker-critical text-bunker-critical px-4 py-2 rounded font-mono text-sm disabled:opacity-50"
          >
            🚨 Module B: trigger supply chain
          </button>
          <div className="ml-auto font-mono text-xs text-bunker-muted">
            t = {t}s {fired && "/ T3 FIRED"} {refused && "/ REFUSED"}
          </div>
        </div>

        {refused && <SupplyChainRefusal />}

        {data && !refused && (
          <div className="grid grid-cols-4 gap-3 text-sm">
            <div className="bg-bunker-bg border border-bunker-border rounded p-3">
              <div className="font-mono text-xs text-bunker-muted">tier</div>
              <div className="text-lg font-semibold">{data.state.tier}</div>
            </div>
            <div className="bg-bunker-bg border border-bunker-border rounded p-3">
              <div className="font-mono text-xs text-bunker-muted">attack class</div>
              <div className="text-lg font-semibold">
                {data.state.attackClass ?? "—"}
              </div>
            </div>
            <div className="bg-bunker-bg border border-bunker-border rounded p-3">
              <div className="font-mono text-xs text-bunker-muted">utilization</div>
              <div
                className={`text-lg font-semibold ${
                  data.lockoutTriggered ? "text-bunker-critical" : ""
                }`}
              >
                {(data.utilization * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-bunker-bg border border-bunker-border rounded p-3">
              <div className="font-mono text-xs text-bunker-muted">exit route</div>
              <div className="text-lg font-semibold">
                {data.state.exitRoute ?? "—"}
              </div>
            </div>
          </div>
        )}

        <div className="bg-black/40 rounded p-4 font-mono text-xs h-48 overflow-y-auto border border-bunker-border">
          {logs.length === 0 ? (
            <div className="text-bunker-muted">awaiting input...</div>
          ) : (
            logs.map((l, i) => (
              <div key={i} className="text-bunker-text/80">
                {l}
              </div>
            ))
          )}
        </div>
      </div>

      {showPnl && <PnLChart />}
    </div>
  );
}
