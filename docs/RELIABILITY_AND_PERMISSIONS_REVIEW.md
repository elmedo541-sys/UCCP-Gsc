# Reliability changes and permissions review

Reviewed 2026-10-01. This package contains complete changed files, not patch fragments. Apply at the repository root after the earlier design updates. No live database, policies, accounts or storage settings were changed. No production commit or push was made from this extracted source copy.

## Included changes

- RPC types now match the live signatures of admin_reset_member_password, get_prayer_requests and update_prayer_request_answered.
- Directory search/filtering requests 24 matching members per page with exact counts and a 250 ms debounce. Stale responses are ignored.
- Feed searches post text and loads 20 posts at a time. Related-data failures show a retry state. Concurrent fetch results are guarded.
- Gallery searches captions/descriptions/uploader names and paginates 24 items; lightbox indexes remain relative to the filtered list. Admin member table paginates 25 records, preserving full filtered CSV export.
- Events, member directory, feed, gallery, public prayers and admin prayers distinguish load failure from empty results and offer retry. Admin member table reports failure too.
- Feed/gallery uploads reject empty or unsupported files and images over 10 MiB / videos over 100 MiB. Gallery accepts at most 20 files per batch. MIME/size validation is a convenience; the server must independently enforce limits and permissions.
- Large JPEG/PNG/WebP photos are resized to at most 1920 pixels on the longest side, using a compressed file only when smaller. GIFs remain unchanged. Object URLs are released.
- Gallery uploads run sequentially and report completed file count, not byte progress. Failed gallery database saves trigger uploaded-file cleanup. Feed failures preserve the draft and clean up unused photos. Cleanup failures notify the user.
- TypeScript ignoreDeprecations matches the supplied TypeScript 5.9 toolchain.

## Verified backend findings — remediation required

The connected Supabase project matched the source client. Review used function definitions, policy metadata, grants, bucket configuration and security advisors only; no member records, credentials or private request contents were read.

| Priority | Finding | Consequence | Required backend change |
| --- | --- | --- | --- |
| Critical | Publicly executable SECURITY DEFINER update_user_password accepts only email/password and does not verify a session or recovery proof. | A caller can attempt password replacement without completing recovery. | Replace this entry point with a recovery operation that atomically verifies a single-use, expiring proof. Revoke anonymous execution of the unsafe routine after deploying its replacement. |
| Critical | create_admin_user and create_sub_admin are publicly executable and do not validate an authorized caller. | Unauthorized admin account creation is possible. | Restrict account creation to validated super-admin authority; remove public execution. Provision an initial administrator through a trusted server process. |
| Critical | user_sessions permits anonymous SELECT/INSERT/DELETE with true predicates. | Session exposure or forged sessions can undermine otherwise token-checked RPCs. | Make sessions server-only; derive identity through trusted authentication and protect token issuance/revocation. |
| High | user_auth UPDATE, people SELECT/UPDATE, children CRUD and several content-table policies use broad true predicates for anonymous/public access. | Public callers can bypass UI permissions and access or change data. | Define explicit read/write roles and field exposure; revoke direct anonymous writes and route privileged operations through checked server functions. |
| High | prayer_requests has an unrestricted ALL policy. | is_public filtering in the UI does not protect private prayer requests. | Restrict private requests to their owner and the authorized prayer team. Verify with an anonymous client and another member account. |
| High | Storage buckets are public; anonymous upload/delete policies are broad. | Gallery/member images are publicly readable and media can be changed outside UI controls. | Decide which media is public. Use private buckets and signed URLs where appropriate; enforce ownership and role checks on uploads/deletes. |
| Medium | Security advisors flagged 22 functions with mutable search_path and 18 public SECURITY DEFINER functions. | Definer routines require review for privilege escalation and object resolution. | Set a trusted search_path, qualify objects and audit EXECUTE grants and authorization for every privileged routine. |

RLS being enabled is insufficient when permissive policies grant broad access. Hiding controls in React does not secure the database. The application currently uses custom session RPCs; adding auth.uid() policies without migrating those sessions would break legitimate flows. Prepare and test a coordinated backend authentication/policy migration in a staging project before deploying it.

References: [Function search paths](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable), [anonymous SECURITY DEFINER execution](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable).

## Checks and remaining validation

Passed: TypeScript app check; Tailwind CSS compilation; mocked tests executing actual feed/gallery upload handlers for upload failure, database failure, cleanup, success reset and finally unlocking; media size/type/empty-file and GIF-preservation checks; pagination rendering for zero results, final partial page and out-of-range clamping.

Not verified: production Vite bundle (supplied Windows dependencies lack @rollup/rollup-linux-x64-gnu in this Linux environment); browser/mobile rendering; live posting, gallery upload, recovery and admin-account flows. Run a clean npm ci on the deployment platform, npm run build and desktop/mobile checks before release. Image decoding/resizing requires a browser and was not visually tested here.

Gallery/admin pagination currently paginates already-loaded records; it improves display but does not remove the existing server response cap. Server-side pagination of these lists remains a follow-up. Offset feed pagination can shift when posts are inserted during browsing; duplicate IDs are removed, and refresh reloads the latest page.

Before production release, confirm anonymous callers cannot read session/auth data, change passwords, create admins, modify member data, read private prayers, or upload/delete others' files. Confirm each authorized member/admin/prayer role still works. These are pending backend acceptance checks, not tests that this frontend package has passed.
