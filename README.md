# UCCP-GSC

Church member registration, community feed, and admin portal for
UCCP-Good Samaritan Church.

## Project structure

```
/frontend   React + Vite app (everything users and admins interact with)
/backend    Supabase edge functions + SQL (server-side logic and database)
```

### /frontend

The React SPA. This is what gets built and deployed to Vercel.

```
cd frontend
npm install --legacy-peer-deps
npm run dev
```

### /backend

- `supabase/Functions/` — Supabase Edge Functions (Deno). These are
  managed directly through the Supabase Dashboard (Edge Functions
  tab) — moving them here does not change how they're deployed, it
  just keeps a version-controlled copy alongside the rest of the
  code for reference and future edits.
- `sql/` — Numbered SQL files documenting database functions,
  policies, and schema changes made directly in the Supabase SQL
  Editor over time. These are historical record, not an automated
  migration runner — run them manually in the SQL Editor if you
  ever need to recreate them on a fresh database.

## Deployment

**Frontend (Vercel):** in the Vercel project settings, set
**Root Directory** to `frontend`. `frontend/vercel.json` already
contains the build command, output directory, and SPA rewrite rule.

**Backend (Supabase):** the database (tables, RLS policies, RPC
functions) and Edge Functions live in your Supabase project and are
managed through the Supabase Dashboard. `backend/sql/` is a reference
copy, not a live sync.
