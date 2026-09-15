-- Adds e-signature capture on quote approval, and post-job review request follow-ups.
-- Run this once in Supabase SQL Editor.

alter table quotes add column if not exists signature_data text;
alter table quotes add column if not exists signature_name text;
alter table quotes add column if not exists signed_at timestamptz;
alter table quotes add column if not exists completed_at timestamptz;
alter table quotes add column if not exists review_requested_at timestamptz;

alter table profiles add column if not exists review_link text;

-- status now also takes 'Completed' (Draft | Sent | Approved | Rejected | Completed) — no check
-- constraint exists on this column, so no migration needed for that.
