# TSAD SIS implementation and deployment notes

## Added entities and justification
- `staff_login_rate_limits`: one new table, necessary for server-enforced per-email login attempt limits. Only service_role can execute the rate-limit RPC.
- `record_department_head_recommendation`: new protected RPC, **not** a new table. Reuses `decision_records` and `audit_events` to avoid duplicate entities. Only active CPMD_HEAD can recommend on VERIFIED applications. Does not change supplier status.
- `staff-login` Edge Function: trusted server component required because a public React app cannot protect the internal access code. Uses Supabase Auth and checks profile roles.
- MIS service functions: use existing `access_assistance_tickets`, `system_settings`, `audit_events`, `profiles` tables. No invented MIS database entity.

## Required setup
1. Configure `.env` locally with only the public Vite Supabase URL and publishable key. Never commit `.env`.
2. Apply numbered migrations 00001, 00002, 00003, 00004, 00005 **in order** only if not already applied. Compare against migration history; use staging and backup. The old COMPLETE_SETUP is disabled and must not be applied alongside migrations.
3. Set Edge Function secret `STAFF_ACCESS_CODE` in Supabase. Deploy `staff-login` without JWT verification for that endpoint only.
4. Provision internal accounts through Supabase Auth; assign roles in `public.profiles` through trusted administrator operations. Never put passwords in GitHub.
5. Configure Auth redirect URLs, SMTP/email, private Storage, and RLS; test all four roles with isolated fixtures.
6. Run `npm install`, `npm run lint`, `npm run build`, and perform role-specific end-to-end tests.

## Outstanding limitations
- No access to live Supabase or authenticated test accounts, so migration, security, and E2E tests are **not** verified.
- The current project contains legacy workflow text, statuses, and some UI behaviors. Audit each before production use.
- Internal access code per-email throttling can be abused for lockouts; use an IP-based WAF/rate limiter and monitoring for production.
- MIS operational privileges need explicit sign-off. Current RLS may grant more access than intended; do not deploy without security review.
- Never represent a recommendation as final approval, accreditation, or procurement eligibility.
