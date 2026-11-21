# TSAD SIS — Evidence-based audit remediation

**Source:** `TSAD_SIS_functional_completion_candidate.zip`. **Output:** patched development ZIP. Original ZIP preserved.

## Changes actually applied

- **C01:** `documentStorageService.ts` now denies MIS/administrative staff confidential document previews and removes mutable email-address fallback for supplier ownership. SQL migration `20261020000006_audit_security_remediation.sql` replaces the broad document-row and Storage SELECT policies with TSAD-verifier/Department-Head-only policies. Suppliers retain their own-document policy. **Not verified on Supabase.** Other legacy policies/functions still need a complete role-permission audit.
- **C02:** `OfficialDocumentView.tsx` no longer invents the Department Head's name in the approver field, and no longer calls their review final approval. Historical `approvedBy` fields are visibly marked as unverified historical attribution. **A genuine persisted recommendation is not yet rendered in this document.**
- **H01/H02/H05:** `authService.ts` no longer silently ignores application/profile/document setup failures or generates a four-digit/year-fixed reference. New authenticated `ensure_supplier_registration()` RPC in migration 00006 creates an application and links the profile in one transaction, idempotently; sign-in retries after email confirmation. This intentionally does not seed an unapproved document checklist. **Requires deployed migration and live testing.**
- **H03/H07:** Initial migration no longer gives blanket ALL/default privileges to `anon` and `authenticated`; the storage policy exception now raises an error instead of silently succeeding. Follow-up migration revokes anonymous table and sequence privileges. **Privilege audit of all existing functions remains necessary.**
- **H04:** `App.tsx` now checks service success results before updating local supplier state and reloads from Supabase after caught errors. **Other components may still contain optimistic UI updates.**
- **H06:** Client-side ownership no longer accepts matching company email alone. Database RLS remains the final authority.

## Unresolved findings — NOT claimed fixed

- **M01:** Official mandatory document checklist and exact role permissions must be approved against the original forms. The new RPC does not fabricate mandatory rows; submission may be blocked or overly permissive until confirmed requirements are seeded.
- **M02:** Staff access-code rate limiting is still keyed by submitted email and can enable targeted lockouts. Needs stronger gateway/IP protection and abuse review.
- **M03:** Complete password-reset confirmation flow not verified.
- **M04:** Legacy demo components/status labels may remain; no deletion without reachability/usage verification.
- **M05:** Department Head recommendation RPC and printed output require real database/role testing.
- **M06:** `tsc --noEmit` cannot run because `vite/client` type definitions are absent in this environment. No build, live SQL execution, deployed Edge Function, or E2E tests performed.

## New SQL entity justification

No new business table was added. The migration adds one idempotent **security-definer registration function** using the existing `profiles` and `supplier_applications` tables. This is needed because the previous browser-side profile update conflicts with restricted UPDATE grants and email verification can delay an authenticated session. The reference identifier uses a year plus 12 random UUID hexadecimal characters and remains protected by the existing UNIQUE constraint.

## Required release gates

- [ ] Run SQL migrations 00001–00006 in order on a disposable staging Supabase project; verify every migration and RLS policy.
- [ ] Confirm supplier account registration both with email confirmation ON and OFF, repeated logins, and recovery from partial failures.
- [ ] Confirm exact mandatory document checklist and official printable document semantics with CPMD/TSAD.
- [ ] Test cross-supplier, TSAD, Department Head, MIS direct Storage API calls and signed URL requests.
- [ ] Test all four roles' login, role routing, password recovery, and restricted status transitions.
- [ ] Test Department Head recommendations and audit records, and prove no final approval is possible.
- [ ] Install dependencies, run `npm run lint`, `npm run build`, and browser E2E tests.
- [ ] Review legacy SQL grants/functions, document validation, MIS powers, and demo code.

**Verdict:** The identified issues were partially remediated in source, but the project is **NOT certified fully functional or deployment-ready**. Do not replace production database or claim final capstone acceptance based on this ZIP alone.
