# DATABASE.md

How to add and use a database in a RiverX Vite app.

RiverX gives each project an optional **Turso (libSQL / SQLite)** database. The app never talks to Turso directly. It sends queries to a Data API that holds the real Turso credentials server-side: the **RiverX Data API** in the RiverX preview, and the app's own `/api/db` in every production build, including apps published from RiverX. You write queries with **Drizzle ORM** (`drizzle-orm/sqlite-proxy`).

```
preview:    browser app ──POST {VITE_RIVERX_DB_URL}/query──▶ RiverX Data API ──▶ Turso
                           x-riverx-key: {VITE_RIVERX_DB_KEY}
published:  browser app ──POST /api/db/query (session cookie)──▶ api/db/[action].ts ──▶ Turso
```

The app serves the same Data API contract itself: `/__local-db/v1` in `pnpm dev` outside RiverX, and `/api/db` in every production build, published from RiverX or deployed yourself. See [section 9](#9-running-outside-riverx).

> [!WARNING]
> **In the RiverX preview, anyone with the publishable key can read and write this database.** The key ships in the preview's JS bundle, and RiverX's hosted Data API has no row-level security or end-user auth. It blocks destructive statements, but it does not stop `SELECT * FROM <table>`. The preview and the published app share the database, so a leaked preview key reaches published data.
> Published apps do not use the key: admin data goes through `/api/db`, which accepts admin sessions only, and the booking page uses `/api/booking/*`.
> **Never store passwords, secrets, tokens, or personal data (PII) in it.**

---

## 1. Turn it on

The database is created on demand, not by default.

1. Open the project preview in RiverX and go to the **Data** tab.
2. Click **Create database**.
3. RiverX provisions the database and injects the connection env vars (below) into the preview. When you publish, it sets them on the Vercel project (section 8).

Until that happens, the env vars are empty. The client in step 4 handles this, so the app still boots.

## 2. Environment variables

Under RiverX, all of these are **injected by the platform. Do not edit `.env.local` by hand**, and never commit it. Outside RiverX, see [section 9](#9-running-outside-riverx).

| Variable | Where it exists | Used by |
|---|---|---|
| `VITE_RIVERX_DB_URL` | `.env.local`, Vite env, Vercel env | App (browser), dev server only. Data API base URL, e.g. `https://agent.riverx.app/db/v1`. Production builds ignore it |
| `VITE_RIVERX_DB_KEY` | `.env.local`, Vite env, Vercel env | App (browser), dev server only. Publishable key `rxdb_pk_…`. Production builds leave it out of the bundle |
| `TURSO_DATABASE_URL` | Server side **only**: dev server and workspace terminal; Vercel env (set by RiverX when you publish); your own `.env` or Vercel env outside RiverX | `drizzle-kit`, the auth API, the local proxy and `/api/db` |
| `TURSO_AUTH_TOKEN` | Server side **only**, as above | As above |

`TURSO_*` values are full-access credentials. Under RiverX they are never written to disk, and on the published Vercel project they are sensitive (write-only) variables. Outside RiverX keep them only in a gitignored `.env` or your host's server-side env. Never read them from `src/`, never commit them, and never prefix them with `VITE_`.

Make sure `.gitignore` contains:

```gitignore
.env
.env.*
!.env.example
```

Add the public vars to `.env.example` (empty values):

```bash
VITE_RIVERX_DB_URL=
VITE_RIVERX_DB_KEY=
```

## 3. Install

```bash
pnpm add drizzle-orm @libsql/client
pnpm add -D drizzle-kit
```

`@libsql/client` is used by `drizzle-kit`, the local dev proxy, the auth and booking APIs, and `/api/db` (a runtime dependency because the Vercel functions need it). **Never import it from `src/`**: it would bypass the Data API and needs the private token.

## 4. Files

### `src/lib/env.ts`: expose the vars

Per `RULES.md`, env vars are read only here.

```ts
// Production builds (including apps published from RiverX) always use our own
// Data API function (api/db/[action].ts). The publishable key is dev-only.
export const env = {
  // ...existing fields
  dbUrl: import.meta.env.PROD ? "/api/db" : import.meta.env.VITE_RIVERX_DB_URL || "",
  dbKey: import.meta.env.PROD ? "" : import.meta.env.VITE_RIVERX_DB_KEY || "",
};
```

### `src/db/schema.ts`: tables

All tables live in this one file.

```ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const todos = sqliteTable("todos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  done: integer("done", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;
```

### `src/db/client.ts`: the `db` instance

Copy this as-is. The response shapes are strict: see [Why the shapes matter](#why-the-shapes-matter).

```ts
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { apiRequest } from "@/lib/api";
import { env } from "@/lib/env";
import * as schema from "./schema";

type Method = "run" | "all" | "get" | "values";

type QueryResult = {
  rows: unknown[];
  rowsAffected?: number;
  lastInsertRowid?: number;
  truncated?: boolean;
};

// /api/db authenticates with the session cookie; the RiverX Data API also needs dbKey.
export const isDatabaseConfigured = Boolean(env.dbUrl);

// Absolute, so apiRequest never prefixes it with the API base URL. Handles the
// relative URL of the local dev proxy as well as the RiverX Data API URL.
const dbBaseUrl = env.dbUrl ? new URL(env.dbUrl, window.location.origin).href.replace(/\/$/, "") : "";

function post<T>(path: string, body: unknown) {
  if (!isDatabaseConfigured) {
    throw new Error("Database is not configured. Create one from the RiverX Data tab.");
  }
  return apiRequest<T>(`${dbBaseUrl}/${path}`, {
    method: "POST",
    headers: { "x-riverx-key": env.dbKey },
    body,
  });
}

// drizzle maps rows by position: 'all'/'values' need unknown[][], 'get' needs one flat unknown[].
function shape(result: QueryResult, method: Method) {
  if (method === "run") return { rows: [] };
  if (method === "get") {
    const first = result.rows[0];
    return { rows: (Array.isArray(first) ? first : result.rows) as unknown[] };
  }
  return { rows: result.rows };
}

export const db = drizzle(
  async (sql, params, method) => {
    const result = await post<QueryResult>("query", { sql, params, method });
    return shape(result, method);
  },
  async (queries) => {
    const { results } = await post<{ results: QueryResult[] }>("batch", { queries });
    return results.map((result, i) => shape(result, queries[i].method));
  },
  { schema },
);
```

### `drizzle.config.ts`: schema tooling

This uses the **direct Turso connection**, not the proxy, because `drizzle-kit` can't push through `sqlite-proxy`. Outside RiverX it loads `TURSO_*` from `.env.local` / `.env`.

```ts
import { defineConfig } from "drizzle-kit";

// Outside RiverX, TURSO_* come from a gitignored .env / .env.local.
// In the RiverX workspace terminal they are already in the process env.
for (const file of [".env.local", ".env"]) {
  if (process.env.TURSO_DATABASE_URL) break;
  try {
    process.loadEnvFile(file);
  } catch {
    // File not present.
  }
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
```

## 5. Changing the schema

1. Edit `src/db/schema.ts`.
2. In the **workspace terminal**, where `TURSO_*` are available (or locally, with them in `.env`), run:

   ```bash
   pnpm db:push
   ```

3. Check the result in the **Data** tab, or with `pnpm db:studio` outside RiverX.

Rules:

- **Schema changes happen only through `drizzle-kit`.** `CREATE`/`ALTER`/`DROP` from app code is always rejected by the Data API, and the Data tab blocks DDL too.
- **Preview and the published app share the same database.** A push changes production data too. Outside RiverX, the same holds for any environments pointing at the same `TURSO_DATABASE_URL`.
- `drizzle-kit push` **will drop columns and tables** if you remove them from the schema. Before any destructive change (dropping or renaming a column or table, changing a type), stop and confirm with the user.
- Do not seed or bulk-insert data unless the user asks for it.

## 6. Querying

Import `db` and the tables, and write normal Drizzle queries:

```ts
import { eq, desc } from "drizzle-orm";
import { db } from "@/db/client";
import { todos } from "@/db/schema";

// read
const all = await db.select().from(todos).orderBy(desc(todos.createdAt));
const one = await db.select().from(todos).where(eq(todos.id, 1)).get();

// write
const [created] = await db.insert(todos).values({ title: "Ship it" }).returning();
await db.update(todos).set({ done: true }).where(eq(todos.id, created.id));
await db.delete(todos).where(eq(todos.id, created.id));
```

### Atomic multi-step writes: use `db.batch`, never `db.transaction`

`db.transaction()` is **not supported** by `sqlite-proxy` and throws at runtime. Use `db.batch()`, which Turso runs in one implicit transaction: all statements succeed or none do.

```ts
await db.batch([
  db.insert(todos).values({ title: "A" }),
  db.update(todos).set({ done: true }).where(eq(todos.id, 7)),
]);
```

### In React components

Query in effects or data hooks, not during render. Gate database features on `isDatabaseConfigured`:

```tsx
import { useEffect, useState } from "react";
import { db, isDatabaseConfigured } from "@/db/client";
import { todos, type Todo } from "@/db/schema";

export function TodoList() {
  const [items, setItems] = useState<Todo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isDatabaseConfigured) return;
    db.select().from(todos).then(setItems).catch((e) => setError(String(e)));
  }, []);

  if (!isDatabaseConfigured) return <p>Database not set up yet.</p>;
  if (error) return <p>Could not load todos.</p>;
  return <ul>{items.map((t) => <li key={t.id}>{t.title}</li>)}</ul>;
}
```

## 7. Limits and blocked statements

Enforced by RiverX's hosted Data API (used by the RiverX preview) on every request:

| Limit | Default |
|---|---|
| Rows returned per query | 1,000 (extra rows are cut and the response has `truncated: true`, so paginate with `.limit()` / `.offset()`) |
| SQL length | 20,000 characters |
| Rate limit | 600 queries / minute per project |
| Query timeout | 15 seconds |
| Statements per `query` call | 1 (use `db.batch` for more) |

Always rejected: DDL (`CREATE`, `ALTER`, `DROP`, `TRUNCATE`, `RENAME`, `REINDEX`), `ATTACH`/`DETACH`, `VACUUM INTO`, `LOAD_EXTENSION`, `PRAGMA` writes, multiple statements in one call, and writes to `sqlite_*`, `libsql_*` and `__drizzle*` tables.

Our own Data API (`server/db.ts`, behind the local proxy and `/api/db`, which every production build uses) applies the same row cap, one-statement rule and blocked list (it rejects `VACUUM` in any form), and also rejects any SQL that mentions `auth_users`, `auth_sessions` or `auth_password_resets` (list new auth tables there too; the `auth_user_id` columns stay readable). Both callers only accept an admin session; the public booking page uses `/api/booking/*` instead (section 10). It has a 1 MB request body limit but no SQL-length limit, rate limit or query timeout of its own.

Errors come back as `{ error, code }` and surface as thrown errors from `apiRequest`.

| Status | Meaning |
|---|---|
| 401 | Missing or invalid `x-riverx-key` (RiverX preview, local proxy), or no logged-in session (local proxy, `/api/db`) |
| 403 | Statement blocked by the guard, origin not allowed, or a non-admin session on our own Data API |
| 413 | Request body over 1 MB (our own Data API) |
| 429 | Rate limited, so back off and retry (RiverX preview) |

`GET {dbUrl}/health` returns liveness and the access mode (`local-proxy` or `vercel-function` for ours). In the RiverX preview and the local proxy it needs `x-riverx-key`; `/api/db/health` needs an admin session.

## 8. Publishing

- RiverX adds `VITE_RIVERX_DB_URL`, `VITE_RIVERX_DB_KEY`, `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` to the Vercel env for production and preview **before** the build. `TURSO_*` are sensitive variables: write-only and server-only.
- Production builds ignore `VITE_RIVERX_DB_*`. Data goes through `/api/db` with the login session, so the publishable key and the RiverX Data API URL are not in the published bundle.
- RiverX does not set `APP_URL`, `RESEND_API_KEY`, `EMAIL_FROM` or `ADMIN_SIGNUP_CODE`. Add them in Vercel yourself if you want them.
- The published domain and any custom domain are added to the database's allowed origins automatically.
- Each project's database has its own Turso token. To replace it, use **Key** in the **Data** tab. The old token stops working at once; RiverX updates the Vercel env, redeploys the current production build and restarts the preview. The live app's server routes fail for the minute or so the redeploy takes.

## 9. Running outside RiverX

Put `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` where the server can read them and leave `VITE_RIVERX_DB_URL` empty (production builds ignore it anyway). `server/db.ts` then serves the Data API contract from our own server, with the guard from section 7. `src/db/client.ts` is the same in every mode; it resolves relative URLs against the page origin.

### Local development: `/__local-db/v1`

With `TURSO_*` in a gitignored `.env` (or exported), `pnpm dev` serves the proxy (`scripts/local-db-proxy.ts`):

- The Turso token stays in the Vite Node process; the browser gets a random per-process key.
- The key alone is not enough: the proxy also requires an admin session, like `/api/db`.
- The proxy exists in `vite dev` only. `vite build` output never contains it or the token. `pnpm preview` does not serve it or `/api/db`.
- `drizzle.config.ts` loads `.env.local` / `.env` itself, so `pnpm db:push` works too.

### Production (Vercel): `/api/db`

Every production build uses `/api/db` (`api/db/[action].ts`), including apps published from RiverX:

- Set `TURSO_*` in the Vercel project's Environment Variables (publishing from RiverX does this for you) and run `pnpm db:push` against that database once.
- Requests are authorised by the login session cookie instead of `x-riverx-key`, and only admin sessions are accepted.
- Every admin can read and write all booking rows through the guard.

## 10. The booking page and auth tables (server-only)

Visitors never get Data API access. The public booking page talks to `/api/booking/*` (`server/booking.ts`), which runs fixed, parameterised queries: active services someone performs, active staff for a service, free slots, and creating a booking. It never returns customers or other people's bookings; free times are the only trace of existing bookings. Keep it that way: anything new the booking page needs belongs in `server/booking.ts`, not in `src/features/*/api.ts`.

The slots endpoint reads the service, staff member, weekly hours, confirmed bookings in the window and the time zone in one read batch (one round trip); creating a booking reads only that date's bookings. Bookings are inserted only there, with an overlap guard in the same statement (`insert … select … where not exists (a confirmed booking for that staff member that overlaps)`) inside a write batch, so two people can't take the same time. Slot maths lives in `server/slots.ts`.

> [!WARNING]
> **In the RiverX preview this separation does not hold.** The preview uses RiverX's hosted Data API, and its publishable key is in the preview's bundle, so anyone who gets it can query `customers` and `bookings` directly and read names, emails and phone numbers. The preview and the published app share the database. Published apps don't ship the key: they use our own Data API (`/api/db`, admins only).

`auth_users`, `auth_sessions` and `auth_password_resets` are defined in `schema.ts` but are read and written **only** by `server/auth.ts`, which runs on the server (Vite middleware in dev, `api/auth/[action].ts` on Vercel) with `TURSO_*`.

- Never query `auth_*` from `src/`. The local proxy and `/api/db` reject any SQL that mentions them.
- Passwords are scrypt-hashed. Session tokens live only in an httpOnly cookie and reset tokens only in the reset link; the tables store their SHA-256.
- `auth_users.role` is `admin`. Each login has one `users` profile row; names, emails and avatars shown in the app come from it, and `server/auth.ts` keeps both emails in sync. Customers have no login: `customers` rows are created by bookings, matched by email.
- **Caveat:** RiverX's hosted Data API does not know about this rule, so in the RiverX preview the `auth_*` tables are readable with the publishable key. Hashes are not plaintext. Published apps go through `/api/db`, which rejects such SQL, but the database is shared, so the preview's key must not leak.
- The server auth API needs `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` in the hosting environment (server-only, never `VITE_`). Publishing from RiverX sets them.

## 11. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `Database is not configured` | No database yet: create one from the **Data** tab. If you just created it, restart the preview. Locally, put `TURSO_*` in `.env` and restart `pnpm dev`. |
| Every field is `undefined` in results | Rows were returned as objects instead of positional arrays. Use the `client.ts` above unchanged. |
| `get()` returns nested garbage | `'get'` must return one flat array, not `[[...]]`. Use `shape()` above. |
| `db.transaction is not a function` / throws | Not supported. Use `db.batch([...])`. |
| 403 on `CREATE TABLE` | DDL is blocked at runtime. Change `schema.ts` and run `drizzle-kit push`. |
| `drizzle-kit push` can't connect | Under RiverX, run it in the workspace terminal, where `TURSO_*` are injected (they are not in `.env.local` by design). Outside RiverX, put them in `.env`. |
| 401 `Log in to continue.` from `/api/db` or the local proxy | No valid session. Log in again. |
| 403 `Only admins can use the Data API.` | A non-admin session reached the admin data path. Public pages must call `/api/booking/*` (`src/features/booking/api.ts`). |
| 403 `Auth tables are not accessible from the browser` | The SQL names `auth_users`, `auth_sessions` or `auth_password_resets`. Go through `/api/auth/*`. |
| Admin pages fail under `pnpm preview` | `preview` doesn't serve `/api/db` (the booking page still works: `/api/booking` is served). Use `pnpm dev` or deploy. |
| Results stop at 1,000 rows | Row cap. Paginate. |

## Checklist for agents

- `db` comes from `src/db/client.ts`. Tables live in `src/db/schema.ts`.
- Apply schema changes with `pnpm db:push`. There is no DDL at runtime.
- Use `db.batch([...])`, **never** `db.transaction()`.
- A booking app stores customer names, emails and phone numbers. On our own Data API (every published app) only admins can read them; in the RiverX preview anyone with the publishable key can, so keep that key private. Never store secrets or plaintext passwords.
- Don't edit `.env.local`. Don't read `TURSO_*` from `src/`. Don't import `@libsql/client` in `src/`.
- Ask before destructive schema changes or seeding data.
- Never read or write `auth_*` tables from `src/`. Auth goes through `/api/auth/*`.
- Public booking data goes through `server/booking.ts` only, and new bookings only through its overlap-guarded insert.
- Change the SQL guard for our own Data API only in `server/db.ts`.
- `scripts/db-init.js` is the separate Postgres (`DATABASE_URL`) migration helper. It is **not** used for the Turso database.
