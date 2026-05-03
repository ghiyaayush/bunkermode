"use client";

import { useEffect, useState } from "react";
import PersonalizedMap from "./PersonalizedMap";
import type { DetectedPosition } from "@/lib/position-fetcher";
import type { Chain } from "@/lib/contagion-graph";

interface Props { address: string; chain: Chain }

export default function MapLoader({ address, chain }: Props) {
  const [positions, setPositions] = useState<DetectedPosition[] | null>(null);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/positions?address=${encodeURIComponent(address)}`, { signal: controller.signal })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "Failed to fetch positions");
        setPositions(data.positions ?? []);
      })
      .catch((e) => {
        if (e.name === "AbortError") return;
        setError("Could not fetch on-chain positions — showing full ecosystem map");
        setPositions([]);
      });
    return () => controller.abort();
  }, [address]);

  if (positions === null) {
    return (
      <div style={{ height: "100%", background: "#030712", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ width: 36, height: 36, border: "3px solid #1f2937", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "#6b7280", fontSize: 14 }}>Scanning wallet positions…</p>
        <p style={{ color: "#374151", fontSize: 12, fontFamily: "monospace" }}>{address.slice(0, 8)}…{address.slice(-6)}</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <PersonalizedMap address={address} chain={chain} positions={positions} error={error} />;
}
