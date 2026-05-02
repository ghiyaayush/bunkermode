/**
 * BunkerMode MCP server.
 *
 * Exposes four tools to Claude (or any MCP runtime):
 *   - create_bunker_plan
 *   - list_active_threats
 *   - run_governance_audit
 *   - simulate_fire
 *
 * Run with:    bun mcp/server.ts
 * Configure in Claude Desktop's mcp_config.json.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const API_BASE = process.env.BUNKER_API_BASE ?? "http://localhost:3000";

const server = new Server(
  { name: "bunkermode", version: "0.2.0" },
  { capabilities: { tools: {} } },
);

// ─────────────────────────────────────────────────────────────────────────────
// Tool schemas
// ─────────────────────────────────────────────────────────────────────────────
const CreatePlanArgs = z.object({
  walletAddress: z.string(),
  templateKey: z
    .enum(["aave-rseth-cascade", "drift-governance", "sky-usds-loop"])
    .default("aave-rseth-cascade"),
});

const ListThreatsArgs = z.object({
  walletAddress: z.string(),
});

const AuditArgs = z.object({
  walletAddress: z.string(),
});

const FireArgs = z.object({
  walletAddress: z.string(),
  attackClass: z
    .enum([
      "flash_loan_oracle",
      "access_control",
      "spoof_token",
      "zk_verifier",
      "bridge_verifier",
      "dprk_attributed",
      "supply_chain",
      "unknown",
    ])
    .default("bridge_verifier"),
});

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "create_bunker_plan",
      description:
        "Create a BunkerMode policy for a wallet from a template. Templates: aave-rseth-cascade, drift-governance, sky-usds-loop.",
      inputSchema: {
        type: "object",
        properties: {
          walletAddress: { type: "string", description: "0x address" },
          templateKey: {
            type: "string",
            enum: ["aave-rseth-cascade", "drift-governance", "sky-usds-loop"],
          },
        },
        required: ["walletAddress"],
      },
    },
    {
      name: "list_active_threats",
      description:
        "Get the current corroborated threat tier for a wallet, with attack class, utilization, and exit route.",
      inputSchema: {
        type: "object",
        properties: { walletAddress: { type: "string" } },
        required: ["walletAddress"],
      },
    },
    {
      name: "run_governance_audit",
      description:
        "Run P11 monthly governance audit (Drift Three-Question Screen) across the wallet's portfolio. Returns Telegram-ready digest.",
      inputSchema: {
        type: "object",
        properties: { walletAddress: { type: "string" } },
        required: ["walletAddress"],
      },
    },
    {
      name: "simulate_fire",
      description:
        "Simulate a T3 fire for the demo. Useful when configuring or testing a policy.",
      inputSchema: {
        type: "object",
        properties: {
          walletAddress: { type: "string" },
          attackClass: { type: "string" },
        },
        required: ["walletAddress"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const name = req.params.name;
  const args = req.params.arguments ?? {};

  try {
    switch (name) {
      case "create_bunker_plan": {
        const a = CreatePlanArgs.parse(args);
        const res = await fetch(`${API_BASE}/api/policy`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(a),
        });
        const d = await res.json();
        return {
          content: [
            {
              type: "text",
              text: res.ok
                ? `Policy created. id=${d.policyId}, asset=${d.policy.asset}, protocol=${d.policy.protocol}.`
                : `Failed: ${d.error}`,
            },
          ],
        };
      }

      case "list_active_threats": {
        const a = ListThreatsArgs.parse(args);
        const res = await fetch(`${API_BASE}/api/threat?wallet=${encodeURIComponent(a.walletAddress)}`);
        const d = await res.json();
        if (!res.ok) {
          return { content: [{ type: "text", text: `Error: ${d.error}` }] };
        }
        const lines = [
          `Tier: ${d.state.tier}`,
          `Attack class: ${d.state.attackClass ?? "none"}`,
          `Threat env: ${d.threatEnv.level} (${d.threatEnv.reason})`,
          `Utilization: ${(d.utilization * 100).toFixed(1)}% (lockout: ${d.lockoutTriggered ? "YES" : "no"})`,
          `Exit route: ${d.state.exitRoute ?? "—"}`,
          ``,
          `Reasoning:`,
          ...d.state.reasonCodes.map((r: string) => `  - ${r}`),
        ];
        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      case "run_governance_audit": {
        const a = AuditArgs.parse(args);
        const res = await fetch(`${API_BASE}/api/audit?wallet=${encodeURIComponent(a.walletAddress)}`);
        const d = await res.json();
        if (!res.ok) {
          return { content: [{ type: "text", text: `Error: ${d.error}` }] };
        }
        return { content: [{ type: "text", text: d.digest }] };
      }

      case "simulate_fire": {
        const a = FireArgs.parse(args);
        const res = await fetch(`${API_BASE}/api/fire`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress: a.walletAddress,
            attackClass: a.attackClass,
            exitRoute: "usdc-base-cctp",
            reason: "MCP-triggered simulate_fire",
          }),
        });
        const d = await res.json();
        if (!res.ok) {
          return { content: [{ type: "text", text: `Error: ${d.error}` }] };
        }
        const lines = [
          `Fire executed. eventId=${d.eventId}`,
          `KeeperHub via=${d.keeperhub.via}, exec=${d.keeperhub.executionId}`,
          `Gas: $${d.keeperhub.fees.gasUsd}, x402: $${d.keeperhub.fees.x402Usd}`,
          `Charge tx: ${d.charge.txHash} (${d.charge.protocol})`,
        ];
        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      default:
        return { content: [{ type: "text", text: `Unknown tool: ${name}` }] };
    }
  } catch (err) {
    return {
      content: [
        { type: "text", text: `Error in ${name}: ${err instanceof Error ? err.message : String(err)}` },
      ],
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("BunkerMode MCP server running on stdio");
