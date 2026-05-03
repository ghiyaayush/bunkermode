/**
 * Telegram dispatch — wired into Gyan's bot architecture.
 *
 * Source of truth:
 *   - Wallets / positions / exposure: Supabase (lib/supabase.ts)
 *   - Bot token: BOT_TOKEN env var (matches lib/bot.ts)
 *   - Message format: MarkdownV2 (matches the rest of Gyan's UX)
 *   - Dedup state: Prisma AlertDedup table (already migrated)
 *
 * Pipeline (called from app/api/webhook/forta/route.ts):
 *   Forta alert.addresses -> mapAddressesToNodeIds -> expandToDownstreamNodes
 *     -> getChatIdsExposedToNode(nodeId) -> dedup check -> sendMessage
 */

import { createHash } from "crypto";
import { db as prisma } from "./db";
import { getChatIdsExposedToNode, isSupabaseConfigured } from "./supabase";
import { nodeLabel } from "./forta-address-mapper";
import type { AttackClass, Tier } from "./types";

export const DEDUP_WINDOW_MS = 30 * 60 * 1000; // 30 min

export type AlertProvider = "forta" | "hypernative" | "cyvers";

export interface DispatchAlert {
  provider: AlertProvider;
  /** stable alert id from provider; same incident -> same id across hits */
  alertId: string;
  name: string;
  tier: Tier;
  attackClass: AttackClass | null;
  protocol: string;
  chainId: number;
  txHash?: string;
  description?: string;
  url?: string;
}

export interface DispatchTarget {
  chatId: string;
  /** the contagion node that triggered this dispatch */
  nodeId: string;
  /** how far this user is from the exploit root (0 = direct holder) */
  hops: number;
  /** contagion path weight (0..1) — higher = more exposed */
  weight: number;
  /** the originally-exploited node (for "X exploit cascades to your Y") */
  rootCause: string;
}

export interface DispatchResult {
  delivered: boolean;
  dedupHit: boolean;
  chatId: string;
  nodeId: string;
  reason: string;
}

const TIER_BADGE: Record<Tier, string> = {
  T1: "🟡 T1 ALERT",
  T2: "🟠 T2 CONFIRM",
  T3: "🔴 T3 AUTO-FIRE",
  REFUSED: "⛔ REFUSED",
};

// Telegram MarkdownV2: escape _ * [ ] ( ) ~ ` > # + - = | { } . !
function escMd(text: string): string {
  return text.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}

function dedupKey(provider: AlertProvider, alertId: string, chatId: string, nodeId: string): string {
  return createHash("sha256")
    .update(`${provider}|${alertId}|${chatId}|${nodeId}`)
    .digest("hex");
}

/**
 * True if this alert was already dispatched for this chat+node within
 * the dedup window. Records the hit either way.
 */
async function checkAndRecordDedup(
  alert: DispatchAlert,
  target: DispatchTarget,
): Promise<boolean> {
  const key = dedupKey(alert.provider, alert.alertId, target.chatId, target.nodeId);
  const now = new Date();

  const existing = await prisma.alertDedup.findUnique({ where: { key } });

  if (existing && existing.expiresAt > now) {
    await prisma.alertDedup.update({
      where: { key },
      data: { count: { increment: 1 }, lastSeen: now },
    });
    return true;
  }

  await prisma.alertDedup.upsert({
    where: { key },
    create: {
      key,
      provider: alert.provider,
      walletId: target.chatId, // store chat_id under walletId — Supabase wallet has its own uuid
      expiresAt: new Date(now.getTime() + DEDUP_WINDOW_MS),
    },
    update: {
      count: 1,
      firstSeen: now,
      lastSeen: now,
      expiresAt: new Date(now.getTime() + DEDUP_WINDOW_MS),
    },
  });
  return false;
}

export function formatAlert(alert: DispatchAlert, target: DispatchTarget): string {
  const root = nodeLabel(target.rootCause);
  const affected = nodeLabel(target.nodeId);
  const cascadeLine =
    target.hops === 0
      ? `*Direct exposure:* ${escMd(affected)}`
      : `*Cascade:* ${escMd(root)} → ${escMd(affected)}  \\(${target.hops} hops, weight ${(target.weight * 100).toFixed(0)}%\\)`;

  const lines: string[] = [];
  lines.push(`*${escMd(TIER_BADGE[alert.tier])}*`);
  lines.push(`*${escMd(alert.name)}* via ${escMd(alert.provider)}`);
  lines.push("");
  lines.push(cascadeLine);
  lines.push(`Protocol: \`${escMd(alert.protocol)}\``);
  if (alert.attackClass) lines.push(`Class: \`${escMd(alert.attackClass)}\``);
  if (alert.txHash) lines.push(`Tx: \`${escMd(alert.txHash)}\``);
  lines.push(`Chain: ${alert.chainId}`);
  if (alert.description) {
    lines.push("");
    lines.push(escMd(alert.description));
  }
  if (alert.url) {
    lines.push("");
    lines.push(`[Open in ${escMd(alert.provider)}](${alert.url})`);
  }
  return lines.join("\n");
}

function actionKeyboard(alert: DispatchAlert, nodeId: string) {
  // Callback data is limited to 64 bytes — keep ids short
  const short = alert.alertId.slice(0, 24);
  return {
    inline_keyboard: [
      [
        { text: "🛑 Pause exposure", callback_data: `pause:${nodeId}` },
        { text: "💤 Snooze 30m", callback_data: `snooze:${short}` },
      ],
      [{ text: "📊 Details", callback_data: `details:${short}` }],
    ],
  };
}

/**
 * Dispatch one alert to one chat, with dedup. Caller iterates targets.
 */
export async function dispatchAlert(
  alert: DispatchAlert,
  target: DispatchTarget,
): Promise<DispatchResult> {
  const dedupHit = await checkAndRecordDedup(alert, target);
  if (dedupHit) {
    return { delivered: false, dedupHit: true, chatId: target.chatId, nodeId: target.nodeId, reason: "deduped" };
  }

  const token = process.env.BOT_TOKEN;
  if (!token) {
    return { delivered: false, dedupHit: false, chatId: target.chatId, nodeId: target.nodeId, reason: "BOT_TOKEN not set" };
  }

  const text = formatAlert(alert, target);

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: target.chatId,
      text,
      parse_mode: "MarkdownV2",
      disable_web_page_preview: true,
      reply_markup: actionKeyboard(alert, target.nodeId),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return { delivered: false, dedupHit: false, chatId: target.chatId, nodeId: target.nodeId, reason: `telegram error: ${err}` };
  }

  return { delivered: true, dedupHit: false, chatId: target.chatId, nodeId: target.nodeId, reason: "ok" };
}

/**
 * Resolve a list of (nodeId, hops, weight, rootCause) into per-chat
 * dispatch targets. Each chat_id is targeted at most once per alert,
 * collapsed to its highest-weight exposure.
 */
export async function resolveTargets(
  exposureNodes: { nodeId: string; hops: number; weight: number; rootCause: string }[],
): Promise<DispatchTarget[]> {
  if (!isSupabaseConfigured()) {
    // No wallet store wired up yet — caller will see zero targets and skip dispatch.
    return [];
  }

  const byChat = new Map<string, DispatchTarget>();

  for (const exp of exposureNodes) {
    const chatIds = await getChatIdsExposedToNode(exp.nodeId);
    for (const chatId of chatIds) {
      const cur = byChat.get(chatId);
      if (!cur || exp.weight > cur.weight) {
        byChat.set(chatId, { chatId, ...exp });
      }
    }
  }

  return [...byChat.values()];
}
