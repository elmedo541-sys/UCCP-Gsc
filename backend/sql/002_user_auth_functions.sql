-- ============================================================
-- Custom username/password auth functions used by user-auth
-- edge function and the Register/UserLogin pages.
-- These currently live only in the Supabase database — this
-- file documents them for version control. If you need to
-- (re)create them, run this in Supabase Dashboard -> SQL Editor.
-- Requires the pgcrypto extension (already enabled on this project).
-- ============================================================

-- Creates a login credential row for a newly registered member.
-- Called from Register.tsx and AdminAddMemberDialog.tsx via
-- supabase.rpc('create_user_auth', ...).
create or replace function create_user_auth(
  p_person_id uuid,
  p_email text,
  p_username text,
  p_password text
)
returns uuid
language plpgsql
security definer
as $$
declare
  new_auth_id uuid;
begin
  insert into user_auth (person_id, email, username, password_hash, password_plain)
  values (p_person_id, p_email, p_username, crypt(p_password, gen_salt('bf')), p_password)
  returning id into new_auth_id;

  return new_auth_id;
end;
$$;

-- Verifies a username/password pair at login time.
-- Called from the user-auth edge function via
-- supabase.rpc('verify_user_credentials', ...).
-- Returns a single row: (is_valid boolean, person_id uuid).
-- Username lookup is case-sensitive by design (see conversation
-- notes on the "Elmidz" vs "elmidz" login issue) — deliberately
-- left as-is per product decision, not changed to case-insensitive.
create or replace function verify_user_credentials(
  p_username text,
  p_password text
)
returns table(is_valid boolean, person_id uuid)
language plpgsql
security definer
as $$
declare
  stored_hash text;
  v_person_id uuid;
begin
  select password_hash, user_auth.person_id into stored_hash, v_person_id
  from user_auth
  where username = p_username;

  if stored_hash is null then
    return query select false, null::uuid;
    return;
  end if;

  if stored_hash = crypt(p_password, stored_hash) then
    return query select true, v_person_id;
  else
    return query select false, null::uuid;
  end if;
end;
$$;
