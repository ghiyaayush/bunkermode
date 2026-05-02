"use client";

/**
 * P1: Dependency graph viewer.
 *
 * Renders the three-layer collateral tree for an asset. The Kelp hack
 * was at the verifier (Layer 1) of the rsETH bridge - the leaf nobody
 * was watching.
 *
 * Pure SVG, no graph library, fits in a card.
 */

interface Node {
  id: string;
  label: string;
  layer: 1 | 2 | 3;
  risk: "LOW" | "ELEVATED" | "HIGH" | "CRITICAL";
  detail?: string;
}

const RISK_COLOR: Record<Node["risk"], string> = {
  LOW: "#10B981",
  ELEVATED: "#F59E0B",
  HIGH: "#F97316",
  CRITICAL: "#DC2626",
};

interface Props {
  asset: string;
  nodes: Node[];
}

export function DependencyGraph({ asset, nodes }: Props) {
  const layer3 = nodes.filter((n) => n.layer === 3);
  const layer2 = nodes.filter((n) => n.layer === 2);
  const layer1 = nodes.filter((n) => n.layer === 1);

  return (
    <div className="bg-bunker-panel border border-bunker-border rounded-lg p-6">
      <div className="font-mono text-xs text-bunker-muted mb-4">
        P1 / DEPENDENCY GRAPH FOR {asset.toUpperCase()}
      </div>
      <div className="space-y-6">
        <Layer label="Layer 3: Token" nodes={layer3} />
        <div className="ml-4 text-bunker-muted">↓ depends on</div>
        <Layer label="Layer 2: Bridge" nodes={layer2} />
        <div className="ml-4 text-bunker-muted">↓ attests via</div>
        <Layer label="Layer 1: Verifier" nodes={layer1} />
      </div>
      <div className="mt-6 text-xs text-bunker-muted leading-relaxed">
        The Kelp hack failed at Layer 1. The token contract looked fine. The bridge looked fine.
        The verifier - one operator - was compromised. BunkerMode watches the leaf, not just
        the root.
      </div>
    </div>
  );
}

function Layer({ label, nodes }: { label: string; nodes: Node[] }) {
  return (
    <div>
      <div className="font-mono text-xs text-bunker-muted mb-2">{label}</div>
      <div className="flex gap-3 flex-wrap">
        {nodes.map((n) => (
          <div
            key={n.id}
            className="border rounded-lg px-4 py-3 min-w-32"
            style={{ borderColor: RISK_COLOR[n.risk] }}
          >
            <div className="font-semibold text-sm">{n.label}</div>
            {n.detail && (
              <div className="text-xs text-bunker-muted mt-1">{n.detail}</div>
            )}
            <div
              className="text-xs font-mono mt-2"
              style={{ color: RISK_COLOR[n.risk] }}
            >
              {n.risk}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const RSETH_GRAPH: Node[] = [
  {
    id: "rseth-token",
    label: "rsETH",
    layer: 3,
    risk: "ELEVATED",
    detail: "Restaking share, audited 2025-08",
  },
  {
    id: "rseth-bridge",
    label: "LayerZero",
    layer: 2,
    risk: "HIGH",
    detail: "non-canonical, OFT V2",
  },
  {
    id: "rseth-verifier",
    label: "DVN (1-of-1)",
    layer: 1,
    risk: "CRITICAL",
    detail: "single operator, no audit",
  },
];
