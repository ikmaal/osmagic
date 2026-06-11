-- OSMAGIC shared workspace schema
-- Run in Supabase Dashboard → SQL Editor → New query → Run

-- Batches: one row per imported file (GeoJSON stored as JSONB)
create table if not exists public.osmagic_batches (
    workspace_id text not null,
    id text not null,
    label text not null default 'Import',
    created_at timestamptz not null default now(),
    current_index integer not null default 0,
    current_view text not null default 'all',
    geojson jsonb,
    sequences_meta jsonb not null default '[]'::jsonb,
    updated_at timestamptz not null default now(),
    primary key (workspace_id, id)
);

-- Singleton app UI state per workspace
create table if not exists public.osmagic_app_state (
    workspace_id text primary key,
    active_batch_id text,
    current_index integer not null default 0,
    current_view text not null default 'all',
    updated_at timestamptz not null default now()
);

create index if not exists osmagic_batches_workspace_idx
    on public.osmagic_batches (workspace_id, updated_at desc);

alter table public.osmagic_batches enable row level security;
alter table public.osmagic_app_state enable row level security;

-- Team sharing: open access for anyone with the anon key + workspace_id in the app.
-- Tighten later with Supabase Auth (see docs/SUPABASE.md).
create policy "osmagic_batches_anon_all"
    on public.osmagic_batches for all
    to anon, authenticated
    using (true) with check (true);

create policy "osmagic_app_state_anon_all"
    on public.osmagic_app_state for all
    to anon, authenticated
    using (true) with check (true);

-- Optional: realtime so colleagues see changes without manual refresh
alter publication supabase_realtime add table public.osmagic_batches;
alter publication supabase_realtime add table public.osmagic_app_state;
