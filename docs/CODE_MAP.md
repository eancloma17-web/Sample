# Code navigation

| File or folder | Purpose |
| --- | --- |
| `src/main.tsx` | Mounts the React application |
| `src/App.tsx` | Restores authentication, loads records after account changes and selects the workspace |
| `src/components/AuthView.tsx` | Supplier login and registration |
| `src/components/StaffAuthView.tsx` | Staff access-code and account login |
| `src/components/Role1*` | Supplier dashboard, information sheet, documents and account screens |
| `src/components/Role2StaffWorkspace.tsx` | TSAD verification interface |
| `src/components/Role3DeptHeadWorkspace.tsx` | Department Head reviews and recommendations |
| `src/components/Role4AdminStaffWorkspace.tsx` | Administrative interface |
| `src/services/authService.ts` | Supabase sign-in, registration and profile mapping |
| `src/services/supplierService.ts` | Database reads, application updates and workflow RPC calls |
| `src/services/documentStorageService.ts` | Private uploads and signed document URLs |
| `src/lib/supabase.ts` | Reads browser-safe environment configuration and creates the shared client |
| `supabase/migrations/` | Ordered database schema and security changes; apply all 13 |
| `supabase/functions/staff-login/index.ts` | Server-side staff access-code check and login rate limit |
| `docs/archive/` | Previous review reports; historical claims are not current validation |

## Explaining supplier login

`AuthView.handleSignIn` calls `authService.signIn`. Supabase validates credentials; the service checks the trusted profile and completes missing supplier registration. The callback selects the dashboard. An account-dependent effect in App loads the supplier record without a manual refresh. The auth listener schedules profile requests outside the auth event callback.

## Existing role identifiers

| Workspace | Current database identifier |
| --- | --- |
| Supplier | `SUPPLIER` |
| TSAD Staff | `TSAD_STAFF` (legacy alias: `CPMD_VERIFIER`) |
| Department Head | `CPMD_HEAD` |
| Administrative Staff | `ADMIN_STAFF` (legacy alias: `MIS_OFFICER`) |

Aliases are retained for database compatibility. They are not an instruction to create extra accounts. Department Head recommendations do not grant final approval. Frontend routing is presentation; database RLS and RPC validation enforce permissions.
