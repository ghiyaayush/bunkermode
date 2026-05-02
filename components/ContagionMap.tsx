"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import {
  NODES, EDGES, findContagionPaths,
  CHAIN_COLORS, RISK_COLORS, EDGE_COLORS, EDGE_LABELS,
  type GraphNode, type GraphEdge, type ContagionResult,
} from "@/lib/contagion-graph";

interface SimNode extends d3.SimulationNodeDatum, GraphNode {}
interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  type: GraphEdge["type"]; weight?: number; label?: string;
}

const NODE_R: Record<string, number> = { protocol: 28, token: 18, bridge: 22, dvn: 18 };

export default function ContagionMap() {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [paths, setPaths] = useState<ContagionResult[]>([]);
  const [affected, setAffected] = useState<Set<string>>(new Set());
  const [chain, setChain] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [edgeTypes, setEdgeTypes] = useState<Set<string>>(new Set(Object.keys(EDGE_COLORS)));

  const select = useCallback((node: GraphNode) => {
    if (selected?.id === node.id) {
      setSelected(null); setPaths([]); setAffected(new Set()); return;
    }
    const p = findContagionPaths(node.id, 3);
    setSelected(node); setPaths(p); setAffected(new Set(p.map(x => x.nodeId)));
  }, [selected]);

  useEffect(() => {
    if (!svgRef.current || !wrapRef.current) return;
    const W = wrapRef.current.clientWidth || 900;
    const H = wrapRef.current.clientHeight || 650;

    d3.select(svgRef.current).selectAll("*").remove();
    simRef.current?.stop();

    const nodes: SimNode[] = NODES
      .filter(n => chain === "all" || n.chain === chain)
      .filter(n => typeFilter === "all" || n.type === typeFilter)
      .map(n => ({ ...n }));

    const ids = new Set(nodes.map(n => n.id));
    const links: SimLink[] = EDGES
      .filter(e => ids.has(e.source as string) && ids.has(e.target as string) && edgeTypes.has(e.type))
      .map(e => ({ ...e }));

    const svg = d3.select(svgRef.current).attr("width", W).attr("height", H);
    const g = svg.append("g");
    svg.call(d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.15, 4]).on("zoom", ev => g.attr("transform", ev.transform)));

    const defs = svg.append("defs");
    defs.append("marker").attr("id","arr").attr("viewBox","0 -5 10 10").attr("refX",22).attr("refY",0)
      .attr("markerWidth",5).attr("markerHeight",5).attr("orient","auto")
      .append("path").attr("d","M0,-5L10,0L0,5").attr("fill","#4b5563");

    const sim = d3.forceSimulation<SimNode>(nodes)
      .force("link", d3.forceLink<SimNode, SimLink>(links).id(d => d.id).distance(d => 130 - (d.weight ?? 3)*10).strength(0.4))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(W/2, H/2))
      .force("collision", d3.forceCollide<SimNode>().radius(d => NODE_R[d.type] + 14));
    simRef.current = sim;

    const link = g.append("g").selectAll<SVGLineElement, SimLink>("line").data(links).join("line")
      .attr("stroke", d => EDGE_COLORS[d.type]).attr("stroke-opacity", 0.45)
      .attr("stroke-width", d => (d.weight ?? 1) * 0.7).attr("marker-end","url(#arr)");

    const drag = d3.drag<SVGGElement, SimNode>()
      .on("start", (ev, d) => { if (!ev.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on("drag",  (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
      .on("end",   (ev, d) => { if (!ev.active) sim.alphaTarget(0); d.fx = null; d.fy = null; });

    const ng = g.append("g").selectAll<SVGGElement, SimNode>("g").data(nodes).join("g")
      .attr("cursor","pointer").call(drag).on("click", (_, d) => select(d));

    // outer glow ring for critical/high
    ng.filter(d => d.riskLevel === "critical" || d.riskLevel === "high")
      .append("circle").attr("r", d => NODE_R[d.type]+5).attr("fill","none")
      .attr("stroke", d => RISK_COLORS[d.riskLevel]).attr("stroke-width",1)
      .attr("stroke-dasharray","4,3").attr("opacity",0.5);

    ng.append("circle").attr("r", d => NODE_R[d.type])
      .attr("fill", d => CHAIN_COLORS[d.chain]+"22")
      .attr("stroke", d => RISK_COLORS[d.riskLevel]).attr("stroke-width",2);

    ng.append("text").attr("text-anchor","middle").attr("dominant-baseline","central")
      .attr("fill", d => CHAIN_COLORS[d.chain]).attr("font-size", d => NODE_R[d.type]*0.55+"px")
      .attr("font-weight","bold").attr("pointer-events","none")
      .text(d => ({protocol:"P",token:"T",bridge:"B",dvn:"D"}[d.type]));

    ng.append("text").attr("text-anchor","middle").attr("dy", d => NODE_R[d.type]+13)
      .attr("fill","#d1d5db").attr("font-size","11px").attr("pointer-events","none")
      .text(d => d.label);

    sim.on("tick", () => {
      link.attr("x1",d=>(d.source as SimNode).x??0).attr("y1",d=>(d.source as SimNode).y??0)
          .attr("x2",d=>(d.target as SimNode).x??0).attr("y2",d=>(d.target as SimNode).y??0);
      ng.attr("transform", d => `translate(${d.x??0},${d.y??0})`);
    });

    return () => { sim.stop(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chain, typeFilter, edgeTypes]);

  // highlight layer — runs when selection changes without rebuilding sim
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    if (!selected) {
      svg.selectAll<SVGCircleElement, SimNode>("g > g circle:not(.ring)")
        .attr("fill", (d: SimNode) => CHAIN_COLORS[d.chain]+"22").attr("stroke-opacity",1);
      svg.selectAll<SVGLineElement, SimLink>("line")
        .attr("stroke-opacity",0.45).attr("stroke-width",d=>(d.weight??1)*0.7);
      return;
    }
    svg.selectAll<SVGCircleElement, SimNode>("g > g circle:first-of-type")
      .attr("fill", (d: SimNode) => d.id===selected.id ? RISK_COLORS[d.riskLevel] : affected.has(d.id) ? CHAIN_COLORS[d.chain]+"44" : CHAIN_COLORS[d.chain]+"11")
      .attr("stroke-opacity", (d: SimNode) => d.id===selected.id||affected.has(d.id) ? 1 : 0.2);
    svg.selectAll<SVGLineElement, SimLink>("line")
      .attr("stroke-opacity", (d: SimLink) => {
        const s=(d.source as SimNode).id, t=(d.target as SimNode).id;
        return s===selected.id||t===selected.id ? 0.95 : affected.has(s)&&affected.has(t) ? 0.5 : 0.06;
      })
      .attr("stroke-width", (d: SimLink) => {
        const s=(d.source as SimNode).id, t=(d.target as SimNode).id;
        return (s===selected.id||t===selected.id) ? (d.weight??1)*1.8 : (d.weight??1)*0.5;
      });
  }, [selected, affected]);

  return (
    <div className="flex flex-col" style={{height:"100dvh",background:"#030712",color:"white"}}>
      {/* Header */}
      <div style={{borderBottom:"1px solid #1f2937",padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div>
          <span style={{fontWeight:700,fontSize:16}}>BunkerMode — DeFi Contagion Map</span>
          <span style={{color:"#6b7280",fontSize:12,marginLeft:12}}>Click any node to trace exploit propagation paths</span>
        </div>
        <div style={{display:"flex",gap:8}}>
          {[["chain",chain,setChain,[["all","All Chains"],["ethereum","Ethereum"],["solana","Solana"],["starknet","Starknet"]]],
            ["type",typeFilter,setTypeFilter,[["all","All Types"],["protocol","Protocols"],["token","Tokens"],["bridge","Bridges"],["dvn","DVNs"]]]]
            .map(([key,val,setter,opts]) => (
              <select key={key as string} value={val as string}
                onChange={e => (setter as (v:string)=>void)(e.target.value)}
                style={{background:"#111827",border:"1px solid #374151",borderRadius:6,padding:"4px 8px",fontSize:12,color:"white"}}>
                {(opts as [string,string][]).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            ))}
        </div>
      </div>

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        {/* Canvas */}
        <div ref={wrapRef} style={{flex:1,position:"relative",overflow:"hidden"}}>
          <svg ref={svgRef} style={{width:"100%",height:"100%"}} />

          {/* Edge type legend */}
          <div style={{position:"absolute",top:12,left:12,background:"rgba(17,24,39,0.92)",border:"1px solid #374151",borderRadius:8,padding:"10px 12px",fontSize:11}}>
            <div style={{fontWeight:600,color:"#9ca3af",marginBottom:6}}>Edge Types</div>
            {(Object.entries(EDGE_COLORS) as [GraphEdge["type"],string][]).map(([t,c]) => (
              <label key={t} style={{display:"flex",alignItems:"center",gap:6,marginBottom:3,cursor:"pointer"}}>
                <input type="checkbox" checked={edgeTypes.has(t)} style={{width:11,height:11}}
                  onChange={() => setEdgeTypes(prev => { const n=new Set(prev); n.has(t)?n.delete(t):n.add(t); return n; })} />
                <span style={{width:16,height:2,background:c,borderRadius:1,display:"inline-block"}} />
                <span style={{color:"#9ca3af"}}>{EDGE_LABELS[t]}</span>
              </label>
            ))}
          </div>

          {/* Node legend */}
          <div style={{position:"absolute",bottom:12,left:12,background:"rgba(17,24,39,0.92)",border:"1px solid #374151",borderRadius:8,padding:"10px 12px",fontSize:11}}>
            <div style={{fontWeight:600,color:"#9ca3af",marginBottom:6}}>Chain</div>
            {(["ethereum","solana","starknet"] as const).map(ch => (
              <div key={ch} style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                <span style={{width:10,height:10,borderRadius:"50%",background:CHAIN_COLORS[ch],display:"inline-block"}} />
                <span style={{color:"#9ca3af",textTransform:"capitalize"}}>{ch}</span>
              </div>
            ))}
            <div style={{fontWeight:600,color:"#9ca3af",marginTop:8,marginBottom:6}}>Risk Ring</div>
            {(["low","medium","high","critical"] as const).map(r => (
              <div key={r} style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                <span style={{width:14,height:2,background:RISK_COLORS[r],borderRadius:1,display:"inline-block"}} />
                <span style={{color:"#9ca3af",textTransform:"capitalize"}}>{r}</span>
              </div>
            ))}
            <div style={{fontWeight:600,color:"#9ca3af",marginTop:8,marginBottom:4}}>Node Type</div>
            {[["P","Protocol"],["T","Token"],["B","Bridge"],["D","DVN"]].map(([s,l]) => (
              <div key={s} style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                <span style={{width:16,textAlign:"center",color:"#627EEA",fontWeight:700,fontSize:10}}>{s}</span>
                <span style={{color:"#9ca3af"}}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{width:300,borderLeft:"1px solid #1f2937",overflowY:"auto",background:"#030712",flexShrink:0,padding:16}}>
          {selected ? (
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div>
                  <div style={{fontWeight:700,fontSize:16}}>{selected.label}</div>
                  <div style={{display:"flex",gap:6,marginTop:6}}>
                    <span style={{fontSize:11,padding:"2px 8px",borderRadius:12,background:CHAIN_COLORS[selected.chain]+"33",color:CHAIN_COLORS[selected.chain]}}>{selected.chain}</span>
                    <span style={{fontSize:11,padding:"2px 8px",borderRadius:12,background:RISK_COLORS[selected.riskLevel]+"33",color:RISK_COLORS[selected.riskLevel]}}>{selected.riskLevel} risk</span>
                  </div>
                </div>
                <button onClick={() => {setSelected(null);setPaths([]);setAffected(new Set());}}
                  style={{background:"none",border:"none",color:"#6b7280",fontSize:20,cursor:"pointer",lineHeight:1}}>×</button>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                {[
                  ["Type", selected.type],
                  selected.tvl ? ["TVL", `$${(selected.tvl/1000).toFixed(1)}B`] : null,
                  selected.poolArch ? ["Pool Arch", selected.poolArch] : null,
                  selected.dvnCount !== undefined ? ["DVN Config", selected.dvnCount===0?"ZK (no DVN)":`${selected.dvnCount}-of-${selected.dvnCount}`] : null,
                ].filter((x): x is [string, string] => x !== null).map(([k,v]) => (
                  <div key={k as string} style={{background:"#111827",borderRadius:6,padding:"8px 10px"}}>
                    <div style={{fontSize:10,color:"#6b7280"}}>{k}</div>
                    <div style={{fontSize:13,fontWeight:500,marginTop:2,
                      color: k==="Pool Arch" ? (v==="shared"?RISK_COLORS.critical:RISK_COLORS.low) :
                             k==="DVN Config" ? (v==="ZK (no DVN)"?RISK_COLORS.low:RISK_COLORS.critical) : "white"
                    }}>{v as string}</div>
                  </div>
                ))}
              </div>

              <p style={{fontSize:12,color:"#9ca3af",lineHeight:1.6,marginBottom:16}}>{selected.description}</p>

              {paths.length > 0 && (
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:"#f87171",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                    <span style={{width:8,height:8,borderRadius:"50%",background:"#ef4444",display:"inline-block"}} />
                    {paths.length} nodes affected
                  </div>
                  {paths.slice(0,14).map(r => {
                    const n = NODES.find(x => x.id===r.nodeId);
                    if (!n) return null;
                    const pct = Math.round(r.pathWeight * 100);
                    return (
                      <div key={r.nodeId} style={{display:"flex",alignItems:"center",gap:8,background:"#111827",borderRadius:6,padding:"6px 10px",marginBottom:4,cursor:"pointer"}}
                        onClick={() => select(n)}>
                        <span style={{width:7,height:7,borderRadius:"50%",background:RISK_COLORS[n.riskLevel],flexShrink:0}} />
                        <span style={{flex:1,fontSize:12,color:"#d1d5db"}}>{n.label}</span>
                        <span style={{fontSize:10,color:"#6b7280"}}>{r.hops}h</span>
                        <div style={{display:"flex",alignItems:"center",gap:4,width:56}}>
                          <div style={{flex:1,height:3,background:"#1f2937",borderRadius:2}}>
                            <div style={{width:`${pct}%`,height:"100%",borderRadius:2,
                              background:pct>60?RISK_COLORS.critical:pct>30?RISK_COLORS.high:RISK_COLORS.medium}} />
                          </div>
                          <span style={{fontSize:10,color:pct>60?RISK_COLORS.critical:pct>30?RISK_COLORS.high:RISK_COLORS.medium,width:26,textAlign:"right"}}>{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                  {paths.length>14 && <p style={{fontSize:11,color:"#4b5563",textAlign:"center",marginTop:4}}>+{paths.length-14} more</p>}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div style={{fontSize:12,fontWeight:600,color:"#6b7280",marginBottom:10}}>Protocols</div>
              {NODES.filter(n=>n.type==="protocol"&&(chain==="all"||n.chain===chain)).map(n => (
                <div key={n.id} onClick={() => select(n)}
                  style={{background:"#111827",borderRadius:6,padding:"10px 12px",marginBottom:6,cursor:"pointer"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontWeight:500,fontSize:13}}>{n.label}</span>
                    <span style={{fontSize:10,padding:"2px 6px",borderRadius:4,background:RISK_COLORS[n.riskLevel]+"33",color:RISK_COLORS[n.riskLevel]}}>{n.riskLevel}</span>
                  </div>
                  <div style={{fontSize:11,color:"#6b7280",marginTop:4,display:"flex",gap:8}}>
                    <span style={{color:CHAIN_COLORS[n.chain]}}>{n.chain}</span>
                    {n.poolArch && <span style={{color:n.poolArch==="shared"?RISK_COLORS.high:RISK_COLORS.low}}>{n.poolArch}</span>}
                    {n.tvl && <span>${(n.tvl/1000).toFixed(1)}B</span>}
                  </div>
                </div>
              ))}
              <div style={{fontSize:12,fontWeight:600,color:"#6b7280",margin:"16px 0 10px"}}>Critical Risk Nodes</div>
              {NODES.filter(n=>n.riskLevel==="critical").map(n => (
                <div key={n.id} onClick={() => select(n)}
                  style={{border:"1px solid #581c87",background:"rgba(88,28,135,0.15)",borderRadius:6,padding:"10px 12px",marginBottom:6,cursor:"pointer"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{width:8,height:8,borderRadius:"50%",background:"#7c3aed",display:"inline-block",animation:"pulse 2s infinite"}} />
                    <span style={{fontWeight:500,fontSize:13}}>{n.label}</span>
                  </div>
                  <p style={{fontSize:11,color:"#6b7280",marginTop:4,lineHeight:1.5,WebkitLineClamp:2,display:"-webkit-box",WebkitBoxOrient:"vertical",overflow:"hidden"}}>{n.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
