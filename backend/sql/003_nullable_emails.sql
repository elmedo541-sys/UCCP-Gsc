-- ============================================================
-- Allows members to be registered without an email address.
-- The admin "Add Member" form and public registration form both
-- describe email as optional, but the schema originally required
-- it (NOT NULL), causing "Failed to add member" errors.
-- ============================================================

alter table people alter column email drop not null;
alter table user_auth alter column email drop not null;
