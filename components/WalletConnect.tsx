"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

interface Props {
  value: string;
  onChange: (address: string) => void;
}

export function WalletConnect({ value, onChange }: Props) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;
    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (accounts && accounts.length > 0) onChange(accounts[0]);
    };
    const handleChainChanged = (...args: unknown[]) => setChainId(args[0] as string);
    window.ethereum.on?.("accountsChanged", handleAccountsChanged);
    window.ethereum.on?.("chainChanged", handleChainChanged);
    return () => {
      window.ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [onChange]);

  async function connect() {
    setConnecting(true);
    setError(null);
    try {
      if (!window.ethereum) {
        throw new Error("No injected wallet found. Install MetaMask, Rabby, or similar.");
      }
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      if (accounts && accounts.length > 0) {
        onChange(accounts[0]);
      }
      const cid = (await window.ethereum.request({ method: "eth_chainId" })) as string;
      setChainId(cid);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0x..."
          className="flex-1 bg-bunker-panel border border-bunker-border rounded px-4 py-3 font-mono text-sm focus:outline-none focus:border-bunker-accent"
        />
        <button
          onClick={connect}
          disabled={connecting}
          className="bg-bunker-bg border border-bunker-accent text-bunker-accent px-4 py-3 rounded font-mono text-sm disabled:opacity-50 whitespace-nowrap"
        >
          {connecting ? "Connecting..." : "Connect Wallet"}
        </button>
      </div>
      {chainId && (
        <div className="text-xs font-mono text-bunker-muted">
          chain: {parseInt(chainId, 16)}
        </div>
      )}
      {error && <div className="text-bunker-danger text-xs font-mono">{error}</div>}
    </div>
  );
}
