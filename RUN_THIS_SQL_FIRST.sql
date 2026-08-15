-- Run this in Supabase Dashboard -> SQL Editor -> New query -> Run
-- Adds the permission column that lets a super admin grant specific
-- admins the ability to manually add/register members.

alter table admin_credentials
  add column if not exists can_register_members boolean not null default false;
