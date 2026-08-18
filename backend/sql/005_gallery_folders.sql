-- ============================================================
-- Adds folder organization to the media gallery, scoped per
-- church organization (UCM, CWA, CYAF, CYF, Children).
-- Run this in Supabase Dashboard -> SQL Editor.
-- ============================================================

create table if not exists gallery_folders (
  id uuid primary key default gen_random_uuid(),
  organization text not null,
  name text not null,
  created_by text,
  created_at timestamptz not null default now()
);

alter table media_gallery add column if not exists folder_id uuid references gallery_folders(id) on delete set null;

-- Permissive RLS matching this app's existing pattern (access control
-- is enforced in the React app, e.g. checking the member's own
-- organization matches the folder's organization before showing the
-- create/upload UI) — not enforced at the database layer.
create policy "Allow all on gallery_folders"
on gallery_folders
for all
using (true)
with check (true);
