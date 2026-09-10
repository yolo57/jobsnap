-- Safe to run any time — only adds columns that are missing, never touches existing data.
alter table profiles add column if not exists email text;
alter table profiles add column if not exists company_name text default 'My Company';
alter table profiles add column if not exists owner_name text;
alter table profiles add column if not exists phone text;
alter table profiles add column if not exists logo_url text;
alter table profiles add column if not exists license_number text;
alter table profiles add column if not exists payment_terms text default 'Due upon completion';
alter table profiles add column if not exists quote_notes text default 'Thank you for your business!';
alter table profiles add column if not exists tax_rate numeric default 0;
alter table profiles add column if not exists stripe_customer_id text;
alter table profiles add column if not exists stripe_subscription_id text;
alter table profiles add column if not exists plan text default 'free';
alter table profiles add column if not exists plan_status text default 'active';
alter table profiles add column if not exists quotes_used_this_month integer default 0;
alter table profiles add column if not exists billing_period_start timestamptz default now();
alter table profiles add column if not exists followups_enabled boolean default true;
alter table profiles add column if not exists created_at timestamptz default now();

alter table quotes add column if not exists followup_enabled boolean default false;
alter table quotes add column if not exists followup_sent_24h boolean default false;
alter table quotes add column if not exists followup_sent_3d boolean default false;
alter table quotes add column if not exists followup_sent_7d boolean default false;
alter table quotes add column if not exists sent_at timestamptz;
alter table quotes add column if not exists approved_at timestamptz;

-- Make sure RLS update policy exists (safe to re-run)
drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
