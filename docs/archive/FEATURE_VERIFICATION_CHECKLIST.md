# Feature checklist — source implementation vs live verification

This checklist describes source-level implementation only. A check in the first column does **not** establish production readiness.

| Feature | Source | Live tested | Notes |
|---|---|---|---|
| Supplier login / registration | [x] | [ ] | Supabase Auth; email verification must be configured |
| Supplier Information Sheet / draft | [x] | [ ] | Real database service; test data validation |
| Supplier document upload / preview | [x] | [ ] | Test private storage policies and signed URLs |
| TSAD Staff verification | [x] | [ ] | Existing RPCs; test RLS and version checks |
| Department Head recommendation | [x] | [ ] | New secure RPC and audit event; only VERIFIED submissions |
| Department Head final approval blocked | [x] | [ ] | Disabled function, trigger and UI |
| Internal personnel access code | [x] | [ ] | New Supabase Edge Function; requires secret/deployment |
| Internal staff password recovery | [x] | [ ] | Email SMTP/redirect setup required |
| MIS assistance tickets | [x] | [ ] | Database-backed; no fake dispatch claim |
| MIS personnel registry | [x] | [ ] | Database-backed; no fabricated personnel |
| MIS audit ledger | [x] | [ ] | Database-backed; no fabricated audit events |
| MIS operational settings | [x] | [ ] | Service functions added; inspect UI success/error behavior |
| SQL migration execution | [ ] | [ ] | Requires staging Supabase access |
| TypeScript and production build | [ ] | [ ] | npm dependencies unavailable in current runtime |
| Live 4-role E2E tests | [ ] | [ ] | Requires authorized test accounts |
| Production hosting | [ ] | [ ] | Not performed |

**Not established:** final approval authority, exact MIS privilege boundaries, approved checklist/expiration rules. Do not infer these.
