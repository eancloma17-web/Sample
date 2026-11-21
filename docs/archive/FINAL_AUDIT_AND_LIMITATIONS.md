# TSAD Supplier Information System — Source Remediation and Acceptance Audit

**Scope:** Existing `TSAD_SIS_OFFICIAL_LOGOS_ONLY.zip`, reviewed and revised without replacing its React/Vite architecture or changing its official image assets.

**Mayor reference:** Atty. Lawrence Lemuel H. Fortun. The former mayor's name has been removed from the fabricated permit generator; that entire generator was removed. A constant records the updated name for future authorized administrative use. The application must never fabricate a signed Mayor's Permit using this name.

## Source changes made

1. `src/services/documentStorageService.ts`: removed `getDocumentPages`'s synthetic permit, certificate, tax/fee, receipt, clearance, signature, QR and barcode data. It now returns only pages explicitly supplied with a record. Retained genuine private Supabase Storage upload and signed URL functions.
2. `src/components/SecureDocumentViewerModal.tsx`: disabled generated document display, HTML download, and synthetic printing. View, download and print require an uploaded file or genuine temporary file URL. Corrected PDF preview handling and removed misleading certification labels. Printing opens the actual file in a new tab for the user's print dialog; automatic per-page printing is not supported.
3. `src/components/SupplierPortal.tsx`: replaced filename-only attachment simulation with an actual file picker, private storage upload, error handling and database refresh; corrected stated size limit to 10 MB. **Note:** This legacy component is not currently mounted in `App.tsx`; the active supplier document desk is `Role1DocSubmissionView.tsx`.
4. `src/components/Role1DocSubmissionView.tsx`: removed local-only successful attachment fallback; requires an actual file and successful private storage write, then reloads persisted supplier data.
5. `src/App.tsx`: supplier update handler now returns a persistence result to callers and rejects non-UUID application IDs; added database refresh callback for upload and recommendation workflows.
6. `src/components/Role1SiSheetView.tsx`: save confirmation is shown only after the persistence callback returns success.
7. `src/components/Role3DeptHeadWorkspace.tsx`: removed fabricated history records and unreachable unauthorized direct-revision code; recommendations are written by the existing Supabase RPC then reloaded from the database. The Department Head remains review/recommendation only.

## Verified in this review

- Archive source extraction and comparison against the previous ZIP.
- Exactly three official image assets retained unchanged: `butuan-background.png`, `butuan-city-seal.png`, `procurement-logo.png`.
- All TypeScript and TSX source files and Edge Function source pass TypeScript **syntax parsing** (zero parser diagnostics). This is **not** a complete typecheck or runtime test.
- Legacy mayor name is absent from the updated source.
- Fabricated government-document generator is removed; synthetic HTML document export function is removed.
- No SQL migrations or RLS policies were modified in this revision.

## Not verified / deployment blockers

- **Full TypeScript typecheck and Vite production build:** blocked because project dependencies are unavailable in this environment; `tsc --noEmit` reports missing `vite/client` types. An attempted dependency installation timed out. No passing build is claimed.
- **Supabase SQL:** six numbered migrations are included but not executed against a staging or live Supabase project. The initial migration contains historical final-approval schema/function code which later migrations restrict/disable; this migration chain must be tested end-to-end before deployment.
- **Security:** RLS, storage policies, staff-login Edge Function, and privilege restrictions require real authenticated four-role tests. A static inspection cannot certify production security.
- **Role-specific workflows:** Supplier registration, TSAD verification, Department Head recommendations, MIS operations, password reset, document download/print and data synchronization require end-to-end tests with actual authorized accounts.
- **Approval authority:** final approval remains unspecified. The Department Head is not a final approver. Legacy `APPROVED_MASTERLIST` fields remain for historical compatibility and require careful data governance; do not treat them as authority for new approvals.
- **Official document checklist and MIS permissions:** must be reconciled with the formally approved role documents and office policy before production.
- **Other UI success messages:** some components beyond the corrected Supplier Information Sheet may still report success without awaiting backend confirmation; a complete runtime acceptance suite remains necessary.

## Acceptance decision

**Corrected source candidate — NOT production certified.** This archive is the strongest version generated in this review, but it would be inaccurate to call it fully functional without successful dependency installation, typecheck, build, migration application and live role-based end-to-end testing. Keep the previous ZIP as a backup and use a separate Supabase staging project first.
