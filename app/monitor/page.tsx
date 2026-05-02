"use client";

import { useEffect, useState } from "react";
import { ThreatTierIndicator } from "@/components/ThreatTier";
import { SupplyChainRefusal } from "@/components/SupplyChainRefusal";
import type { CorroboratorState, ThreatEnv } from "@/lib/types";

interface ThreatResponse {
  state: CorroboratorState;
  threatEnv: ThreatEnv;
  utilization: number;
  lockoutTriggered: boolean;
  asOf: string;
}

export default function MonitorPage() {
  const [wallet, setWallet] = useState<string>("");
  const [data, setData] = useState<ThreatResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const w = params.get("wallet") ?? "";
    setWallet(w);
  }, []);

  useEffect(() => {
    if (!wallet) return;
    const tick = async () => {
      try {
        const res = await fetch(`/api/threat?wallet=${wallet}`);
        const d = await res.json();
        if (!res.ok) throw new Error(d.error);
        setData(d);
      } catch (e) {
        setError(String(e));
      }
    };
    tick();
    const id = setInterval(tick, 2000);
    return () => clearInterval(id);
  }, [wallet]);

  if (!wallet) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-4">Monitor</h1>
        <p className="text-bunker-muted">
          Pass <code>?wallet=0x...</code> in the URL, or set up a policy first.
        </p>
        <a href="/setup" className="text-bunker-accent underline mt-4 inline-block">
          Go to Setup
        </a>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-4">Monitor</h1>
        <div className="text-bunker-danger font-mono text-sm">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-4">Monitor</h1>
        <div className="text-bunker-muted">Loading...</div>
      </div>
    );
  }

  const tier = data.state.tier;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <p className="font-mono text-bunker-muted text-sm">02 / MONITOR</p>
          <h1 className="text-3xl font-bold">Live threat state</h1>
          <p className="text-bunker-muted text-sm font-mono mt-1">{wallet}</p>
        </div>
        <div className="font-mono text-xs text-bunker-muted">
          <span className="live-dot"></span>
          Updated {new Date(data.asOf).toLocaleTimeString()}
        </div>
      </div>

      {tier === "REFUSED" ? (
        <SupplyChainRefusal />
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          <ThreatTierIndicator tier={tier} />
          <div className="bg-bunker-panel border border-bunker-border rounded-lg p-4">
            <div className="font-mono text-xs text-bunker-muted mb-1">P9 / ATTACK CLASS</div>
            <div className="text-xl font-semibold">
              {data.state.attackClass ?? "none"}
            </div>
            {data.state.attackProfile && (
              <div className="text-xs text-bunker-muted mt-1">
                Recovery: {(data.state.attackProfile.recoveryRate * 100).toFixed(2)}%
                {" / "}T2 window: {data.state.attackProfile.t2WindowSeconds}s
              </div>
            )}
          </div>
          <div className="bg-bunker-panel border border-bunker-border rounded-lg p-4">
            <div className="font-mono text-xs text-bunker-muted mb-1">P4 / UTILIZATION</div>
            <div
              className={`text-xl font-semibold ${
                data.lockoutTriggered ? "text-bunker-critical" : "text-bunker-accent"
              }`}
            >
              {(data.utilization * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-bunker-muted mt-1">
              {data.lockoutTriggered ? "LOCKOUT IMMINENT - fast-track active" : "below threshold"}
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-bunker-panel border border-bunker-border rounded-lg p-4">
          <div className="font-mono text-xs text-bunker-muted mb-2">P8 / THREAT ENVIRONMENT</div>
          <div
            className={`text-lg font-semibold ${
              data.threatEnv.level === "CRITICAL"
                ? "text-bunker-critical"
                : data.threatEnv.level === "ELEVATED"
                  ? "text-bunker-warn"
                  : "text-bunker-accent"
            }`}
          >
            {data.threatEnv.level}
          </div>
          <div className="text-sm text-bunker-muted mt-1">{data.threatEnv.reason}</div>
          <div className="text-xs font-mono text-bunker-muted mt-2">
            Window x{data.threatEnv.windowMultiplier} / Threshold x
            {data.threatEnv.thresholdMultiplier}
          </div>
        </div>

        <div className="bg-bunker-panel border border-bunker-border rounded-lg p-4">
          <div className="font-mono text-xs text-bunker-muted mb-2">P7 / EXIT ROUTE</div>
          <div className="text-lg font-semibold">
            {data.state.exitRoute ?? "not selected (no fire)"}
          </div>
          {data.state.exitRoute && (
            <div className="text-sm text-bunker-muted mt-1">
              Liveness verified at trigger time
            </div>
          )}
        </div>
      </div>

      <div className="bg-bunker-panel border border-bunker-border rounded-lg p-4">
        <div className="font-mono text-xs text-bunker-muted mb-2">REASONING</div>
        <ul className="text-sm space-y-1 font-mono">
          {data.state.reasonCodes.map((r, i) => (
            <li key={i} className="text-bunker-muted">
              · {r}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-bunker-panel border border-bunker-border rounded-lg p-4">
        <div className="font-mono text-xs text-bunker-muted mb-2">RECENT SIGNALS</div>
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="text-bunker-muted text-xs border-b border-bunker-border">
              <th className="text-left py-2">source</th>
              <th className="text-left py-2">protocol</th>
              <th className="text-left py-2">layer</th>
              <th className="text-left py-2">severity</th>
            </tr>
          </thead>
          <tbody>
            {data.state.signals.slice(0, 10).map((s, i) => (
              <tr key={i} className="border-b border-bunker-border/40">
                <td className="py-2">{s.source}</td>
                <td className="py-2">{s.protocol}</td>
                <td className="py-2">L{s.layer}</td>
                <td className="py-2">{s.severity}</td>
              </tr>
            ))}
            {data.state.signals.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-bunker-muted text-center">
                  no signals in window
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
