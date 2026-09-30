# RiverX Helpdesk

RiverX Helpdesk is a minimal support-desk template: customers open tickets from a portal, agents answer them from a shared inbox, and internal notes stay with the team. Vite 6 + React + TypeScript + Tailwind + a trimmed set of shadcn/ui primitives, backed by **Turso** (libSQL) through Drizzle ORM.

It is built to run cheaply in dev mode inside shared workspaces: 12 runtime dependencies, one `esbuild`, SWC instead of Babel, and small in-repo replacements for the usual icon, date, form and toast libraries (see [Dependency budget](#dependency-budget)).

## Quick start

```bash
pnpm install
cp .env.example .env        # then fill TURSO_DATABASE_URL and TURSO_AUTH_TOKEN
pnpm db:push                # create tables in Turso
pnpm dev                    # http://localhost:5173
```

1. Open `/agent/signup` and create the first agent account: it becomes the **admin**. Set your company name, logo and portal welcome message in Settings.
2. Set `AGENT_SIGNUP_CODE` on the server and share it so teammates can join as agents at `/agent/signup`.
3. Customers sign up at `/signup` (or via "Submit a ticket" on `/`) and land in the portal at `/portal`.

## Make it yours

- **Branding**: company name and logo in Settings → Helpdesk (admins). They show on the portal, the login pages, the sidebar and the tab title.
- **Welcome message**: the portal introduction in Settings → Helpdesk is shown at the top of every customer's dashboard (plain text, line breaks kept). Empty uses the default in `src/features/portal/intro.ts`.
- **Vocabulary**: statuses, priorities and their labels and colours live in **`src/config/helpdesk.ts`**. Stored values are the option `value` keys: renaming a label is safe; changing a `value` orphans rows that use the old key (and `server/portal.ts` writes `open` itself).
- **Email**: plug your provider into `deliverResetLink` in `server/auth.ts` for password reset emails.

## Features

| Area | What you get |
|---|---|
| Inbox | Open and pending tickets that are yours or unassigned |
| All tickets | Every ticket, searchable (subject, number, customer) and filterable by status, priority and assignee, paginated |
| Ticket detail | Header with status, priority and assignee controls; an email-style thread; "Send reply" and "Add internal note". Internal notes look different and never reach the portal |
| Customers | List with ticket count and last activity; profile with every ticket |
| Customer portal | Same sidebar layout as the agent dashboard. Dashboard with your intro message, ticket stats and two charts (opened per month, by status); Tickets (search, status filter, conversation with reply, new ticket); Settings (profile). A customer reply reopens a pending or resolved ticket |
| Ticket states | `open` → `pending` → `resolved`, moved by agents. Priorities `low`, `normal`, `high`. Numbers start at #1001 |
| Settings | Profile (name, email, avatar URL) for agents and customers; helpdesk company name, logo and portal intro message for admins |
| Auth | One login with roles (admin, agent, customer): signup, agent signup with invite code, login, logout, password reset. Server-side sessions in httpOnly cookies |
| UI | Light and dark themes, responsive down to phone width, design system in `DESIGN.md` |

## Data model

| Table | Holds |
|---|---|
| `customers` | People who open tickets: name, email, avatar, linked to their portal login |
| `tickets` | Number, subject, customer, status, priority, assignee, timestamps |
| `messages` | Replies and internal notes (`is_internal`), sent by a customer or an agent |
| `users` | Admins and agents: name, email, avatar, role |
| `helpdesk_settings` | One row: company name, logo and portal intro message |
| `auth_*` | Logins, sessions and reset tokens. Server-only |

## Commands

| Command | Does |
|---|---|
| `pnpm dev` | Dev server with the local DB proxy and the auth and portal APIs |
| `pnpm build` / `pnpm preview` | Production build / serve it. `preview` serves `/api/auth` and `/api/portal` but not `/api/db`, so the agent dashboard needs `pnpm dev` or a Vercel deploy |
| `pnpm typecheck` | TypeScript check |
| `pnpm db:push` | Apply `src/db/schema.ts` to Turso |
| `pnpm db:studio` | Browse the database with Drizzle Studio |
| `pnpm verify:dev-runtime` | Check the dev-server defaults (host, port, strict port) |

## Environment

| Variable | Where | Purpose |
|---|---|---|
| `VITE_APP_NAME` | browser | Fallback name until an admin sets the company name in Settings (default `RiverX Helpdesk`) |
| `VITE_API_BASE_URL` | browser | Base for `src/lib/api.ts` (default `/api`) |
| `VITE_RIVERX_DB_URL` / `VITE_RIVERX_DB_KEY` | browser | RiverX Data API. Injected by RiverX; leave empty locally and on your own Vercel project |
| `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` | **server only** | drizzle-kit, the local DB proxy, and the auth, portal and data API functions. Never prefix with `VITE_` |
| `AGENT_SIGNUP_CODE` | **server only** | Team invite code for agent signup. The first agent account (the admin) needs none; without this set, agent signup closes after it |
| `APP_URL` | **server only** | Public origin used in password reset links, e.g. `https://support.example.com`. Defaults to the request's origin; set it in production |

`.env` / `.env.*` are gitignored.

## How data flows

```
agent    ── Drizzle (sqlite-proxy) ──▶ Data API ──▶ Turso          helpdesk tables
customer ── /api/portal/* (cookie) ──▶ server/portal.ts ──▶ Turso  own tickets, no internal notes
anyone   ── /api/auth/* (cookie)   ──▶ server/auth.ts ──▶ Turso    auth_* tables
```

The browser code is the same everywhere; only the Data API behind it changes:

| Where | Data API | Authorised by |
|---|---|---|
| RiverX | RiverX's hosted endpoint, from `VITE_RIVERX_DB_URL` (see `DATABASE.md`) | Publishable key `VITE_RIVERX_DB_KEY` |
| `pnpm dev`, no RiverX | `/__local-db/v1`, served by `scripts/local-db-proxy.ts` when `TURSO_*` are set | Random per-process key + admin or agent session |
| Production build, no RiverX (e.g. Vercel) | `/api/db/*`, served by `api/db/[action].ts` | Admin or agent session cookie |

- The local proxy and `/api/db` share `server/db.ts`: the same contract and SQL guard (no DDL, one statement per query, no SQL touching `auth_*` tables). The Turso token stays on the server.
- **Auth and the portal** run only on the server: Vite middleware in dev (`scripts/local-api.ts`) and Vercel functions in production (`api/auth/[action].ts`, `api/portal/[action].ts`). They share `server/auth.ts` and `server/portal.ts`.

## Deploying

The build is a static SPA plus three serverless functions (`/api/auth/*`, `/api/portal/*`, `/api/db/*`). `vercel.json` rewrites client routes to `index.html`.

1. In Vercel → Project → Settings → Environment Variables, set `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `APP_URL` and (to let teammates join) `AGENT_SIGNUP_CODE`, all server-only with no `VITE_` prefix, for each environment you deploy.
2. Run `pnpm db:push` against that database once so the tables exist.
3. Leave `VITE_RIVERX_DB_*` unset: agent data then goes through `/api/db`. Under RiverX, its injected `VITE_RIVERX_DB_*` take precedence.
4. Redeploy after changing env vars. `VITE_*` values are inlined at build time.

`package.json` sets `"type": "module"`, so Vercel runs the functions as native ES modules. Relative imports in `api/` and `server/` must end in `.js` (`from "../../server/auth.js"`); without it the function fails to load with `FUNCTION_INVOCATION_FAILED`.

| Symptom on Vercel | Cause / fix |
|---|---|
| `FUNCTION_INVOCATION_FAILED` | Usually a relative import without `.js` in `api/` or `server/`. Check the function logs for `ERR_MODULE_NOT_FOUND` |
| Auth returns 503 "Auth is not configured" | `TURSO_*` missing from that environment's variables |
| "Connect a database to get started" | The deployed build predates `/api/db`. Redeploy from the current `main` |
| Data requests return 401 "Log in to continue." | No valid session cookie. Log in again |
| Data requests return 403 "Only agents can use the Data API." | A customer account opened the agent dashboard. Customers belong in `/portal` |
| Errors like `no such table` | Run `pnpm db:push` against the production database |

## Security notes

- **Internal notes and other customers' tickets are protected only on our own Data API** (the local proxy and `/api/db`), which accept admin and agent sessions only. Customers use `/api/portal/*`, which returns only their own tickets and never internal notes.
- **Under RiverX's hosted Data API, that protection is gone.** Its key ships in the browser bundle, so anyone with the app URL, customers included, can read every table, internal notes included. Don't run a real helpdesk on it.
- Every agent can read and write all helpdesk data. "Admin only" (helpdesk branding and the portal intro) is enforced in the UI.
- Password reset links are only logged on the server (and shown on the page in dev) until you connect an email provider in `deliverResetLink` in `server/auth.ts`.
- Under RiverX's hosted Data API, the `auth_*` tables are readable with the public key. Passwords are scrypt-hashed and only token hashes are stored, but for real deployments keep auth in a database the public key cannot reach.

## Dependency budget

Dev mode is what runs in the workspaces, so every package has to earn its place. "Now" was measured on 2026-09-30, after the helpdesk conversion, with a fresh dev server and the browser cache disabled:

| | Before trimming | Now |
|---|---|---|
| `node_modules` | 324 MB, 305 packages | 129 MB, 179 packages |
| Runtime dependencies | 49 | 12 |
| Landing page, dev | 84 requests, 4.3 MB | 84 requests, 2.5 MB |
| Agent inbox, dev | 117 requests, 5.8 MB (CRM dashboard) | 105 requests, 2.8 MB |
| Customer portal dashboard, dev | — | 96 requests, 2.6 MB |
| Dev server memory, idle | 157 MB | 101 MB |
| Production JS (main chunk) | 509 KB | 392 KB |

What replaced what:

| Instead of | Use | Why |
|---|---|---|
| `lucide-react` | `src/components/icons.ts` | Dev mode pre-bundled all 1,947 icons (1.4 MB per page load, 38 MB on disk) for the 31 we use |
| `date-fns` | `Intl` helpers in `src/lib/format.ts` | A handful of date functions; 53 MB on disk with its jalali copy |
| `react-hook-form` (+ `zod`, resolvers) | `src/hooks/use-form.ts` | Same API subset (`register`, `Controller`, `handleSubmit`, `reset`, `watch`) in under 100 lines |
| `sonner` | `src/lib/toast.ts` + `ui/toaster.tsx` | `toast.success` / `toast.error` only |
| `recharts` | `src/components/charts/` (`ColumnChart`, `BarList`) | recharts was 1.26 MB in dev |
| `@radix-ui/react-label` | native `<label>` | No behaviour needed |
| `@vitejs/plugin-react` (Babel) | `@vitejs/plugin-react-swc` | ~40% less idle memory, less CPU per transform, drops Babel + browserslist data |
| `autoprefixer` | — | Target browsers need no prefixes; it ran on every CSS change |
| 37 unused shadcn components | deleted | They were the only users of 26 packages |

Kept on purpose: `react`, `react-dom`, `react-router-dom`, `drizzle-orm`, `@libsql/client` (server only), `tailwind-merge` (class overrides depend on it), `class-variance-authority`, `clsx`, `next-themes` (3 KB, no-flash theme), and the Radix primitives that provide the accessible sheet (dialog), select and slot. The helpdesk conversion also dropped `cmdk` and the alert-dialog, checkbox, dropdown-menu, popover and tabs primitives, which only the CRM used.

`package.json` pins `drizzle-kit`'s internal `esbuild` copies (`pnpm.overrides`) to the version Vite uses, so only one `esbuild` binary is installed. Before adding a dependency, check `RULES.md`.

## Project structure

See `FILES.md`. Placement rules are in `RULES.md`; database rules are in `DATABASE.md`; visual rules are in `DESIGN.md`.
