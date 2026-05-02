-- Run this in your Supabase project: SQL Editor → New query → paste → Run

-- Registered wallets
create table if not exists wallets (
  id          uuid primary key default gen_random_uuid(),
  chat_id     text not null,
  address     text not null,
  chain       text not null check (chain in ('ethereum', 'solana', 'starknet')),
  label       text,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (chat_id, address)
);

-- Last-known positions per wallet (refreshed on each scan)
create table if not exists positions (
  id          uuid primary key default gen_random_uuid(),
  wallet_id   uuid not null references wallets(id) on delete cascade,
  node_id     text not null,   -- matches contagion-graph node IDs
  name        text not null,
  balance     numeric,
  is_protocol boolean not null default false,
  updated_at  timestamptz not null default now(),
  unique (wallet_id, node_id)
);

-- Indexes useful for the alert system
create index if not exists idx_wallets_chat_id   on wallets(chat_id);
create index if not exists idx_wallets_active    on wallets(active) where active = true;
create index if not exists idx_positions_node_id on positions(node_id);
create index if not exists idx_positions_wallet  on positions(wallet_id);

-- View: flat join your teammate's alert system can query directly
-- "which chat_ids have exposure to node X?"
create or replace view wallet_exposures as
  select
    w.id          as wallet_id,
    w.chat_id,
    w.address,
    w.chain,
    w.label,
    p.node_id,
    p.name        as position_name,
    p.balance,
    p.is_protocol,
    p.updated_at  as position_updated_at
  from wallets w
  join positions p on p.wallet_id = w.id
  where w.active = true;
