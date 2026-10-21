-- Invoicing: let a quote/estimate double as an invoice, with or without
-- going through the normal Draft -> Sent -> Approved workflow.
alter table quotes add column if not exists is_invoice boolean not null default false;
alter table quotes add column if not exists due_date date;
alter table quotes add column if not exists invoiced_at timestamptz;

-- paid_at / payment_amount already exist (see supabase-add-payments-and-leads.sql)
-- and are set by the Stripe webhook regardless of quote status, so no change
-- needed there -- they work for invoices as-is.
