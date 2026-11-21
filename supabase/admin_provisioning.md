# Staff provisioning

Create real staff accounts in the new project's Authentication Users dashboard using verified email addresses. Do not reuse identities or temporary credentials from the old deployment.

After each account is created, use its Auth UUID in the SQL Editor:

```sql
-- Replace the UUID and select exactly one approved role for this person.
UPDATE public.profiles
SET role = 'TSAD_STAFF', is_active = true
WHERE id = 'REPLACE_WITH_AUTH_USER_UUID'::uuid;
```

Use `TSAD_STAFF`, `CPMD_HEAD`, or `ADMIN_STAFF` for the three staff workspaces. Verify the profile exists before updating. Never grant role changes through a browser client. Confirm each account's identity and scope with the office. The Department Head remains review/recommendation only; final approval is not enabled by this setup.
