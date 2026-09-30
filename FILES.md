# FILES.md

Structural index for the booking template.

## Entry points

- `index.html`: Vite HTML entry (loads fonts and `/src/main.tsx`). Required by Vite.
- `src/main.tsx`: React mount.
- `src/app/App.tsx`: providers (theme, auth, branding, toasts) + router.
- `src/app/routes.tsx`: every route. `/`, `/book`, `/book/confirmed`, `/login`, `/signup`, `/forgot-password`, `/reset-password` are public; `/app/*` (dashboard, bookings, services, staff, customers, settings) is for admins. The booking flow and the whole admin tree (layout, database gate, pages) are lazy-loaded.
- `src/app/DatabaseGate.tsx`: shows setup instructions when no database is configured (dev only in practice: production builds fall back to `/api/db`).

## Source areas

| Area | Path | Responsibility |
|---|---|---|
| Booking config | `src/config/booking.ts` | Statuses, currency, locale, service lengths, weekdays, page size: the file to edit to adapt the vocabulary |
| Database | `src/db/` | `schema.ts` (all tables), `client.ts` (Drizzle over the Data API), `helpers.ts` (search, paging types) |
| Features | `src/features/<area>/` | `booking` (public API client, URL state, stepper, the steps, summary, empty state), `bookings` (admin queries incl. filter options, `BookingList`), `services` (queries, create/edit sheet), `staff` (queries, default hours on create, weekly hours editor), `customers`, `branding` (public read in `api.ts`, admin write in `save.ts`, context, default intro), `settings` (profile form, URL validation), `auth` (session context, route guard) |
| Pages | `src/pages/` | Route-level views: landing, book, booking confirmed, auth, forgot/reset password, dashboard, bookings, booking detail, services, staff, staff detail, customers, customer detail, settings, 404 |
| Admin shell | `src/components/layout/` | `SidebarShell` + `AppLayout`, nav items, brand mark, theme toggle |
| Public site | `src/components/site/` | `PublicLayout` (header + footer), site header, footer, auth card |
| Shared pieces | `src/components/common/` | Page header, avatar, badges, option select, search, pager, form field, settings card, stat tile, empty/error states |
| Charts | `src/components/charts/` | `ColumnChart` (single series, tooltips, hidden table), `BarList` (labelled horizontal bars), `scale.ts` (clean ticks) |
| UI primitives | `src/components/ui/` | The shadcn components in use, restyled to `DESIGN.md`: button, card, checkbox (native), input, label, select, sheet, skeleton, spinner, table, textarea, toaster |
| Icons | `src/components/icons.ts` | The icons the app uses, inlined from Lucide (ISC). Add new ones here |
| Hooks | `src/hooks/` | `use-form` (form state + validation), `use-async`, `use-mutation`, `use-list-params` (URL state), `use-debounced-value` |
| Libs | `src/lib/` | `env.ts` (only place browser env is read; picks the Data API URL), `api.ts` (HTTP), `dates.ts` (booking dates, "now" in a time zone, time inputs), `format.ts` (`Intl` dates, times, durations, prices), `toast.ts` (toast store), `utils.ts` |
| Styles | `src/styles/globals.css` | Design tokens (light/dark) + `rx-*` helper classes |

## Server

Server code lives in `server/`; `api/` holds thin Vercel function wrappers and `scripts/local-*.ts` the Vite dev equivalents. Relative imports in `api/` and `server/` end in `.js` (they run as native ES modules on Vercel).

| Path | Responsibility |
|---|---|
| `server/slots.ts` | Slot calculation (availability + duration − bookings) and `BOOKING_RULES`. Pure functions, no I/O |
| `server/booking.ts` | Public booking API: branding, services, staff for a service, free slots, create booking (overlap-guarded insert + confirmation email) |
| `server/email.ts` | `sendEmail` (Resend over `fetch`, or a server log) and the booking confirmation template |
| `server/auth.ts` | Auth API: signup (first admin, then invite code), login, logout, me, forgot/reset password, profile. Scrypt hashes, DB-backed sessions |
| `server/db.ts` | Data API handler and SQL guard, shared by the local proxy and `/api/db` |
| `server/http.ts` | JSON body, response, cookie, routing and rate-limit helpers (self-pruning) shared by the handlers |
| `server/env.ts` | Reads the server-only settings (`TURSO_*`, `ADMIN_SIGNUP_CODE`, `APP_URL`, `RESEND_API_KEY`, `EMAIL_FROM`) |
| `api/auth/[action].ts` | Vercel function wrapping `server/auth.ts` |
| `api/booking/[action].ts` | Vercel function wrapping `server/booking.ts` |
| `api/db/[action].ts` | Vercel function serving the Data API at `/api/db/*`, admin sessions only |
| `scripts/local-api.ts` | Serves `/api/auth/*` and `/api/booking/*` from the Vite dev/preview server |
| `scripts/local-db-proxy.ts` | Dev-only stand-in for the RiverX Data API (`/__local-db/v1`), key- and session-checked, wrapping `server/db.ts` |

## Root config

`package.json` (includes `pnpm.overrides` that keep a single `esbuild`), `vite.config.ts` (SWC React plugin + local DB proxy + local API), `tsconfig.json`, `tailwind.config.js`, `postcss.config.js` (Tailwind only), `components.json`, `drizzle.config.ts`, `vercel.json`, `.env.example` (every variable, empty), `.gitignore`.

## Other scripts

- `scripts/dev-supervisor.js`, `scripts/git-poll.js`, `scripts/verify-dev-runtime.js`: RiverX runtime helpers.
- `scripts/error-reporter.ts`: browser error forwarding helper.
- `scripts/db-init.js`: Postgres migration helper (not used for Turso).

## Docs

`README.md` (overview), `RULES.md` (placement rules), `DATABASE.md` (data rules), `DESIGN.md` (visual system).
