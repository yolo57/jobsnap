-- Adds crew assignment + customer schedule-notification tracking to quotes.
-- Run in Supabase Dashboard -> SQL Editor -> New Query.

alter table quotes add column if not exists assigned_to text;
alter table quotes add column if not exists schedule_notified_at timestamptz;
