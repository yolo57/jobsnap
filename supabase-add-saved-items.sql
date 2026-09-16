-- ============================================================
-- Saved Items (contractor's reusable price-book entries)
-- Run this in Supabase Dashboard -> SQL Editor -> New Query
-- ============================================================

create table if not exists saved_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  task text not null,
  description text,
  unit text default 'ea',
  price numeric default 0,
  created_at timestamptz default now()
);

alter table saved_items enable row level security;

create policy "Users manage own saved items" on saved_items for all using (auth.uid() = user_id);

create index if not exists saved_items_user_id_idx on saved_items(user_id);
