-- ============================================================
-- SECURITY FIX 2: Rate-limit verification code attempts
-- Run this in Supabase Dashboard -> SQL Editor -> New query -> Run
-- ============================================================

alter table verification_codes
  add column if not exists attempts integer not null default 0;
