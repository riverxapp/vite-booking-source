# RiverX Booking

RiverX Booking is a minimal appointment booking template: customers pick a service, a person, a date and a time, and get a confirmation email; the team runs services, staff, availability and bookings from an admin dashboard. Vite 6 + React + TypeScript + Tailwind + a trimmed set of shadcn/ui primitives, backed by **Turso** (libSQL) through Drizzle ORM.

It stays intentionally small so it can become a salon booking system, a clinic scheduler, a consultant booking app, a fitness appointment system, and so on. It runs cheaply in dev mode inside shared workspaces: 12 runtime dependencies, one `esbuild`, SWC instead of Babel, and small in-repo replacements for the usual icon, date, form and toast libraries (see [Dependency budget](#dependency-budget)).

## Quick start

```bash
pnpm install
cp .env.example .env        # then fill TURSO_DATABASE_URL and TURSO_AUTH_TOKEN
pnpm db:push                # create tables in Turso
pnpm dev                    # http://localhost:5173
```

1. Open `/signup` and create the first account: it becomes the admin, no code needed.
2. In **Settings**, set your company name, logo, booking page intro and **time zone** (working hours and bookings are in it).
3. Add **Services** (name, description, length, price), then **Staff**: new staff start on Monday–Friday, 9 AM–5 PM; on each person's page tick the services they perform and adjust their hours.
4. Share `/book`. Customers book as guests, no account.
5. To let teammates in, set `ADMIN_SIGNUP_CODE` on the server and share it; they sign up at `/signup` with it.

## How it works

```
Choose Service → Choose Staff → Choose Date → Choose Time → Enter Details → Booking Confirmed
                                                                              └─ confirmation email
```

**Available slots = staff availability + service duration − existing bookings.** `server/slots.ts` walks each working day in steps of the slot interval and keeps every start time where the whole service fits inside the hours, doesn't overlap a confirmed booking, and is at least the minimum notice away. Cancelled bookings don't block anything.

Dates and times are **wall-clock values in the business time zone**: a `date` (`YYYY-MM-DD`) plus minutes from midnight. Slot maths never converts time zones, customers see times in the business zone (the page says which), and daylight-saving changes can't shift a booking.

When a customer confirms, the server recomputes the slot, then inserts the booking with a guard (`insert … where not exists (overlapping confirmed booking)`) in one transaction, so two people can't take the same time. Losing that race returns `409` and the page sends the customer back to pick another time.

## Make it yours

| To change | Edit |
|---|---|
| Vocabulary: statuses, currency, locale, service lengths, week start | **`src/config/booking.ts`**. Stored values are the option `value` keys: renaming a label is safe; changing a `value` orphans rows that use the old key (and `server/booking.ts` writes `confirmed` itself) |
| Scheduling rules: booking window (30 days), slot interval (30 min), minimum notice (60 min) | `BOOKING_RULES` in **`server/slots.ts`** |
| The confirmation email | `confirmationEmail` in `server/email.ts` |
| Email provider | `sendEmail` in `server/email.ts` (Resend by default, over plain `fetch`) |
| Branding, booking intro, time zone | Settings → Business (admins), stored in `business_settings` |
| Hours new staff start with (Mon–Fri, 9–5) | `defaultHours` in `src/config/booking.ts` |

Ideas the template leaves out on purpose (add them when you need them): "any available staff", buffers between bookings, time off and holidays, several hour ranges per day, customer self-service cancel or reschedule, reminders, payments, per-staff time zones.

## Features

| Area | What you get |
|---|---|
| Booking page (`/book`) | Five steps with a progress bar and a running summary. Every choice lives in the URL, so back/forward and deep links (`/book?service=3`) work and a stale choice falls back to its step. Month grids show which days have free times; times are grouped morning / afternoon / evening |
| Confirmation | A confirmation page with the booking reference, and one automated email: the booking confirmation |
| Dashboard | Today, next 7 days, this month, customers; today's schedule, what's coming up, bookings per day for 14 days, bookings by service |
| Bookings | Upcoming (soonest first), past or all; search by name, email, phone or reference; filter by status, staff, service; paginated. Detail page with customer, notes and cancel |
| Services | Name, description, length, price, bookable or hidden. A service with bookings can be hidden, not deleted |
| Staff | Name, email, active; assigned services; weekly working hours (one range per weekday); upcoming bookings. Staff don't log in |
| Customers | Created from bookings, matched by email (booking again updates name and phone). List with booking count and last booking; profile with booking history |
| Statuses | `confirmed` → `cancelled` (V1). Cancelling frees the slot |
| Auth | Admin logins only: signup (first account free, then invite code), login, logout, password reset by email. Server-side sessions in httpOnly cookies |
| UI | Light and dark themes, responsive down to phone width, design system in `DESIGN.md` |

## Data model

| Table | Holds |
|---|---|
| `services` | Name, description, `duration_minutes`, `price_cents`, `active` |
| `staff` | Name, email, `active` |
| `staff_services` | Which services each staff member performs |
| `availability` | Weekly hours: `staff_id`, `weekday` (0 = Sunday), `start_minute`, `end_minute`; one row per staff member and weekday |
| `customers` | Name, email (unique), phone |
| `bookings` | `reference`, service, staff, customer, `date`, `start_minute`, `end_minute`, `status`, customer `notes` |
| `business_settings` | One row: company name, logo, booking intro, `timezone` (IANA; UTC until set) |
| `users` | Admin profiles: name, email, avatar |
| `auth_*` | Logins, sessions and reset tokens. Server-only |

## Commands

| Command | Does |
|---|---|
| `pnpm dev` | Dev server with the local DB proxy and the auth and booking APIs |
| `pnpm build` / `pnpm preview` | Production build / serve it. `pnpm dev` serves the API at `/__local-api/*`; `preview` serves `/api/auth` and `/api/booking` but not `/api/db`, so the admin dashboard needs `pnpm dev` or a Vercel deploy |
| `pnpm typecheck` | TypeScript check |
| `pnpm db:push` | Apply `src/db/schema.ts` to Turso |
| `pnpm db:studio` | Browse the database with Drizzle Studio |
| `pnpm verify:dev-runtime` | Check the dev-server defaults (host, port, strict port) |

## Environment

| Variable | Where | Purpose |
|---|---|---|
| `VITE_APP_NAME` | browser | Fallback name until an admin sets the company name in Settings (default `RiverX Booking`) |
| `VITE_API_BASE_URL` | browser | Base for `src/lib/api.ts` (default `/__local-api` in `pnpm dev`, `/api` in production builds). Never point the dev server at `/api`: a RiverX workspace preview routes `/api/*` to RiverX |
| `VITE_RIVERX_DB_URL` / `VITE_RIVERX_DB_KEY` | browser | RiverX Data API. Injected by RiverX; leave empty locally and on your own Vercel project |
| `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` | **server only** | drizzle-kit, the local DB proxy, and the auth, booking and data API functions. Never prefix with `VITE_` |
| `ADMIN_SIGNUP_CODE` | **server only** | Team invite code for more admins. The first account needs none; without this set, signup closes after it |
| `APP_URL` | **server only** | Public origin for links in emails, e.g. `https://book.example.com`. Defaults to the request's origin; set it in production |
| `RESEND_API_KEY` / `EMAIL_FROM` | **server only** | Send email through [Resend](https://resend.com). `EMAIL_FROM` is e.g. `Acme <bookings@acme.com>` on a domain verified there. Unset: emails are logged on the server instead |

`.env` / `.env.*` are gitignored.

## How data flows

```
admin    ── Drizzle (sqlite-proxy) ──▶ Data API ──▶ Turso            booking tables
visitor  ── /api/booking/* (no login) ──▶ server/booking.ts ──▶ Turso  services, staff, slots, new bookings
anyone   ── /api/auth/* (cookie)   ──▶ server/auth.ts ──▶ Turso      auth_* tables
```

The browser code is the same everywhere; only the Data API behind it changes:

| Where | Data API | Authorised by |
|---|---|---|
| RiverX | RiverX's hosted endpoint, from `VITE_RIVERX_DB_URL` (see `DATABASE.md`) | Publishable key `VITE_RIVERX_DB_KEY` |
| `pnpm dev`, no RiverX | `/__local-db/v1`, served by `scripts/local-db-proxy.ts` when `TURSO_*` are set | Random per-process key + admin session |
| Production build, no RiverX (e.g. Vercel) | `/api/db/*`, served by `api/db/[action].ts` | Admin session cookie |

- The local proxy and `/api/db` share `server/db.ts`: the same contract and SQL guard (no DDL, one statement per query, no SQL touching `auth_*` tables). The Turso token stays on the server.
- **Auth and booking** run only on the server: Vite middleware in dev (`scripts/local-api.ts`) and Vercel functions in production (`api/auth/[action].ts`, `api/booking/[action].ts`). They share `server/auth.ts` and `server/booking.ts`.

## Deploying

The build is a static SPA plus three serverless functions (`/api/auth/*`, `/api/booking/*`, `/api/db/*`). `vercel.json` rewrites client routes to `index.html`.

1. In Vercel → Project → Settings → Environment Variables, set `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `APP_URL`, `RESEND_API_KEY` and `EMAIL_FROM`, and (to let teammates join) `ADMIN_SIGNUP_CODE`, all server-only with no `VITE_` prefix, for each environment you deploy.
2. Run `pnpm db:push` against that database once so the tables exist.
3. Leave `VITE_RIVERX_DB_*` unset: admin data then goes through `/api/db`. Under RiverX, its injected `VITE_RIVERX_DB_*` take precedence.
4. Redeploy after changing env vars. `VITE_*` values are inlined at build time.

`package.json` sets `"type": "module"`, so Vercel runs the functions as native ES modules. Relative imports in `api/` and `server/` must end in `.js` (`from "../../server/auth.js"`); without it the function fails to load with `FUNCTION_INVOCATION_FAILED`.

| Symptom on Vercel | Cause / fix |
|---|---|
| `FUNCTION_INVOCATION_FAILED` | Usually a relative import without `.js` in `api/` or `server/`. Check the function logs for `ERR_MODULE_NOT_FOUND` |
| 503 "The server is not configured" | `TURSO_*` missing from that environment's variables |
| "Connect a database to get started" | The deployed build predates `/api/db`. Redeploy from the current `main` |
| Data requests return 401 "Log in to continue." | No valid session cookie. Log in again |
| Errors like `no such table` | Run `pnpm db:push` against the production database |
| Customers get no email | `RESEND_API_KEY` or `EMAIL_FROM` unset, or the sender domain isn't verified in Resend. The function logs say which |
| Booking times look shifted | The business time zone isn't set: Settings → Business → Time zone (UTC until saved) |

## Security notes

- **Customer data is protected only on our own Data API** (the local proxy and `/api/db`), which accept admin sessions only. The booking page uses `/api/booking/*`, which exposes services, staff names and free times, and creates bookings; it never returns other customers or bookings.
- **Under RiverX's hosted Data API, that protection is gone.** Its key ships in the browser bundle, so anyone with the app URL can read every table, customer names, emails and phone numbers included. Don't take real bookings on it.
- Every admin can read and write all booking data.
- `POST /api/booking/bookings` is rate limited per IP (20 per 15 minutes, per server instance). Add a CAPTCHA if spam bookings become a problem.
- Under RiverX's hosted Data API, the `auth_*` tables are readable with the public key. Passwords are scrypt-hashed and only token hashes are stored, but for real deployments keep auth in a database the public key cannot reach.

## Dependency budget

Dev mode is what runs in the workspaces, so every package has to earn its place. The booking conversion added no dependencies: still 12 at runtime. Email goes through `fetch`, and the booking calendar, time grid and charts are plain components.

What a visitor downloads is kept apart from what an admin needs. Production build, measured 2026-09-30:

| Chunk | Loaded by | Size (gzip) |
|---|---|---|
| Main (`index`) | Every page: landing, auth, booking shell | 282 KB (92 KB) |
| Booking flow (`BookPage`, with its steps) | `/book` | 14 KB (5 KB) |
| Drizzle client (`client`) | `/app` only | 74 KB (21 KB) |
| Radix select (`OptionSelect`) | `/app` only | 51 KB (18 KB) |

Before the split the main chunk was 399 KB (126 KB gzipped), because Drizzle, the Radix dialog and the booking steps came along with the landing page. Keep it that way:

- Public modules (landing, `/book`, auth, `features/booking`, `features/branding/api.ts`) must not import `@/db/client`. Admin-only writes sit in their own files (e.g. `features/branding/save.ts`).
- The admin tree is lazy from its layout down (`AppLayout`, `DatabaseGate`, every page), so add admin routes inside it.
- Check with `pnpm build`: a public change that grows `index-*.js` noticeably has probably pulled in admin code.

What replaced what:

| Instead of | Use | Why |
|---|---|---|
| `lucide-react` | `src/components/icons.ts` | Dev mode pre-bundled all 1,947 icons (1.4 MB per page load, 38 MB on disk) for the few we use |
| `date-fns` | `Intl` helpers in `src/lib/format.ts` and `src/lib/dates.ts` | A handful of date functions; 53 MB on disk with its jalali copy |
| `react-hook-form` (+ `zod`, resolvers) | `src/hooks/use-form.ts` | Same API subset (`register`, `Controller`, `handleSubmit`, `reset`, `watch`) in under 100 lines |
| `sonner` | `src/lib/toast.ts` + `ui/toaster.tsx` | `toast.success` / `toast.error` only |
| `recharts` | `src/components/charts/` (`ColumnChart`, `BarList`) | recharts was 1.26 MB in dev |
| A date-picker library | `DateStep` in `src/features/booking/steps.tsx` | A month grid of buttons is all the flow needs |
| An email SDK | `fetch` in `server/email.ts` | One POST to the provider's HTTP API |
| `@radix-ui/react-label`, a checkbox primitive | native `<label>`, `ui/checkbox.tsx` (native input) | No behaviour needed |
| `@vitejs/plugin-react` (Babel) | `@vitejs/plugin-react-swc` | ~40% less idle memory, less CPU per transform, drops Babel + browserslist data |
| `autoprefixer` | — | Target browsers need no prefixes; it ran on every CSS change |

Kept on purpose: `react`, `react-dom`, `react-router-dom`, `drizzle-orm`, `@libsql/client` (server only), `tailwind-merge` (class overrides depend on it), `class-variance-authority`, `clsx`, `next-themes` (3 KB, no-flash theme), and the Radix primitives that provide the accessible sheet (dialog), select and slot.

`package.json` pins `drizzle-kit`'s internal `esbuild` copies (`pnpm.overrides`) to the version Vite uses, so only one `esbuild` binary is installed. Before adding a dependency, check `RULES.md`.

## Project structure

See `FILES.md`. Placement rules are in `RULES.md`; database rules are in `DATABASE.md`; visual rules are in `DESIGN.md`.
