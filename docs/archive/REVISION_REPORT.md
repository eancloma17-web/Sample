# TSAD SIS — Second revision: confirmed prompts 1–3

## Applied
- Preserved React/Vite/TypeScript/Supabase architecture and existing role workspace filenames.
- Removed browser-localStorage authentication and supplier cache; no bundled supplier fixture is loaded.
- Deleted unused sample supplier fixture and unused AdminPortal component.
- Removed fake client-side registration callback that fabricated a supplier session.
- Supplier portal rejects staff logins; missing profiles force Supabase sign-out.
- Disabled frontend final approval transitions and removed active final-approval RPC calls.
- Removed misleading Department Head final approval descriptions and hardcoded fictitious verifier attribution.
- Added migration `20261020000004_harden_permissions.sql` to restrict profile edits, direct staff application writes, and new final-approval transitions.

## Not completed / critical blockers
- Internal SIS_2627 gate is NOT implemented securely: a Vite-only frontend cannot protect a server-side secret. Requires a trusted backend/Edge Function and a server-validated short-lived gate. Do not place the code in VITE_ variables.
- End-to-end verification and role-by-role testing require an actual configured Supabase project and authorized test accounts.
- Legacy schema and screens retain historical APPROVED_MASTERLIST display fields for old data; no new final approval is authorized.
- Department Head recommendation persistence needs dedicated secure RPC and verified audit records; do not treat UI comments as a verified workflow.
- Existing service functions return `{success:false}` in some failure cases; the frontend may optimistically display changes until reloaded. Complete transactional error handling before production.
- SQL migrations have NOT been executed on the user's database. Review SQL with a backup/staging environment first.
- Do not run `COMPLETE_SETUP.sql` on top of numbered migrations without auditing duplicates.
- Production deployment and live authentication/storage tests have NOT been performed.

## Third inspection revision
- Fixed false-success staff password recovery button to call Supabase recovery API.
- Updated shared personnel login wording (not TSAD-only).
- Replaced outdated staff provisioning guide and old project URLs with confirmed identities and security steps.
- Added `FEATURE_VERIFICATION_CHECKLIST.md` with explicit source vs live test results.
- Unresolved gate/recommendation/security work remains; not a production release.
