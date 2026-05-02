"use client";

import { useEffect, useState } from "react";
import { WalletConnect } from "@/components/WalletConnect";

interface Template {
  key: string;
  name: string;
  asset: string;
  protocol: string;
}

export default function SetupPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [walletAddress, setWalletAddress] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("aave-rseth-cascade");
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ id: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/policy?templates=1")
      .then((r) => r.json())
      .then((d) => setTemplates(d.templates ?? []))
      .catch((e) => setError(String(e)));
  }, []);

  async function createPolicy() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, templateKey: selectedTemplate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "failed");
      setCreated({ id: data.policyId });
    } catch (e) {
      setError(String(e));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
      <div>
        <p className="font-mono text-bunker-muted text-sm">01 / SETUP</p>
        <h1 className="text-3xl font-bold">Configure a bunker policy</h1>
        <p className="text-bunker-muted mt-2">
          Pre-stage your crisis response now. The policy fires automatically when threats
          corroborate.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block font-mono text-sm text-bunker-muted mb-2">
            Wallet address
          </label>
          <WalletConnect value={walletAddress} onChange={setWalletAddress} />
        </div>

        <div>
          <label className="block font-mono text-sm text-bunker-muted mb-2">
            Pick a template
          </label>
          <div className="space-y-2">
            {templates.map((t) => (
              <label
                key={t.key}
                className={`block bg-bunker-panel border rounded p-4 cursor-pointer transition-colors ${
                  selectedTemplate === t.key
                    ? "border-bunker-accent"
                    : "border-bunker-border hover:border-bunker-muted"
                }`}
              >
                <input
                  type="radio"
                  name="template"
                  value={t.key}
                  checked={selectedTemplate === t.key}
                  onChange={() => setSelectedTemplate(t.key)}
                  className="sr-only"
                />
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{t.name}</div>
                    <div className="text-sm text-bunker-muted font-mono mt-1">
                      {t.protocol} / {t.asset}
                    </div>
                  </div>
                  <div className="font-mono text-xs text-bunker-muted">{t.key}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={createPolicy}
          disabled={!walletAddress || creating}
          className="bg-bunker-accent text-bunker-bg px-6 py-3 rounded font-mono text-sm disabled:opacity-50"
        >
          {creating ? "Creating..." : "Create policy"}
        </button>

        {error && <div className="text-bunker-danger text-sm font-mono">{error}</div>}
        {created && (
          <div className="bg-bunker-panel border border-bunker-accent rounded p-4 space-y-3">
            <div className="text-bunker-accent font-mono text-sm">Policy created</div>
            <div className="text-sm">id: {created.id}</div>
            <div className="space-x-3">
              <a href={`/monitor?wallet=${walletAddress}`} className="underline">
                Open Monitor
              </a>
              <a href={`/demo?wallet=${walletAddress}`} className="underline">
                Run demo replay
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="bg-bunker-panel border border-bunker-border rounded-lg p-6 text-sm space-y-3">
        <div className="font-mono text-bunker-muted">NOTIFICATION CHANNELS</div>
        <p className="text-bunker-muted">
          For T1 alerts, link a channel. We never store your @handle, only an anonymous chat id.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-bunker-bg border border-bunker-border rounded px-4 py-2 text-left text-sm hover:border-bunker-accent">
            <div className="font-mono text-xs text-bunker-muted">primary</div>
            <div>Connect Telegram</div>
          </button>
          <button className="bg-bunker-bg border border-bunker-border rounded px-4 py-2 text-left text-sm hover:border-bunker-accent">
            <div className="font-mono text-xs text-bunker-muted">backup</div>
            <div>Add Email</div>
          </button>
        </div>
      </div>
    </div>
  );
}
