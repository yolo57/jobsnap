-- Adds Stripe Connect (get-paid-online) support and inbound lead capture.
-- Run this once in Supabase Dashboard -> SQL Editor -> New Query.

-- Each contractor connects their own Stripe account so customer payments
-- go straight to their bank, minus JobSnap's small platform fee.
alter table profiles add column if not exists stripe_account_id text;
alter table profiles add column if not exists stripe_charges_enabled boolean default false;
alter table profiles add column if not exists stripe_payouts_enabled boolean default false;

-- Track payment on the quote/job itself.
alter table quotes add column if not exists paid_at timestamptz;
alter table quotes add column if not exists payment_amount numeric;

-- Distinguish jobs a contractor recorded vs. leads a customer submitted
-- through the public "Request a Quote" link.
alter table quotes add column if not exists source text default 'contractor';

alter table quotes add column if not exists customer_phone text;
