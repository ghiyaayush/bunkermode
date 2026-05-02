"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { detectChain } from "@/lib/known-contracts";

const EXAMPLES = [
  { label: "Vitalik (ETH)", address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" },
  { label: "Solana example", address: "7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q" },
];

export default function HomePage() {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");

  const chain = detectChain(address.trim());

  function submit(e: FormEvent) {
    e.preventDefault();
    const addr = address.trim();
    if (!addr) { setError("Enter a wallet address"); return; }
    if (detectChain(addr) === "unknown") { setError("Doesn't look like an Ethereum (0x…) or Solana address"); return; }
    router.push(`/map/${encodeURIComponent(addr)}`);
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#030712", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* Logo */}
      <div style={{ marginBottom: 48, textAlign: "center" }}>
        <div style={{ fontSize: 13, letterSpacing: "0.2em", color: "#4b5563", textTransform: "uppercase", marginBottom: 12 }}>BunkerMode</div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 700, color: "white", margin: 0, lineHeight: 1.15 }}>
          DeFi Contagion Map
        </h1>
        <p style={{ color: "#6b7280", marginTop: 12, fontSize: 16, maxWidth: 480, lineHeight: 1.6 }}>
          Enter your wallet to see which protocols you're exposed to and how a hack in one could cascade through your positions.
        </p>
      </div>

      {/* Input card */}
      <form onSubmit={submit} style={{ width: "100%", maxWidth: 520 }}>
        <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: "24px 24px 20px" }}>

          <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 8, letterSpacing: "0.05em" }}>
            WALLET ADDRESS
          </label>

          <div style={{ position: "relative" }}>
            <input
              value={address}
              onChange={e => { setAddress(e.target.value); setError(""); }}
              placeholder="0x… or Solana address"
              spellCheck={false}
              autoComplete="off"
              style={{
                width: "100%", padding: "12px 48px 12px 14px", borderRadius: 8,
                border: `1px solid ${error ? "#ef4444" : chain !== "unknown" && address ? "#3b82f6" : "#1e293b"}`,
                background: "#0f172a", color: "white", fontSize: 14,
                outline: "none", fontFamily: "monospace", boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
            />
            {chain !== "unknown" && address && (
              <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#3b82f6", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {chain.slice(0, 3)}
              </span>
            )}
          </div>

          {error && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 8 }}>{error}</p>}

          <button type="submit" style={{
            width: "100%", marginTop: 14, padding: "12px", borderRadius: 8,
            background: chain !== "unknown" && address ? "#2563eb" : "#1e293b",
            border: "none", color: chain !== "unknown" && address ? "white" : "#4b5563",
            fontWeight: 600, fontSize: 14, cursor: "pointer", transition: "background 0.15s",
          }}>
            Analyze Wallet →
          </button>
        </div>

        {/* Example addresses */}
        <div style={{ marginTop: 20 }}>
          <p style={{ color: "#374151", fontSize: 12, textAlign: "center", marginBottom: 10 }}>Try an example</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {EXAMPLES.map(ex => (
              <button key={ex.address} type="button"
                onClick={() => { setAddress(ex.address); setError(""); }}
                style={{ padding: "6px 12px", borderRadius: 6, background: "#111827", border: "1px solid #1f2937", color: "#9ca3af", fontSize: 12, cursor: "pointer" }}>
                {ex.label}
              </button>
            ))}
          </div>
        </div>
      </form>

      {/* How it works */}
      <div style={{ marginTop: 56, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, maxWidth: 520, width: "100%" }}>
        {[
          { icon: "🔍", title: "Detects Positions", body: "Scans for tokens, Aave deposits, Curve LP, staking receipts" },
          { icon: "🕸", title: "Maps Dependencies", body: "Shows 4-hop contagion paths through bridges, pools, DVNs" },
          { icon: "⚠️", title: "Surfaces Risk", body: "Flags shared-pool exposure, single-DVN bridges, slashing risk" },
        ].map(({ icon, title, body }) => (
          <div key={title} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: "16px 14px" }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#e5e7eb", marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.5 }}>{body}</div>
          </div>
        ))}
      </div>

      <p style={{ color: "#1f2937", fontSize: 11, marginTop: 40 }}>
        Read-only • No private keys • Public RPCs only
      </p>
    </div>
  );
}
