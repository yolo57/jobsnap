-- ============================================================
-- JobSnap Database Schema
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Users / Profiles ────────────────────────────────────────
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  company_name text default 'My Company',
  owner_name text,
  phone text,
  logo_url text,
  license_number text,
  payment_terms text default 'Due upon completion',
  quote_notes text default 'Thank you for your business!',
  tax_rate numeric default 0,
  -- Subscription
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text default 'free', -- free | pro | premium
  plan_status text default 'active',
  quotes_used_this_month integer default 0,
  billing_period_start timestamptz default now(),
  -- Follow-up toggle
  followups_enabled boolean default true,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Customers ────────────────────────────────────────────────
create table if not exists customers (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  phone text,
  email text,
  address text,
  created_at timestamptz default now()
);

-- ─── Quotes ───────────────────────────────────────────────────
create table if not exists quotes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  number integer not null,
  customer_id uuid references customers(id) on delete set null,
  customer_name text,
  customer_email text,
  address text,
  status text default 'Draft', -- Draft | Sent | Approved | Rejected
  transcript text,
  line_items jsonb default '[]',
  subtotal numeric default 0,
  tax_rate numeric default 0,
  tax_amount numeric default 0,
  total numeric default 0,
  notes text,
  -- Follow-up tracking
  followup_enabled boolean default false,
  followup_sent_24h boolean default false,
  followup_sent_3d boolean default false,
  followup_sent_7d boolean default false,
  sent_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz default now()
);

-- ─── Row Level Security ───────────────────────────────────────
alter table profiles enable row level security;
alter table customers enable row level security;
alter table quotes enable row level security;

-- Profiles: users can only see/edit their own
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Customers: isolated per user
create policy "Users manage own customers" on customers for all using (auth.uid() = user_id);

-- Quotes: isolated per user
create policy "Users manage own quotes" on quotes for all using (auth.uid() = user_id);

-- Public quote view (for shareable links)
create policy "Public can view sent quotes" on quotes for select using (status in ('Sent', 'Approved', 'Rejected'));

-- ─── Indexes ──────────────────────────────────────────────────
create index if not exists quotes_user_id_idx on quotes(user_id);
create index if not exists quotes_status_idx on quotes(status);
create index if not exists customers_user_id_idx on customers(user_id);

-- ─── Quote number sequence per user ──────────────────────────
create or replace function get_next_quote_number(p_user_id uuid)
returns integer as $$
declare
  next_num integer;
begin
  select coalesce(max(number), 1000) + 1 into next_num
  from quotes where user_id = p_user_id;
  return next_num;
end;
$$ language plpgsql security definer;

-- ─── Scheduling (added) ───────────────────────────────────────
alter table quotes add column if not exists scheduled_date date;
alter table quotes add column if not exists scheduled_time text;
create index if not exists quotes_scheduled_date_idx on quotes(scheduled_date);
