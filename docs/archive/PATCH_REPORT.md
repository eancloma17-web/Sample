# TSAD code revision — first verified pass

Changes applied:
- Removed user-facing numeric role labels where safely identifiable. Internal component filenames and role keys are unchanged to avoid breaking imports and database policies.
- Removed the Department Head final-approval action from its workspace.
- Added an additive SQL migration to disable the legacy final-approval RPC. **This migration must be executed in Supabase; editing a ZIP does not change the live database.**
- Authentication now fails closed if the authenticated user has no trusted database profile.
- Disabled optional demonstration seed script in the release archive.
- Corrected package name.

**Not yet verified:** production build, complete role permission audit, migration execution on your Supabase project, server-side internal access-code gate, all functional flows, or production deployment. The old SQL initial schema still includes historical approval logic; the new migration overrides the approval RPC but additional direct-write and legacy policy risks require audit. Some screens still show historical approval statuses, and recommendation persistence requires review.

Do not deploy as production-ready without completing these checks.
