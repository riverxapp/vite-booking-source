# FILES.md

Structural index for the helpdesk template.

## Entry points

- `index.html`: Vite HTML entry (loads fonts and `/src/main.tsx`). Required by Vite.
- `src/main.tsx`: React mount.
- `src/app/App.tsx`: providers (theme, auth, branding, toasts) + router.
- `src/app/routes.tsx`: every route. `/`, `/login`, `/signup`, `/agent/signup`, `/forgot-password`, `/reset-password` are public; `/app/*` is for admins and agents, `/portal/*` (dashboard, tickets, settings) for customers (both lazy-loaded).
- `src/app/DatabaseGate.tsx`: shows setup instructions when no database is configured (dev only in practice: production builds fall back to `/api/db`).

## Source areas

| Area | Path | Responsibility |
|---|---|---|
| Helpdesk config | `src/config/helpdesk.ts` | Statuses, priorities, roles, locale, page size: the file to edit to adapt the vocabulary |
| Database | `src/db/` | `schema.ts` (all tables), `client.ts` (Drizzle over the Data API), `helpers.ts` (search, paging types) |
| Features | `src/features/<area>/` | `tickets` (agent queries, `Thread`, `ReplyBox`, the shared `ThreadMessage` type), `customers`, `users` (agents), `portal` (customer API client, dashboard stats, default intro), `branding` (company name, logo, portal intro context), `settings` (shared profile form, URL validation), `auth` (session context, route guard) |
| Pages | `src/pages/` | Route-level views: landing, auth, forgot/reset password, tickets (Inbox + All), ticket detail, customers, customer detail, settings, portal (dashboard, tickets, new ticket, ticket, settings), 404 |
| App shells | `src/components/layout/` | `SidebarShell` shared by the agent (`AppLayout`) and customer (`PortalLayout`) shells, nav items, brand mark, theme toggle |
| Public site | `src/components/site/` | Site header, footer, auth card, landing product preview |
| Shared pieces | `src/components/common/` | Page header, avatar, badges, option select, search, pager, form field, settings card, empty/error states |
| Charts | `src/components/charts/` | `ColumnChart` (single series, tooltips, hidden table), `BarList` (labelled horizontal bars), `scale.ts` (clean ticks) |
| UI primitives | `src/components/ui/` | The shadcn components in use, restyled to `DESIGN.md`: button, card, input, label, select, sheet, skeleton, spinner, table, textarea, toaster |
| Icons | `src/components/icons.ts` | The 31 icons the app uses, inlined from Lucide (ISC). Add new ones here |
| Hooks | `src/hooks/` | `use-form` (form state + validation), `use-async`, `use-mutation`, `use-list-params` (URL state), `use-debounced-value` |
| Libs | `src/lib/` | `env.ts` (only place browser env is read; picks the Data API URL), `api.ts` (HTTP), `format.ts` (`Intl` dates, ticket numbers, initials), `toast.ts` (toast store), `utils.ts` |
| Styles | `src/styles/globals.css` | Design tokens (light/dark) + `rx-*` helper classes |

## Server

Server code lives in `server/`; `api/` holds thin Vercel function wrappers and `scripts/local-*.ts` the Vite dev equivalents. Relative imports in `api/` and `server/` end in `.js` (they run as native ES modules on Vercel).

| Path | Responsibility |
|---|---|
| `server/auth.ts` | Auth API: signup, agent signup, login, logout, me, forgot/reset password, profile. Roles, scrypt hashes, DB-backed sessions |
| `server/portal.ts` | Customer portal API: branding (incl. portal intro), my tickets, one ticket without internal notes, create ticket, reply |
| `server/db.ts` | Data API handler and SQL guard, shared by the local proxy and `/api/db` |
| `server/http.ts` | JSON body, response, cookie and routing helpers shared by the handlers |
| `server/env.ts` | Reads the server-only settings (`TURSO_*`, `AGENT_SIGNUP_CODE`, `APP_URL`) |
| `api/auth/[action].ts` | Vercel function wrapping `server/auth.ts` |
| `api/portal/[action].ts` | Vercel function wrapping `server/portal.ts` |
| `api/db/[action].ts` | Vercel function serving the Data API at `/api/db/*`, admin/agent sessions only |
| `scripts/local-api.ts` | Serves `/api/auth/*` and `/api/portal/*` from the Vite dev/preview server |
| `scripts/local-db-proxy.ts` | Dev-only stand-in for the RiverX Data API (`/__local-db/v1`), key- and session-checked, wrapping `server/db.ts` |

## Root config

`package.json` (includes `pnpm.overrides` that keep a single `esbuild`), `vite.config.ts` (SWC React plugin + local DB proxy + local API), `tsconfig.json`, `tailwind.config.js`, `postcss.config.js` (Tailwind only), `components.json`, `drizzle.config.ts`, `vercel.json`, `.env.example` (every variable, empty), `.gitignore`.

## Other scripts

- `scripts/dev-supervisor.js`, `scripts/git-poll.js`, `scripts/verify-dev-runtime.js`: RiverX runtime helpers.
- `scripts/error-reporter.ts`: browser error forwarding helper.
- `scripts/db-init.js`: Postgres migration helper (not used for Turso).

## Docs

`README.md` (overview), `RULES.md` (placement rules), `DATABASE.md` (data rules), `DESIGN.md` (visual system).
