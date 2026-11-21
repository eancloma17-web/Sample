# Transfer to new GitHub, Codespaces and Supabase accounts

An hour is a target for a fresh demo setup, not a guarantee of production acceptance. Account verification and migration errors may take longer. Existing users, uploaded files and records are not included in a source ZIP.

## 1. GitHub and Codespaces (about 10 minutes)

Create a private repository in your new GitHub account. Extract the cleaned ZIP on your computer, then upload its **contents**, including `.devcontainer`, `.gitignore` and `.env.example`, to the repository root. Do not upload the ZIP itself as source. Verify `package.json` is at the root. Create a Codespace from the repository's Code menu.

```bash
npm ci
npm run setup
```

## 2. New Supabase project (about 15 minutes)

Create the project in your new account and retain its database password privately. In Codespaces, initialize the CLI configuration if absent, authenticate and link:

```bash
npx supabase init
npx supabase login
npx supabase link --project-ref YOUR_NEW_PROJECT_REF
npx supabase db push --dry-run
npx supabase db push
```

Run this against a new empty project. Inspect the dry run: all 13 numbered migrations should be listed. Stop on any failure rather than running older setup SQL. These migrations create schema, reference data and storage policies; they do not copy your previous project's users or files.

In Supabase's Edge Function Secrets screen, set `STAFF_ACCESS_CODE` to the agreed private office code. Then deploy the unauthenticated login endpoint:

```bash
npx supabase functions deploy staff-login --no-verify-jwt
```

Only this login endpoint has JWT verification disabled; its code validates the access code and account. Supabase supplies its own runtime keys. Never copy service-role keys into `.env.local`.

## 3. Connect and open the app (about 10 minutes)

Edit `.env.local` in the Codespaces editor:

```dotenv
VITE_SUPABASE_URL=https://YOUR_NEW_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_NEW_PUBLISHABLE_KEY
```

```bash
npm run check
npm run dev
```

Open port 3000 in the Ports panel. Restart the dev command after changing environment values. Configure the preview origin in Supabase Auth URL Configuration for email confirmation links. The existing password-recovery flow still needs end-to-end validation before relying on it for account onboarding.

## 4. Accounts and acceptance (about 25 minutes)

Register a supplier, confirm the email if enabled, and sign in. Check that the dashboard and saved application appear without refreshing. Create staff accounts using `supabase/admin_provisioning.md`.

Verify supplier save persists after logout/login; upload and reopen a real PDF; submit for TSAD verification; record a Department Head recommendation; check administrative access; confirm Supplier A cannot access Supplier B's records and the Department Head cannot finally approve. A successful build does not establish these database permissions.

Commit source changes through Codespaces Source Control. Confirm `.env.local` is ignored before committing. Keep the port private unless deliberately sharing a demo. Codespaces preview is not permanent client hosting.

Official references:
- https://docs.github.com/en/codespaces/developing-in-a-codespace/forwarding-ports-in-your-codespace
- https://supabase.com/docs/reference/cli/introduction
- https://supabase.com/docs/guides/functions/deploy
- https://supabase.com/docs/guides/functions/secrets
