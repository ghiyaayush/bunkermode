/**
 * BunkerMode Telegram bot.
 *
 * Responsibilities:
 *   1. Capture chat_id when a user clicks /start <wallet_hash>
 *   2. Deliver T1 alerts (single-source signals)
 *   3. Deliver Module A timed post-incident sequence
 *   4. Deliver Module B supply chain refusal
 *   5. Deliver P11 monthly governance audit digest
 *
 * Anonymous: only chat_id is stored, never @handle.
 *
 * Run with:    bun telegram/bot.ts
 */

import { Bot } from "grammy";
import { POST_INCIDENT_SEQUENCE, fillTemplate, SUPPLY_CHAIN_REFUSAL_MESSAGE } from "../lib/postIncident";
import type { AttackClass } from "../lib/types";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN not set. Bot will not start.");
  process.exit(1);
}
const API_BASE = process.env.BUNKER_API_BASE ?? "http://localhost:3000";

const bot = new Bot(TOKEN);

bot.command("start", async (ctx) => {
  const payload = ctx.match;
  await ctx.reply(
    `BunkerMode connected.\n\nChat id: ${ctx.chat.id}\nLink token: ${payload || "(none)"}\n\nWe never store your @handle - only this anonymous chat id.\n\nNext: complete linking on the Setup page.`,
  );

  if (payload) {
    // Forward to API to link wallet to chat_id
    const walletAddress = payload; // expects raw 0x address; production uses a hash + nonce
    await fetch(`${API_BASE}/api/telegram`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress, chatId: String(ctx.chat.id) }),
    });
  }
});

bot.command("audit", async (ctx) => {
  const wallet = ctx.match;
  if (!wallet) {
    await ctx.reply("Usage: /audit 0xYourWallet");
    return;
  }
  const res = await fetch(`${API_BASE}/api/audit?wallet=${encodeURIComponent(wallet)}`);
  const d = await res.json();
  await ctx.reply(`<pre>${escapeHtml(d.digest)}</pre>`, { parse_mode: "HTML" });
});

bot.command("status", async (ctx) => {
  const wallet = ctx.match;
  if (!wallet) {
    await ctx.reply("Usage: /status 0xYourWallet");
    return;
  }
  const res = await fetch(`${API_BASE}/api/threat?wallet=${encodeURIComponent(wallet)}`);
  const d = await res.json();
  if (!res.ok) {
    await ctx.reply(`Error: ${d.error}`);
    return;
  }
  await ctx.reply(
    `Tier: ${d.state.tier}\nAttack: ${d.state.attackClass ?? "none"}\nThreat env: ${d.threatEnv.level}\nUtilization: ${(d.utilization * 100).toFixed(1)}%\nExit route: ${d.state.exitRoute ?? "—"}`,
  );
});

bot.command("help", async (ctx) => {
  await ctx.reply(
    `BunkerMode commands:\n\n/start <wallet>  Link this chat to a wallet\n/audit <wallet>  Run P11 governance audit\n/status <wallet> Show current threat tier`,
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Outbound senders (called from server-side after events)
// ─────────────────────────────────────────────────────────────────────────────
export async function sendT1Alert(chatId: string, source: string, protocol: string) {
  await bot.api.sendMessage(
    chatId,
    `T1 alert: 1 source detected.\nSource: ${source}\nProtocol: ${protocol}\n\nWe will escalate if a second source corroborates.`,
  );
}

export async function sendSupplyChainRefusal(chatId: string) {
  await bot.api.sendMessage(chatId, SUPPLY_CHAIN_REFUSAL_MESSAGE);
}

export async function startPostIncidentSequence(
  chatId: string,
  attackClass: AttackClass,
  context: Parameters<typeof fillTemplate>[1],
) {
  const messages = POST_INCIDENT_SEQUENCE.filter(
    (m) => m.applicableTo === "all" || m.applicableTo.includes(attackClass),
  );
  for (const m of messages) {
    setTimeout(async () => {
      try {
        await bot.api.sendMessage(chatId, fillTemplate(`${m.subject}\n\n${m.body}`, context));
      } catch (err) {
        console.error("[telegram] failed to send", err);
      }
    }, m.delaySeconds * 1000);
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!);
}

if (import.meta.main) {
  console.log("BunkerMode Telegram bot starting...");
  bot.start();
}
