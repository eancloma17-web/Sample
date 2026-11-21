# Cleanup review — 16 November 2026

## Fixes

- Supplier records now load when the authenticated account changes, rather than only when the app mounts. Supplier login selects the dashboard and its menu becomes available after the record loads.
- The auth event listener stays synchronous; profile requests are deferred outside the auth callback. Pending listener refreshes are cancelled on cleanup and stale responses are ignored after sign-out.
- Logout clears cached supplier records.
- Vite configuration uses an ESM-safe path instead of __dirname.

## Removed

- Unmounted `src/components/SupplierPortal.tsx`: no imports referenced this duplicate legacy portal; active Role1 screens remain.
- `Role2StaffWorkspace.tsx.bak` duplicate backup.
- `bun.lock`: npm and package-lock.json are the supported installation path.
- Disabled legacy full-setup SQL and optional demo seed SQL. All 13 numbered migrations remain byte-for-byte unchanged.
- Unused packages: @google/genai, dotenv, express, motion, @types/express, tsx. Installation dropped from 188 to 69 packages in this environment.
- Obsolete named personnel instructions: replaced with account-independent staff provisioning.

Historical audit reports moved into docs/archive. They are reference history, not current acceptance evidence. Added source boundary comments, a code map, environment template, Codespaces configuration and transfer guide. No official images or database permission rules were changed. Existing legacy role aliases remain compatible with the schema.

## Verification

- Clean npm ci: PASS.
- TypeScript typecheck: PASS.
- Login transition regression test: PASS. Executes App with mocked React hooks/backend, signs a supplier in, confirms a record fetch and menu rendering without restarting App, and checks logout clears the menu. This is not a browser or live database test.
- Vite production build: PASS. A large JavaScript chunk warning remains; splitting workspaces is a separate optimization.
- Browser end-to-end attempt: blocked by browser socket restrictions in this environment. No passing browser test is claimed.
- Live Supabase migrations, RLS, storage, real login and staff-login deployment: NOT RUN; new account/project access is required.

## Remaining checks

The password recovery redirect exists, but no dedicated PASSWORD_RECOVERY screen was found; validate and implement this separately before depending on recovery onboarding. The shared staff code does not replace database authorization. The Department Head remains recommendation-only. Final approval authority is not assigned by this cleanup. This package is a checked source candidate, not a production certification or a completed account migration.
