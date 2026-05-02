import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Wallet {
  id: string;
  chat_id: string;
  address: string;
  chain: "ethereum" | "solana" | "starknet";
  label: string | null;
  active: boolean;
  created_at: string;
}

export interface Position {
  id: string;
  wallet_id: string;
  node_id: string;
  name: string;
  balance: number | null;
  is_protocol: boolean;
  updated_at: string;
}

export interface WalletExposure {
  wallet_id: string;
  chat_id: string;
  address: string;
  chain: string;
  label: string | null;
  node_id: string;
  position_name: string;
  balance: number | null;
  is_protocol: boolean;
  position_updated_at: string;
}

// ─── Client ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = SupabaseClient<any>;

function getClient(): AnyClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set");
  return createClient(url, key, { auth: { persistSession: false } });
}

export const db: AnyClient = getClient();

// ─── Wallet helpers ───────────────────────────────────────────────────────────

export async function getWalletsByChatId(chatId: string): Promise<Wallet[]> {
  const { data, error } = await db
    .from("wallets")
    .select("*")
    .eq("chat_id", chatId)
    .eq("active", true)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as Wallet[];
}

export async function walletExists(chatId: string, address: string): Promise<boolean> {
  const { data } = await db
    .from("wallets")
    .select("id")
    .eq("chat_id", chatId)
    .eq("address", address.toLowerCase())
    .eq("active", true)
    .maybeSingle();
  return !!data;
}

export async function registerWallet(
  chatId: string,
  address: string,
  chain: Wallet["chain"]
): Promise<Wallet> {
  const { data, error } = await db
    .from("wallets")
    .upsert(
      { chat_id: chatId, address: address.toLowerCase(), chain, active: true },
      { onConflict: "chat_id,address" }
    )
    .select()
    .single();
  if (error) throw error;
  return data as Wallet;
}

export async function deactivateWallet(walletId: string): Promise<void> {
  const { error } = await db
    .from("wallets")
    .update({ active: false })
    .eq("id", walletId);
  if (error) throw error;
}

// ─── Position helpers ─────────────────────────────────────────────────────────

export async function upsertPositions(
  walletId: string,
  positions: Array<{ node_id: string; name: string; balance: number; is_protocol: boolean }>
): Promise<void> {
  if (positions.length === 0) return;
  const { error } = await db.from("positions").upsert(
    positions.map((p) => ({
      wallet_id: walletId,
      node_id: p.node_id,
      name: p.name,
      balance: p.balance,
      is_protocol: p.is_protocol,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "wallet_id,node_id" }
  );
  if (error) throw error;
}

export async function getPositionsForWallet(walletId: string): Promise<Position[]> {
  const { data, error } = await db
    .from("positions")
    .select("*")
    .eq("wallet_id", walletId)
    .order("is_protocol", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Position[];
}

// ─── Alert-system interface ───────────────────────────────────────────────────

export async function getChatIdsExposedToNode(nodeId: string): Promise<string[]> {
  const { data, error } = await db
    .from("wallet_exposures")
    .select("chat_id")
    .eq("node_id", nodeId);
  if (error) throw error;
  return [...new Set(((data ?? []) as { chat_id: string }[]).map((r) => r.chat_id))];
}

export async function getAllWalletExposures(): Promise<WalletExposure[]> {
  const { data, error } = await db.from("wallet_exposures").select("*");
  if (error) throw error;
  return (data ?? []) as WalletExposure[];
}
