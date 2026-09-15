-- Job timeline: subcontractor progress updates + two-way chat between
-- contractor and customer, all on one feed per job. Run once in Supabase SQL Editor.

create table if not exists job_updates (
  id uuid default uuid_generate_v4() primary key,
  quote_id uuid references quotes(id) on delete cascade not null,
  entry_type text not null default 'update', -- update | message
  role text not null, -- contractor | sub | customer
  author_name text,
  message text,
  photos jsonb default '[]',
  created_at timestamptz default now()
);

create index if not exists job_updates_quote_id_idx on job_updates(quote_id);

alter table quotes add column if not exists sub_token text unique;

alter table job_updates enable row level security;

-- Contractors manage updates on their own quotes. Sub/customer writes go through
-- the API using the service-role key (same trust model as approve.js), so this
-- policy only governs direct client access.
create policy "Users manage own job updates" on job_updates for all using (
  exists (select 1 from quotes where quotes.id = job_updates.quote_id and quotes.user_id = auth.uid())
);
