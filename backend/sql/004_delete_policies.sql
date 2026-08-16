-- ============================================================
-- Row Level Security policies enabling DELETE on tables the app
-- lets admins/users delete from client-side. Without these, the
-- Supabase client's .delete() calls succeed silently (no error)
-- but affect 0 rows, so deleted items reappear after a refresh.
--
-- This app uses a custom username/password auth system (see
-- 002_user_auth_functions.sql) rather than Supabase Auth, so
-- these policies are intentionally permissive (using (true)) —
-- access control for who can trigger a delete is enforced in the
-- React app (e.g. isSuperAdmin checks), not at the RLS layer.
-- ============================================================

create policy "Allow delete on support_messages"
on support_messages
for delete
using (true);

create policy "Allow delete on feed_posts"
on feed_posts
for delete
using (true);
