"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as d3 from "d3";
import { useRouter } from "next/navigation";
import {
  NODES, EDGES, findContagionPaths,
  CHAIN_COLORS, RISK_COLORS, EDGE_COLORS, EDGE_LABELS,
  type GraphNode, type GraphEdge,
} from "@/lib/contagion-graph";
import type { DetectedPosition } from "@/lib/position-fetcher";
import type { Chain } from "@/lib/contagion-graph";

interface SimNode extends d3.SimulationNodeDatum, GraphNode {}
interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  type: GraphEdge["type"]; weight?: number;
}

const NODE_R: Record<string, number> = { protocol: 28, token: 18, bridge: 22, dvn: 18 };

// Node display state
type NodeState = "position" | "risk-high" | "risk-med" | "risk-low" | "safe-exit" | "default";

const SAFE_EXIT_NODES = new Set(["usdc", "eth", "cctp", "starkgate"]);

function nodeState(id: string, posIds: Set<string>, riskMap: Map<string, number>): NodeState {
  if (posIds.has(id)) return "position";
  if (SAFE_EXIT_NODES.has(id)) return "safe-exit";
  const r = riskMap.get(id) ?? 0;
  if (r > 0.5) return "risk-high";
  if (r > 0.2) return "risk-med";
  if (r > 0) return "risk-low";
  return "default";
}

const STATE_COLORS: Record<NodeState, { fill: string; stroke: string; opacity: number }> = {
  "position":   { fill: "#1d4ed8", stroke: "#60a5fa", opacity: 1 },
  "risk-high":  { fill: "#7f1d1d", stroke: "#ef4444", opacity: 1 },
  "risk-med":   { fill: "#78350f", stroke: "#f59e0b", opacity: 0.85 },
  "risk-low":   { fill: "#1c1917", stroke: "#78716c", opacity: 0.7 },
  "safe-exit":  { fill: "#14532d", stroke: "#22c55e", opacity: 1 },
  "default":    { fill: "#111827", stroke: "#374151", opacity: 0.45 },
};

interface Props {
  address: string;
  chain: Chain | "unknown";
  positions: DetectedPosition[];
  error?: string;
}

export default function PersonalizedMap({ address, chain, positions, error }: Props) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [showEdgeTypes, setShowEdgeTypes] = useState<Set<string>>(new Set(Object.keys(EDGE_COLORS)));

  const positionIds = useMemo(() => new Set(positions.map((p) => p.nodeId)), [positions]);

  // Aggregate risk from all positions simultaneously (max intensity per node)
  const riskMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const posId of positionIds) {
      for (const r of findContagionPaths(posId, 4)) {
        map.set(r.nodeId, Math.max(map.get(r.nodeId) ?? 0, r.pathWeight));
      }
    }
    // Remove from risk map nodes that are actual positions (they're highlighted differently)
    for (const id of positionIds) map.delete(id);
    return map;
  }, [positionIds]);

  const atRiskNodes = useMemo(
    () => [...riskMap.entries()].filter(([, w]) => w > 0.1).sort((a, b) => b[1] - a[1]),
    [riskMap]
  );

  const selectedContagion = useMemo(
    () => selected ? findContagionPaths(selected.id, 4) : [],
    [selected]
  );

  const buildGraph = useCallback(() => {
    if (!svgRef.current || !wrapRef.current) return;
    const W = wrapRef.current.clientWidth || 900;
    const H = wrapRef.current.clientHeight || 650;

    d3.select(svgRef.current).selectAll("*").remove();

    const nodes: SimNode[] = NODES.map((n) => ({ ...n }));
    const links: SimLink[] = EDGES
      .filter((e) => showEdgeTypes.has(e.type))
      .map((e) => ({ ...e }));

    const svg = d3.select(svgRef.current).attr("width", W).attr("height", H);
    const g = svg.append("g");
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 5])
        .on("zoom", (ev) => g.attr("transform", ev.transform))
    );

    // Arrow marker
    svg.append("defs").append("marker").attr("id", "arr")
      .attr("viewBox", "0 -5 10 10").attr("refX", 22).attr("refY", 0)
      .attr("markerWidth", 5).attr("markerHeight", 5).attr("orient", "auto")
      .append("path").attr("d", "M0,-5L10,0L0,5").attr("fill", "#374151");

    const sim = d3.forceSimulation<SimNode>(nodes)
      .force("link", d3.forceLink<SimNode, SimLink>(links).id((d) => d.id)
        .distance((d) => 140 - (d.weight ?? 3) * 12).strength(0.35))
      .force("charge", d3.forceManyBody().strength(-320))
      .force("center", d3.forceCenter(W / 2, H / 2))
      .force("collision", d3.forceCollide<SimNode>().radius((d) => NODE_R[d.type] + 16));

    // Pull user's position nodes toward center
    sim.force("positionPull", d3.forceManyBody<SimNode>().strength((d) =>
      positionIds.has(d.id) ? 80 : 0
    ));

    const link = g.append("g")
      .selectAll<SVGLineElement, SimLink>("line")
      .data(links).join("line")
      .attr("stroke", (d) => EDGE_COLORS[d.type])
      .attr("stroke-opacity", 0.3)
      .attr("stroke-width", (d) => (d.weight ?? 1) * 0.6)
      .attr("marker-end", "url(#arr)");

    const drag = d3.drag<SVGGElement, SimNode>()
      .on("start", (ev, d) => { if (!ev.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on("drag",  (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
      .on("end",   (ev, d) => { if (!ev.active) sim.alphaTarget(0); d.fx = null; d.fy = null; });

    const ng = g.append("g")
      .selectAll<SVGGElement, SimNode>("g")
      .data(nodes).join("g")
      .attr("cursor", "pointer")
      .call(drag)
      .on("click", (_, d) => setSelected((prev) => prev?.id === d.id ? null : d));

    // Outer pulse ring for position nodes
    ng.filter((d) => positionIds.has(d.id))
      .append("circle")
      .attr("r", (d) => NODE_R[d.type] + 8)
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4,3")
      .attr("opacity", 0.8);

    // Risk glow for at-risk nodes
    ng.filter((d) => (riskMap.get(d.id) ?? 0) > 0.3)
      .append("circle")
      .attr("r", (d) => NODE_R[d.type] + 6)
      .attr("fill", "none")
      .attr("stroke", "#ef4444")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,4")
      .attr("opacity", (d) => Math.min(0.7, (riskMap.get(d.id) ?? 0)));

    // Main circle
    ng.append("circle")
      .attr("r", (d) => NODE_R[d.type])
      .attr("fill", (d) => STATE_COLORS[nodeState(d.id, positionIds, riskMap)].fill)
      .attr("stroke", (d) => STATE_COLORS[nodeState(d.id, positionIds, riskMap)].stroke)
      .attr("stroke-width", (d) => positionIds.has(d.id) ? 2.5 : 1.5)
      .attr("opacity", (d) => STATE_COLORS[nodeState(d.id, positionIds, riskMap)].opacity);

    // Type letter
    ng.append("text")
      .attr("text-anchor", "middle").attr("dominant-baseline", "central")
      .attr("fill", (d) => positionIds.has(d.id) ? "#93c5fd" : CHAIN_COLORS[d.chain])
      .attr("font-size", (d) => NODE_R[d.type] * 0.55 + "px")
      .attr("font-weight", "bold").attr("pointer-events", "none")
      .text((d) => ({ protocol: "P", token: "T", bridge: "B", dvn: "D" }[d.type]));

    // Label
    ng.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", (d) => NODE_R[d.type] + 13)
      .attr("fill", (d) => positionIds.has(d.id) ? "#93c5fd" : (riskMap.get(d.id) ?? 0) > 0.2 ? "#fca5a5" : "#6b7280")
      .attr("font-size", (d) => positionIds.has(d.id) ? "12px" : "10px")
      .attr("font-weight", (d) => positionIds.has(d.id) ? "600" : "400")
      .attr("pointer-events", "none")
      .text((d) => d.label);

    sim.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as SimNode).x ?? 0)
        .attr("y1", (d) => (d.source as SimNode).y ?? 0)
        .attr("x2", (d) => (d.target as SimNode).x ?? 0)
        .attr("y2", (d) => (d.target as SimNode).y ?? 0);
      ng.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => { sim.stop(); };
  }, [positionIds, riskMap, showEdgeTypes]);

  useEffect(() => {
    const cleanup = buildGraph();
    return cleanup;
  }, [buildGraph]);

  // Highlight selection overlay
  useEffect(() => {
    if (!svgRef.current || !selected) return;
    const svg = d3.select(svgRef.current);
    const selContagionIds = new Set(selectedContagion.map((r) => r.nodeId));
    svg.selectAll<SVGCircleElement, SimNode>("g > g > circle:nth-child(1), g > g > circle:nth-child(2)")
      .attr("stroke-width", (d: SimNode) => {
        if (!d) return 1.5;
        if (d.id === selected.id) return 3;
        if (selContagionIds.has(d.id)) return 2;
        return 1;
      });
    svg.selectAll<SVGLineElement, SimLink>("line")
      .attr("stroke-opacity", (d: SimLink) => {
        const s = (d.source as SimNode).id;
        const t = (d.target as SimNode).id;
        if (s === selected.id || t === selected.id) return 0.95;
        if (selContagionIds.has(s) && selContagionIds.has(t)) return 0.5;
        return 0.06;
      });
  }, [selected, selectedContagion]);

  const shortAddr = `${address.slice(0, 6)}…${address.slice(-4)}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#030712", color: "white", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1f2937", padding: "10px 16px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <button onClick={() => router.push("/")}
          style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 4px" }}>
          ←
        </button>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 13, color: "#6b7280" }}>
            <span style={{ color: CHAIN_COLORS[chain === "unknown" ? "ethereum" : chain], fontWeight: 600, marginRight: 6, textTransform: "capitalize" }}>{chain}</span>
            <span style={{ fontFamily: "monospace" }}>{shortAddr}</span>
          </span>
        </div>
        {/* Legend pills */}
        <div style={{ display: "flex", gap: 8, fontSize: 11 }}>
          {[
            { color: "#60a5fa", label: `${positions.length} positions` },
            { color: "#ef4444", label: `${atRiskNodes.length} at risk` },
            { color: "#22c55e", label: "safe exit" },
          ].map(({ color, label }) => (
            <span key={label} style={{ padding: "3px 8px", borderRadius: 20, background: color + "22", color, fontWeight: 500 }}>{label}</span>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ background: "#7f1d1d", border: "1px solid #ef4444", borderRadius: 6, margin: 12, padding: "10px 14px", fontSize: 13, color: "#fca5a5" }}>
          ⚠ {error} — showing full ecosystem map
        </div>
      )}

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Graph canvas */}
        <div ref={wrapRef} style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <svg ref={svgRef} style={{ width: "100%", height: "100%" }} />

          {/* Edge type toggles */}
          <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(3,7,18,0.92)", border: "1px solid #1f2937", borderRadius: 8, padding: "10px 12px", fontSize: 11 }}>
            <div style={{ fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>Edge Types</div>
            {(Object.entries(EDGE_COLORS) as [GraphEdge["type"], string][]).map(([t, c]) => (
              <label key={t} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, cursor: "pointer" }}>
                <input type="checkbox" checked={showEdgeTypes.has(t)} style={{ width: 11, height: 11 }}
                  onChange={() => setShowEdgeTypes((prev) => { const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n; })} />
                <span style={{ width: 16, height: 2, background: c, display: "inline-block", borderRadius: 1 }} />
                <span style={{ color: "#9ca3af" }}>{EDGE_LABELS[t]}</span>
              </label>
            ))}
          </div>

          {/* Node state legend */}
          <div style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(3,7,18,0.92)", border: "1px solid #1f2937", borderRadius: 8, padding: "10px 12px", fontSize: 11 }}>
            {[
              { color: "#60a5fa", label: "Your position" },
              { color: "#ef4444", label: "High contagion risk" },
              { color: "#f59e0b", label: "Medium risk" },
              { color: "#22c55e", label: "Safe exit route" },
              { color: "#374151", label: "Unrelated" },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block" }} />
                <span style={{ color: "#9ca3af" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ width: 300, borderLeft: "1px solid #1f2937", overflowY: "auto", background: "#030712", flexShrink: 0 }}>

          {/* My positions */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #1f2937" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#3b82f6", marginBottom: 8, letterSpacing: "0.08em" }}>YOUR POSITIONS</div>
            {positions.length === 0 ? (
              <p style={{ fontSize: 12, color: "#6b7280" }}>No DeFi positions detected on this wallet.</p>
            ) : (
              positions.map((p) => {
                const node = NODES.find((n) => n.id === p.nodeId);
                return (
                  <div key={p.nodeId}
                    onClick={() => { const n = NODES.find(x => x.id === p.nodeId); if (n) setSelected((prev) => prev?.id === n.id ? null : n); }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid #0f172a", cursor: "pointer" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: node ? CHAIN_COLORS[node.chain] : "#60a5fa", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: "#e5e7eb", fontWeight: 500 }}>{p.name}</div>
                      {p.balance > 0 && (
                        <div style={{ fontSize: 11, color: "#4b5563" }}>{p.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
                      )}
                    </div>
                    {node && (
                      <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: RISK_COLORS[node.riskLevel] + "22", color: RISK_COLORS[node.riskLevel] }}>
                        {node.riskLevel}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* At risk */}
          {atRiskNodes.length > 0 && (
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #1f2937" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#ef4444", marginBottom: 8, letterSpacing: "0.08em" }}>CONTAGION EXPOSURE (4 HOPS)</div>
              {atRiskNodes.slice(0, 12).map(([id, weight]) => {
                const node = NODES.find((n) => n.id === id);
                if (!node) return null;
                const pct = Math.round(weight * 100);
                return (
                  <div key={id}
                    onClick={() => setSelected((prev) => prev?.id === id ? null : (node ?? null))}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", cursor: "pointer" }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: pct > 50 ? RISK_COLORS.critical : pct > 25 ? RISK_COLORS.high : RISK_COLORS.medium, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12, color: "#d1d5db" }}>{node.label}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, width: 60 }}>
                      <div style={{ flex: 1, height: 3, background: "#1f2937", borderRadius: 2 }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: pct > 50 ? RISK_COLORS.critical : RISK_COLORS.high, borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 10, color: "#6b7280", width: 24, textAlign: "right" }}>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Selected node detail */}
          {selected && (
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #1f2937" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{selected.label}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 5 }}>
                    <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: CHAIN_COLORS[selected.chain] + "33", color: CHAIN_COLORS[selected.chain] }}>{selected.chain}</span>
                    <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: RISK_COLORS[selected.riskLevel] + "33", color: RISK_COLORS[selected.riskLevel] }}>{selected.riskLevel}</span>
                    {positionIds.has(selected.id) && <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#1d4ed833", color: "#60a5fa" }}>your position</span>}
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#6b7280", fontSize: 18, cursor: "pointer" }}>×</button>
              </div>

              {selected.tvl && (
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>TVL: ${(selected.tvl / 1000).toFixed(1)}B{selected.poolArch && ` • ${selected.poolArch} pool`}</div>
              )}

              <p style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.6, marginBottom: 10 }}>{selected.description}</p>

              {selectedContagion.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>PROPAGATES TO ({selectedContagion.length} nodes)</div>
                  {selectedContagion.slice(0, 8).map((r) => {
                    const n = NODES.find((x) => x.id === r.nodeId);
                    if (!n) return null;
                    const isMyPos = positionIds.has(r.nodeId);
                    return (
                      <div key={r.nodeId} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, padding: "4px 0", color: isMyPos ? "#60a5fa" : "#9ca3af" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: isMyPos ? "#60a5fa" : RISK_COLORS[n.riskLevel], flexShrink: 0 }} />
                        {n.label}
                        <span style={{ marginLeft: "auto", color: "#4b5563", fontSize: 10 }}>{r.hops}h • {Math.round(r.pathWeight * 100)}%</span>
                        {isMyPos && <span style={{ fontSize: 10, color: "#3b82f6" }}>⚠ yours</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Safe exits */}
          <div style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#22c55e", marginBottom: 8, letterSpacing: "0.08em" }}>SAFE EXIT ROUTES</div>
            {[
              { id: "usdc", label: "USDC on Base via CCTP", detail: "Circle burn-and-mint, no bridge risk" },
              { id: "morpho", label: "Morpho isolated pools", detail: "Isolated architecture, lowest contagion" },
              { id: "sparklend", label: "SparkLend", detail: "Isolated + proved resilience in April 2026" },
              { id: "eth", label: "Native ETH self-custody", detail: "No protocol dependency" },
            ].map(({ id, label, detail }) => (
              <div key={id}
                onClick={() => { const n = NODES.find(x => x.id === id); if (n) setSelected((prev) => prev?.id === n.id ? null : n); }}
                style={{ padding: "7px 0", borderBottom: "1px solid #0f172a", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#22c55e", fontWeight: 500 }}>
                  <span style={{ fontSize: 10 }}>✓</span>{label}
                </div>
                <div style={{ fontSize: 11, color: "#374151", marginTop: 2 }}>{detail}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
