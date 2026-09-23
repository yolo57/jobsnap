-- Fixes quotes silently sending to customers in English even when the
-- contractor built them in Spanish. Safe to run any time.

alter table quotes add column if not exists language text default 'en';
update quotes set language = 'en' where language is null;
