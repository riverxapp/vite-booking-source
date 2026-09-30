# RULES.md

Change boundaries and placement rules for the helpdesk template.

## Product shape

- Vite + React SPA: public landing + auth pages, the agent dashboard under `/app`, and the customer portal under `/portal`.
- Agent data goes through Drizzle over the Data API (`src/db/client.ts`): RiverX's hosted one, the dev proxy, or `/api/db` in production. Our own Data API accepts admin and agent sessions only.
- Customer data goes only through `/api/portal/*` (`server/portal.ts`). Customers never get Data API access.
- Auth goes through the server API (`server/auth.ts`); the browser never touches `auth_*` tables.
- Statuses, priorities and roles live in `src/config/helpdesk.ts`, never hard-coded in pages.
- Keep V1 minimal: no organizations, teams, SLAs, automations, tags or custom fields unless asked.
- Dev-mode resource use is a product requirement: keep dependencies minimal (see Dependencies).

## Routing

1. Define routes in `src/app/routes.tsx`. Agent pages live under `/app`, customer pages under `/portal`; both are lazy-loaded.
2. Route-level views go in `src/pages` (portal pages are prefixed `Portal`); shell composition goes in `src/components/layout`. Both audiences share `SidebarShell`: add nav items in `nav.ts`, not a new layout.
3. Internal links use `/app/...` (agents) or `/portal/...` (customers) paths.
4. Gate each tree with `RequireAuth audience="staff" | "customer"`.

## Data

1. Tables live only in `src/db/schema.ts`; change them with `pnpm db:push` (no runtime DDL).
2. Agent queries live in `src/features/<area>/api.ts`; components call those functions, not `db` directly. The portal's `src/features/portal/api.ts` is an HTTP client for `/api/portal/*`, never Drizzle.
3. Anything a customer sees is queried in `server/portal.ts`, scoped to their `customers.id`, and never includes messages with `is_internal = 1`.
4. Use `db.batch([...])` for multi-step writes, never `db.transaction()`.
5. Paginate lists (`helpdeskConfig.pageSize`); the Data API caps results at 1,000 rows.
6. Never import `@libsql/client` or read `TURSO_*` from `src/`. They belong to `server/`, `scripts/`, `api/` and `drizzle.config.ts` only.
7. The SQL guard for our own Data API lives only in `server/db.ts`. Change it there so the dev proxy and `/api/db` stay identical.

## Components

1. Reusable primitives belong in `src/components/ui`; helpdesk building blocks in `src/components/common`; charts in `src/components/charts`; icons in `src/components/icons.ts`.
2. Use named exports. Keep components small.
3. Follow `DESIGN.md` for every visual decision.

## Dependencies

Dev mode runs in shared workspaces, so the dependency list is kept deliberately short (see "Dependency budget" in `README.md`).

1. Before adding a package, check whether a few lines in `src/lib` or `src/hooks` would do. Add one only when it brings real behaviour (accessibility, a protocol, a data layer), not convenience.
2. Do not reintroduce the libraries that were replaced: `lucide-react` (use `src/components/icons.ts`), `date-fns` (use `Intl` helpers in `src/lib/format.ts`), `react-hook-form` / `zod` (use `src/hooks/use-form.ts`), `sonner` (use `src/lib/toast.ts`), `recharts` (hand-build charts from divs, see `DESIGN.md`).
3. New icons: copy the SVG children from lucide.dev into a new `icon("name", [...])` line in `src/components/icons.ts`.
4. New shadcn components: add only the ones you use, restyle them to `DESIGN.md`, and remove the file and its dependency if they stop being used. The shadcn CLI installs `lucide-react` along with components: point their icon imports at `@/components/icons` and uninstall it.
5. Keep one `esbuild`: if you upgrade Vite or `drizzle-kit`, update `pnpm.overrides` in `package.json` so their versions still match, then check `ls node_modules/.pnpm | grep ^esbuild@`.
6. Keep `@vitejs/plugin-react-swc`; don't switch back to the Babel plugin.

## Server code

1. Put request handling in `server/`. Files in `api/` (Vercel functions) and `scripts/local-*.ts` (Vite middleware) only wire env and auth to it.
2. Relative imports in `api/` and `server/` use the `.js` extension (`"../../server/auth.js"`). Vercel runs them as native ES modules, and an extensionless import crashes the function at load.
3. Every `/api/*` route other than `/api/auth/*` and `GET /api/portal/branding` must check the session (`userFromSession` in `server/auth.ts`) and the role (`isStaff`, or `role === "customer"`) before touching data.

## Env and HTTP

1. Read browser env only in `src/lib/env.ts`.
2. Route HTTP through `src/lib/api.ts`.

## AI editing

1. Preserve the folder structure. Avoid monolithic files and unrelated edits.
2. Add comments only when they clarify something non-obvious.
3. Keep `README.md`, `FILES.md`, `RULES.md`, `DATABASE.md` and `DESIGN.md` in sync with code changes.
4. Ask before destructive schema changes or seeding data.

## Scripts

Keep `scripts/dev-supervisor.js`, `scripts/git-poll.js`, `scripts/error-reporter.ts` and `scripts/db-init.js` unless explicitly asked. Script changes must preserve the Vite runtime assumptions.
