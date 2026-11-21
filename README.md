# TSAD Supplier Information System

React + TypeScript frontend with Supabase Auth, PostgreSQL, private Storage and a staff-login Edge Function. There is no separate Express server.

## Start in Codespaces

Use Node 22.12 or newer. The included dev container installs dependencies and forwards port 3000.

```bash
npm ci
npm run setup
```

Edit `.env.local` with your **new project's** URL and publishable key. Then:

```bash
npm run check
npm run dev
```

Open port 3000 from the Ports panel. Codespaces is a development/demo environment and must remain running for the preview to work.

See [Transfer guide](docs/TRANSFER_GUIDE.md), [Code navigation](docs/CODE_MAP.md), and [Cleanup review](docs/CLEANUP_REVIEW.md).

Do not commit `.env.local`, database passwords, access codes or service-role keys. Public Vite environment variables are embedded in the browser build.
