# Deploy this package together

This package combines targeted account security fixes with a homepage/member welcome refresh. It has NOT been deployed. SQL tests ran inside transactions that were rolled back, including the synthetic verification-code test row. Production permissions are therefore unchanged.

## Files and scope

- `sql/security_auth_hardening.sql`: closes direct public password/admin-creation entry points; protects session tokens, verification codes and password-hash columns; adds atomic password recovery and current-password verification.
- `backend/supabase/Functions/verify-and-update/index.ts`: password recovery now delegates to the atomic SQL routine. Existing email-change branch remains unchanged and still needs a separate security review.
- `backend/supabase/Functions/admin-auth/index.ts`: public signup is disabled. Existing super-admin validation is retained for creating viewer/editor admins.
- `backend/supabase/Functions/send-verification-code/index.ts`: codes use cryptographic randomness. Existing mail provider configuration is retained.
- Frontend profile and password recovery match the new database password requirements (8 characters minimum, 72 bytes maximum). Existing login passwords continue to work.
- Homepage uses existing uploaded photos and events; adds a logged-in member welcome section with profile/feed links and next activity. No worship times, church address or announcements were invented. Gallery tile hover and navigation focus effects are included.

## Deployment order

First test the complete set in a staging Supabase project and matching frontend. Retain a backup of the current database function definitions and deployed Edge Function source. Verify the deployed functions match these source files; the provided zip may differ from production code.

For coordinated production deployment, arrange a short maintenance window for account operations:

1. In Supabase SQL Editor, run `sql/security_auth_hardening.sql` as the project administrator. It is a transactional installation script, not a generated CLI migration. Review the SQL result for errors before continuing.
2. Update and deploy the existing Edge Functions named `verify-and-update`, `admin-auth`, and `send-verification-code` using the matching files in this package. Preserve existing secrets and function JWT settings. Service-role credentials belong only in these server functions. Copying the files locally or pushing frontend code does not deploy these functions.
3. Deploy the matching frontend files. The new profile password change requires `change_member_password`; do not deploy it before SQL. The old recovery implementation stops working after the restricted helpers are installed until its Edge Function is updated.
4. Test existing member/admin login, current-password change, emailed-code recovery, logout/login after recovery, super-admin creation of viewer/editor accounts and rejection for ordinary admins. Confirm other member sessions expire after reset. Check both desktop and phone sizes and reduced-motion settings.

## Verification evidence

Passed: frontend TypeScript check and Tailwind compilation. SQL dry-run compiled the routines against actual schema. Permission checks reported anonymous access FALSE for unsafe password reset, admin creation, session reads and password-hash reads. Unknown recovery proof returned invalid_code. Five wrong guesses against a synthetic code produced attempts=5 and used=true. Both transactions were rolled back.

Not yet tested: successful real account password change/recovery, email delivery, simultaneous recovery requests, deployment of Edge Functions, browser visual layout, production bundle. Edge Function source syntax is checked separately; no claim is made that server deployment succeeded.

Post-deployment metadata checks (must return false):

```sql
select
  has_function_privilege('anon', 'public.update_user_password(text,text)', 'EXECUTE') as public_reset,
  has_function_privilege('anon', 'public.create_admin_user(text,text)', 'EXECUTE') as public_create_admin,
  has_function_privilege('anon', 'public.create_sub_admin(text,text,text)', 'EXECUTE') as public_create_sub_admin,
  has_table_privilege('anon', 'public.user_sessions', 'SELECT') as public_sessions,
  has_column_privilege('anon', 'public.user_auth', 'password_hash', 'SELECT') as public_password_hashes;
```

## Still required before calling the site secure

This is targeted hardening, not a full authentication migration. Existing permissive people/children/content/storage policies and private prayer access remain findings from `RELIABILITY_AND_PERMISSIONS_REVIEW.md`. Login/recovery issuance rate limiting, privileged RPC audit, atomic email-change proof consumption and session revocation on ordinary logout still need work. Username metadata remains selectable for the existing profile UI. Custom sessions are not Supabase Auth JWTs, so generic auth.uid() policies would break existing features. Prepare a coordinated authorization migration rather than masking those findings with UI controls.
