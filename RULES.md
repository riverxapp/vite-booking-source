# RULES.md

Change boundaries and placement rules for the booking template.

## Product shape

- Vite + React SPA: public landing, the booking flow under `/book`, auth pages, and the admin dashboard under `/app`.
- Admin data goes through Drizzle over the Data API (`src/db/client.ts`): RiverX's hosted one, the dev proxy, or `/api/db` in production. Our own Data API accepts admin sessions only.
- The booking page goes only through `/api/booking/*` (`server/booking.ts`). Visitors never get Data API access, and customers have no login.
- Auth goes through the server API (`server/auth.ts`); the browser never touches `auth_*` tables.
- Statuses, currency, locale and service lengths live in `src/config/booking.ts`; scheduling rules live in `BOOKING_RULES` in `server/slots.ts`. Never hard-code them in pages.
- Slot calculation lives only in `server/slots.ts` (pure functions). The booking page displays what the server computes and never decides availability itself.
- Booking dates and times are wall-clock values in the business time zone (`date` + minutes from midnight). Format them with `formatDay` / `formatTime` (UTC formatters), never with `new Date(...)` in the viewer's zone.
- One automated email in V1: the booking confirmation. Add others through `sendEmail` in `server/email.ts`.
- Keep V1 minimal: no payments, reminders, buffers, holidays, "any staff", customer accounts or reschedule flows unless asked.
- Dev-mode resource use is a product requirement: keep dependencies minimal (see Dependencies).

## Routing

1. Define routes in `src/app/routes.tsx`. Admin pages live under `/app`, the booking flow under `/book`; both are lazy-loaded. The admin tree is lazy from `AppLayout` down, so public visitors never download it.
2. Route-level views go in `src/pages`; shell composition goes in `src/components/layout` (admin) and `src/components/site` (public, `PublicLayout`). Add admin nav items in `nav.ts`, not a new layout.
3. Internal links use `/app/...` (admin) or `/book...` (public) paths.
4. Gate the admin tree with `RequireAuth`. The booking flow is public.
5. Booking flow state lives in the URL (`use-booking-params.ts`): a new step is a new parameter in `CHOICES`, so back/forward and deep links keep working.
6. Keep `basename: previewBasename` in `createBrowserRouter`. The RiverX editor preview serves the app under `/preview/<session>/__frame/`; without it every route shows the 404 page there. Navigate with `<Link>` / `useNavigate`, never `window.location`, so the prefix is kept.

## Data

1. Tables live only in `src/db/schema.ts`; change them with `pnpm db:push` (no runtime DDL).
2. Admin queries live in `src/features/<area>/api.ts`; components call those functions, not `db` directly. Public code (landing, `/book`, auth, `features/booking`, `features/branding/api.ts`) never imports `@/db/client`: it would put Drizzle in every visitor's bundle. Put an admin-only write next to public code in its own file (`features/branding/save.ts`). The booking page's `src/features/booking/api.ts` is an HTTP client for `/api/booking/*`, never Drizzle.
3. Anything the public booking page sees is queried in `server/booking.ts` with fixed, parameterised queries. It never returns customers or other people's bookings; free times are the only trace of existing bookings.
4. New bookings are inserted only by `server/booking.ts`, with the overlap guard in the same statement. Don't add another code path that writes `bookings` rows with `status = 'confirmed'` without it.
5. Use `db.batch([...])` for multi-step writes, never `db.transaction()`.
6. Paginate lists (`bookingConfig.pageSize`); the Data API caps results at 1,000 rows.
7. Never import `@libsql/client` or read `TURSO_*` from `src/`. They belong to `server/`, `scripts/`, `api/` and `drizzle.config.ts` only.
8. Rows that bookings reference (services, staff) are hidden or deactivated, not deleted, once they have bookings.
9. The SQL guard for our own Data API lives only in `server/db.ts`. Change it there so the dev proxy and `/api/db` stay identical.

## Components

1. Reusable primitives belong in `src/components/ui`; shared building blocks in `src/components/common`; charts in `src/components/charts`; icons in `src/components/icons.ts`.
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
3. Every `/api/*` route other than `/api/auth/*` and `/api/booking/*` must check the session (`userFromSession` in `server/auth.ts`) and the role (`isAdmin`) before touching data. `/api/booking/*` is public by design: keep it to the reads the booking page needs and the one rate-limited write.

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
