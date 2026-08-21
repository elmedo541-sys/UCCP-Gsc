-- ============================================================
-- SECURITY FIX 1: Stop storing plaintext passwords
-- Run this in Supabase Dashboard -> SQL Editor -> New query -> Run
-- ============================================================

-- 1. Stop writing password_plain on new registrations.
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
  insert into user_auth (person_id, email, username, password_hash)
  values (p_person_id, p_email, p_username, crypt(p_password, gen_salt('bf')))
  returning id into new_auth_id;

  return new_auth_id;
end;
$$;

-- 2. Replace "view member's actual password" with username-only lookup.
-- (Admins can now RESET a member's password, but can never see it —
-- same standard every reputable site follows.)
create or replace function get_member_credentials(
  p_person_id uuid,
  p_admin_token text
)
returns table(username text)
language plpgsql
security definer
as $$
declare
  v_admin_role text;
begin
  select ac.role into v_admin_role
  from admin_sessions s
  join admin_credentials ac on ac.id = s.admin_id
  where s.token = p_admin_token
    and s.expires_at > now();

  if v_admin_role is distinct from 'super_admin' then
    raise exception 'Unauthorized';
  end if;

  return query
    select ua.username
    from user_auth ua
    where ua.person_id = p_person_id;
end;
$$;

-- 3. New: let a super admin reset a member's password without ever
-- seeing or storing it in plaintext.
create or replace function admin_reset_member_password(
  p_person_id uuid,
  p_admin_token text,
  p_new_password text
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_admin_role text;
begin
  select ac.role into v_admin_role
  from admin_sessions s
  join admin_credentials ac on ac.id = s.admin_id
  where s.token = p_admin_token
    and s.expires_at > now();

  if v_admin_role is distinct from 'super_admin' then
    raise exception 'Unauthorized';
  end if;

  if p_new_password is null or length(p_new_password) < 6 then
    raise exception 'Password must be at least 6 characters';
  end if;

  update user_auth
  set password_hash = crypt(p_new_password, gen_salt('bf'))
  where person_id = p_person_id;

  return found;
end;
$$;

-- 4. Purge existing plaintext passwords already stored, then remove
-- the column entirely so it can never be reintroduced accidentally.
alter table user_auth drop column if exists password_plain;

-- 5. Safe version of the self-service "forgot password" function used
-- by verify-and-update and phone-recovery edge functions. Recreated
-- here to guarantee it only ever writes the hash, never plaintext,
-- regardless of how it was originally defined in the dashboard.
create or replace function update_user_password(
  p_email text,
  p_password text
)
returns boolean
language plpgsql
security definer
as $$
begin
  if p_password is null or length(p_password) < 6 then
    raise exception 'Password must be at least 6 characters';
  end if;

  update user_auth
  set password_hash = crypt(p_password, gen_salt('bf'))
  where email = p_email;

  return found;
end;
$$;
