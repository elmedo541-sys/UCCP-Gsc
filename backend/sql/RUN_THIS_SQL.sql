-- Run this in Supabase Dashboard -> SQL Editor -> New query -> Run
-- Without this, moving photos into folders (drag-and-drop) silently
-- fails to save: it looks like it worked in the browser, but the change
-- never actually reaches the database, so it reverts on next reload.

-- Check what policies currently exist on media_gallery (informational only):
-- select * from pg_policies where tablename = 'media_gallery';

create policy "Public update access for media_gallery"
on media_gallery for update
using (true)
with check (true);
