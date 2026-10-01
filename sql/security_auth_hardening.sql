-- Apply with the matching frontend and Edge Function updates; see docs/AUTH_DEPLOYMENT.md.
BEGIN;
ALTER TABLE public.verification_codes ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;

-- Internal helpers must only be called by service-role Edge Functions.
REVOKE EXECUTE ON FUNCTION public.update_user_password(text,text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_admin_user(text,text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_sub_admin(text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_password(text,text), public.create_admin_user(text,text), public.create_sub_admin(text,text,text) TO service_role;
ALTER FUNCTION public.update_user_password(text,text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.create_admin_user(text,text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.create_sub_admin(text,text,text) SET search_path = public, extensions, pg_temp;

-- Direct clients must not read or forge custom session tokens or password hashes.
REVOKE ALL ON TABLE public.user_sessions FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.user_sessions TO service_role;
REVOKE ALL ON TABLE public.user_auth FROM PUBLIC, anon, authenticated;
GRANT SELECT (person_id, username, username_changed) ON public.user_auth TO anon, authenticated;
GRANT ALL ON TABLE public.user_auth TO service_role;
REVOKE ALL ON TABLE public.verification_codes FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.verification_codes TO service_role;

-- A token alone is insufficient: current password is verified in the same transaction.
CREATE OR REPLACE FUNCTION public.change_member_password(p_token text, p_current_password text, p_new_password text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE member_id uuid; account public.user_auth%ROWTYPE;
BEGIN
  IF p_new_password IS NULL OR length(p_new_password) < 8 OR octet_length(p_new_password) > 72 THEN
    RAISE EXCEPTION 'Use a password of at least 8 characters and at most 72 bytes';
  END IF;
  SELECT s.person_id INTO member_id FROM public.user_sessions s
    WHERE s.token = p_token AND s.expires_at > now();
  IF member_id IS NULL THEN RAISE EXCEPTION 'Sign in again to change your password'; END IF;
  SELECT * INTO account FROM public.user_auth WHERE person_id = member_id FOR UPDATE;
  IF account.id IS NULL OR p_current_password IS NULL OR
     extensions.crypt(p_current_password, account.password_hash) IS DISTINCT FROM account.password_hash THEN
    RAISE EXCEPTION 'Current password is incorrect';
  END IF;
  UPDATE public.user_auth SET password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf')), password_plain = NULL WHERE id = account.id;
  DELETE FROM public.user_sessions WHERE person_id = member_id AND token <> p_token;
  RETURN true;
END; $$;
REVOKE EXECUTE ON FUNCTION public.change_member_password(text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.change_member_password(text,text,text) TO anon, authenticated, service_role;

-- Recovery proof, attempt counting, password update and consumption are atomic.
CREATE OR REPLACE FUNCTION public.reset_member_password_with_code(p_email text, p_code text, p_new_password text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE proof public.verification_codes%ROWTYPE; member_id uuid;
BEGIN
  IF p_email IS NULL OR p_code IS NULL OR p_code !~ '^[0-9]{6}$' OR
     p_new_password IS NULL OR length(p_new_password) < 8 OR octet_length(p_new_password) > 72 THEN
    RETURN 'invalid_request';
  END IF;
  SELECT * INTO proof FROM public.verification_codes WHERE email = p_email AND type = 'password_reset'
    AND used = false AND expires_at > now() ORDER BY created_at DESC, id DESC LIMIT 1 FOR UPDATE;
  IF proof.id IS NULL THEN RETURN 'invalid_code'; END IF;
  IF proof.attempts >= 5 THEN RETURN 'too_many_attempts'; END IF;
  IF proof.code IS DISTINCT FROM p_code THEN
    UPDATE public.verification_codes SET attempts = attempts + 1, used = (attempts + 1 >= 5) WHERE id = proof.id;
    RETURN 'invalid_code';
  END IF;
  SELECT person_id INTO member_id FROM public.user_auth WHERE email = p_email FOR UPDATE;
  IF member_id IS NULL THEN RETURN 'invalid_code'; END IF;
  UPDATE public.user_auth SET password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf')), password_plain = NULL WHERE person_id = member_id;
  UPDATE public.verification_codes SET used = true WHERE email = p_email AND type = 'password_reset' AND used = false;
  DELETE FROM public.user_sessions WHERE person_id = member_id;
  RETURN 'success';
END; $$;
REVOKE EXECUTE ON FUNCTION public.reset_member_password_with_code(text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_member_password_with_code(text,text,text) TO service_role;
COMMIT;
