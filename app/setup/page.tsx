"use client";

import { useEffect, useState } from "react";
import { WalletConnect } from "@/components/WalletConnect";
import PersonalizedMap from "@/components/PersonalizedMap";
import type { DetectedPosition } from "@/lib/position-fetcher";
import type { Chain } from "@/lib/contagion-graph";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Template {
  key: string;
  name: string;
  asset: string;
  protocol: string;
}

interface PolicyRule {
  utilizationLockoutPct?: number;
  autoFireOn?: string[];
  exitRoute?: string[];
  reEntryGate?: boolean;
  refuseOnSupplyChain?: boolean;
  hardwareWalletAbove?: number;
}

interface Policy {
  id: string;
  name: string;
  templateKey: string | null;
  active: boolean;
  createdAt: string;
  dsl: string; // JSON string of BunkerPolicy
}

type Tab = "positions" | "policy";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function detectChainClient(address: string): Chain | "unknown" {
  if (/^0x[0-9a-fA-F]{40}$/.test(address)) return "ethereum";
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) return "solana";
  return "unknown";
}

function isValidAddress(addr: string): boolean {
  return detectChainClient(addr) !== "unknown";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PolicyViewer({ policy }: { policy: Policy }) {
  let rules: PolicyRule = {};
  try { rules = JSON.parse(policy.dsl)?.rules ?? {}; } catch { /* ignore */ }

  return (
    <div style={{ padding: "24px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "white" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, color: "#3b82f6", fontWeight: 600, letterSpacing: "0.08em", marginBottom: 4 }}>ACTIVE POLICY</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{policy.name}</div>
          <div style={{ fontSize: 12, color: "#6b7280", fontFamily: "monospace", marginTop: 4 }}>
            id: {policy.id} · created {new Date(policy.createdAt).toLocaleDateString()}
          </div>
        </div>
        <span style={{ padding: "4px 10px", borderRadius: 20, background: policy.active ? "#14532d" : "#1c1917", color: policy.active ? "#22c55e" : "#6b7280", fontSize: 11, fontWeight: 600 }}>
          {policy.active ? "ACTIVE" : "INACTIVE"}
        </span>
      </div>

      {/* Template info */}
      {policy.templateKey && (
        <div style={{ background: "#0f172a", border: "1px solid #1f2937", borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>TEMPLATE</div>
          <div style={{ fontFamily: "monospace", fontSize: 13, color: "#93c5fd" }}>{policy.templateKey}</div>
        </div>
      )}

      {/* Rules grid */}
      <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, letterSpacing: "0.08em", marginBottom: 10 }}>RULES</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        <RuleCard label="Utilization Lockout" value={rules.utilizationLockoutPct != null ? `${rules.utilizationLockoutPct}%` : "—"} />
        <RuleCard label="Hardware Wallet Above" value={rules.hardwareWalletAbove != null ? `$${rules.hardwareWalletAbove.toLocaleString()}` : "—"} />
        <RuleCard label="Re-entry Gate" value={rules.reEntryGate ? "Enabled" : "Disabled"} accent={rules.reEntryGate} />
        <RuleCard label="Refuse Supply Chain" value={rules.refuseOnSupplyChain ? "Enabled" : "Disabled"} accent={rules.refuseOnSupplyChain} />
      </div>

      {/* Auto-fire classes */}
      {rules.autoFireOn && rules.autoFireOn.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, letterSpacing: "0.08em", marginBottom: 8 }}>AUTO-FIRE ON</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {rules.autoFireOn.map((cls) => (
              <span key={cls} style={{ padding: "4px 10px", borderRadius: 4, background: "#7f1d1d33", border: "1px solid #dc262655", color: "#fca5a5", fontFamily: "monospace", fontSize: 12 }}>
                {cls}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Exit routes */}
      {rules.exitRoute && rules.exitRoute.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, letterSpacing: "0.08em", marginBottom: 8 }}>EXIT ROUTE (priority order)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {rules.exitRoute.map((route, i) => (
              <div key={route} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#0f172a", border: "1px solid #1f2937", borderRadius: 6 }}>
                <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#14532d", color: "#22c55e", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {i + 1}
                </span>
                <span style={{ fontFamily: "monospace", fontSize: 12, color: "#d1d5db" }}>{route}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RuleCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ background: "#0f172a", border: "1px solid #1f2937", borderRadius: 8, padding: "12px 14px" }}>
      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: accent ? "#22c55e" : "#e5e7eb", fontFamily: "monospace" }}>{value}</div>
    </div>
  );
}

function EmptyState({ message, sub }: { message: string; sub?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, color: "#6b7280", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ fontSize: 32, opacity: 0.4 }}>⬡</div>
      <div style={{ fontSize: 14 }}>{message}</div>
      {sub && <div style={{ fontSize: 12, color: "#374151" }}>{sub}</div>}
    </div>
  );
}

function Spinner({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ width: 32, height: 32, border: "3px solid #1f2937", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ color: "#6b7280", fontSize: 13 }}>{label}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SetupPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [walletAddress, setWalletAddress] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("aave-rseth-cascade");
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ id: string } | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>("positions");

  // Positions state
  const [positions, setPositions] = useState<DetectedPosition[] | null>(null);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [positionsError, setPositionsError] = useState<string | undefined>();

  // Policy state
  const [policies, setPolicies] = useState<Policy[] | null>(null);
  const [policiesLoading, setPoliciesLoading] = useState(false);

  const chain: Chain | "unknown" = detectChainClient(walletAddress);
  const validAddress = isValidAddress(walletAddress);

  // Fetch templates once
  useEffect(() => {
    fetch("/api/policy?templates=1")
      .then((r) => r.json())
      .then((d) => setTemplates(d.templates ?? []))
      .catch(() => {});
  }, []);

  // Fetch positions when wallet address changes (debounced)
  useEffect(() => {
    if (!validAddress) {
      setPositions(null);
      setPositionsError(undefined);
      return;
    }
    setPositionsLoading(true);
    setPositions(null);
    setPositionsError(undefined);

    const timer = setTimeout(() => {
      const controller = new AbortController();
      fetch(`/api/positions?address=${encodeURIComponent(walletAddress)}`, { signal: controller.signal })
        .then(async (r) => {
          const data = await r.json();
          if (!r.ok) throw new Error(data.error ?? "Failed to fetch positions");
          setPositions(data.positions ?? []);
        })
        .catch((e) => {
          if (e.name === "AbortError") return;
          setPositionsError("Could not fetch on-chain positions — showing full ecosystem map");
          setPositions([]);
        })
        .finally(() => setPositionsLoading(false));

      return () => controller.abort();
    }, 600);

    return () => clearTimeout(timer);
  }, [walletAddress, validAddress]);

  // Fetch policies when wallet address changes or policy is created
  useEffect(() => {
    if (!validAddress) {
      setPolicies(null);
      return;
    }
    setPoliciesLoading(true);
    fetch(`/api/policy?wallet=${encodeURIComponent(walletAddress)}`)
      .then((r) => r.json())
      .then((d) => setPolicies(d.policies ?? []))
      .catch(() => setPolicies([]))
      .finally(() => setPoliciesLoading(false));
  }, [walletAddress, validAddress, created]);

  async function createPolicy() {
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, templateKey: selectedTemplate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "failed");
      setCreated({ id: data.policyId });
      setActiveTab("policy");
    } catch (e) {
      setCreateError(String(e));
    } finally {
      setCreating(false);
    }
  }

  const activePolicy = policies?.find((p) => p.active) ?? policies?.[0] ?? null;

  return (
    <div style={{ display: "flex", height: "100%", background: "#030712", color: "white", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", overflow: "hidden" }}>

      {/* ── Left sidebar ─────────────────────────────────────────────── */}
      <div style={{ width: 360, borderRight: "1px solid #1f2937", display: "flex", flexDirection: "column", overflowY: "auto", flexShrink: 0 }}>

        {/* Header */}
        <div style={{ padding: "24px 24px 0" }}>
          <p style={{ fontFamily: "monospace", color: "#6b7280", fontSize: 11, marginBottom: 6 }}>01 / SETUP</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 6px" }}>Configure a bunker policy</h1>
          <p style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.5, margin: "0 0 24px" }}>
            Pre-stage your crisis response. The policy fires automatically when threats corroborate.
          </p>
        </div>

        {/* Wallet input */}
        <div style={{ padding: "0 24px 20px", borderBottom: "1px solid #1f2937" }}>
          <label style={{ display: "block", fontFamily: "monospace", fontSize: 11, color: "#6b7280", marginBottom: 8 }}>WALLET ADDRESS</label>
          <WalletConnect value={walletAddress} onChange={setWalletAddress} />
          {validAddress && (
            <div style={{ marginTop: 8, fontSize: 11, fontFamily: "monospace", color: chain === "ethereum" ? "#60a5fa" : "#a78bfa" }}>
              {chain} · {walletAddress.slice(0, 8)}…{walletAddress.slice(-6)}
            </div>
          )}
        </div>

        {/* Template picker */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #1f2937", flex: 1 }}>
          <label style={{ display: "block", fontFamily: "monospace", fontSize: 11, color: "#6b7280", marginBottom: 12 }}>PICK A TEMPLATE</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {templates.map((t) => (
              <label key={t.key} style={{
                display: "block", background: "#0f172a",
                border: `1px solid ${selectedTemplate === t.key ? "#3b82f6" : "#1f2937"}`,
                borderRadius: 8, padding: "12px 14px", cursor: "pointer",
              }}>
                <input type="radio" name="template" value={t.key} checked={selectedTemplate === t.key}
                  onChange={() => setSelectedTemplate(t.key)} style={{ display: "none" }} />
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{t.name}</div>
                <div style={{ fontSize: 11, color: "#6b7280", fontFamily: "monospace" }}>{t.protocol} / {t.asset}</div>
                <div style={{ fontSize: 10, color: "#374151", fontFamily: "monospace", marginTop: 3 }}>{t.key}</div>
              </label>
            ))}
          </div>
        </div>

        {/* Create button */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #1f2937" }}>
          <button onClick={createPolicy} disabled={!walletAddress || creating}
            style={{ width: "100%", background: "#1d4ed8", color: "white", border: "none", borderRadius: 8, padding: "12px", fontFamily: "monospace", fontSize: 13, fontWeight: 600, cursor: (!walletAddress || creating) ? "not-allowed" : "pointer", opacity: (!walletAddress || creating) ? 0.5 : 1 }}>
            {creating ? "Creating…" : "Create policy"}
          </button>
          {createError && <div style={{ color: "#f87171", fontSize: 12, fontFamily: "monospace", marginTop: 8 }}>{createError}</div>}
          {created && (
            <div style={{ marginTop: 12, background: "#14532d33", border: "1px solid #22c55e55", borderRadius: 8, padding: "10px 12px", fontSize: 12 }}>
              <div style={{ color: "#22c55e", fontFamily: "monospace", marginBottom: 6 }}>Policy created · id: {created.id}</div>
              <div style={{ display: "flex", gap: 10 }}>
                <a href={`/monitor?wallet=${walletAddress}`} style={{ color: "#60a5fa", fontSize: 11 }}>Open Monitor →</a>
                <a href={`/demo?wallet=${walletAddress}`} style={{ color: "#60a5fa", fontSize: 11 }}>Run demo →</a>
              </div>
            </div>
          )}
        </div>

        {/* Notification channels */}
        <div style={{ padding: "20px 24px" }}>
          <div style={{ fontFamily: "monospace", fontSize: 11, color: "#6b7280", marginBottom: 10 }}>NOTIFICATION CHANNELS</div>
          <p style={{ color: "#6b7280", fontSize: 12, lineHeight: 1.5, marginBottom: 12 }}>
            For T1 alerts, link a channel. We never store your @handle — only an anonymous chat id.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[{ label: "Connect Telegram", sub: "primary" }, { label: "Add Email", sub: "backup" }].map(({ label, sub }) => (
              <button key={sub} style={{ background: "#0f172a", border: "1px solid #1f2937", borderRadius: 8, padding: "10px 12px", textAlign: "left", cursor: "pointer", color: "white" }}>
                <div style={{ fontSize: 10, color: "#6b7280", fontFamily: "monospace", marginBottom: 3 }}>{sub}</div>
                <div style={{ fontSize: 13 }}>{label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right main area ───────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Tab bar */}
        <div style={{ borderBottom: "1px solid #1f2937", padding: "0 20px", display: "flex", gap: 0, flexShrink: 0 }}>
          {([
            { id: "positions" as Tab, label: "Positions Graph" },
            { id: "policy" as Tab, label: "Policy" },
          ]).map(({ id, label }) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{
              background: "none", border: "none", borderBottom: `2px solid ${activeTab === id ? "#3b82f6" : "transparent"}`,
              color: activeTab === id ? "#e5e7eb" : "#6b7280",
              padding: "14px 20px", fontFamily: "monospace", fontSize: 12, fontWeight: activeTab === id ? 600 : 400,
              cursor: "pointer", transition: "color 0.15s",
            }}>
              {label}
              {id === "policy" && activePolicy && (
                <span style={{ marginLeft: 6, padding: "2px 6px", borderRadius: 10, background: "#14532d", color: "#22c55e", fontSize: 10 }}>1</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>

          {/* Positions tab */}
          {activeTab === "positions" && (
            <>
              {!validAddress && (
                <EmptyState message="Enter a wallet address to scan positions" sub="Supports Ethereum (0x…) and Solana addresses" />
              )}
              {validAddress && positionsLoading && <Spinner label="Scanning wallet positions…" />}
              {validAddress && !positionsLoading && positions !== null && (
                <PersonalizedMap
                  address={walletAddress}
                  chain={chain}
                  positions={positions}
                  error={positionsError}
                  embedded
                />
              )}
            </>
          )}

          {/* Policy tab */}
          {activeTab === "policy" && (
            <div style={{ height: "100%", overflowY: "auto" }}>
              {!validAddress && (
                <EmptyState message="Enter a wallet address to see its policy" />
              )}
              {validAddress && policiesLoading && <Spinner label="Loading policy…" />}
              {validAddress && !policiesLoading && !activePolicy && (
                <EmptyState
                  message="No policy saved yet"
                  sub="Pick a template and click Create policy to get started"
                />
              )}
              {validAddress && !policiesLoading && activePolicy && (
                <PolicyViewer policy={activePolicy} />
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
