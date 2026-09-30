import type { IncomingMessage, ServerResponse } from "node:http";
import type { Client, InStatement, ResultSet } from "@libsql/client";
import { httpError, readJson, send } from "./http.js";

export { send };

/**
 * The Data API contract (see DATABASE.md) served from our own server with the
 * private TURSO_* credentials. Used by the Vite dev proxy (scripts/local-db-proxy.ts)
 * and the Vercel function (api/db/[action].ts); each caller does its own auth first
 * and lets only admin sessions through. The public booking page uses server/booking.ts.
 *
 *   GET  {base}/health
 *   POST {base}/query  { sql, params?, method? }
 *   POST {base}/batch  { queries: [...] }
 */

const MAX_ROWS = 1000;
const MAX_BODY_BYTES = 1024 * 1024;

type Method = "run" | "all" | "get" | "values";
type Query = { sql: string; params?: unknown[]; method?: Method };

const BLOCKED = [
  /^\s*(create|alter|drop|truncate|rename|reindex|attach|detach|vacuum)\b/i,
  /\bload_extension\s*\(/i,
  /^\s*pragma\b[^;]*=/i,
  /\b(insert\s+into|update|delete\s+from)\s+["'`]?(sqlite_|libsql_|__drizzle)/i,
];

function assertAllowed(sql: unknown) {
  if (typeof sql !== "string" || !sql.trim()) throw httpError(400, "Missing sql");
  // Auth tables are server-only (server/auth.ts); the browser never reads them.
  // Listed by name: `auth_user_id` columns on users/customers are fine to read. Add new auth_* tables here.
  if (/\bauth_(users|sessions|password_resets)\b/i.test(sql)) throw httpError(403, "Auth tables are not accessible from the browser");
  const withoutTrailing = sql.trim().replace(/;\s*$/, "");
  if (withoutTrailing.includes(";")) throw httpError(403, "Multiple statements are not allowed");
  if (BLOCKED.some((re) => re.test(withoutTrailing))) {
    throw httpError(403, "Statement blocked: schema changes go through drizzle-kit");
  }
}

function toResponse(rs: ResultSet) {
  const rows = rs.rows.slice(0, MAX_ROWS).map((row) => rs.columns.map((_, i) => row[i]));
  return {
    rows,
    rowsAffected: rs.rowsAffected,
    lastInsertRowid: rs.lastInsertRowid === undefined ? undefined : Number(rs.lastInsertRowid),
    truncated: rs.rows.length > MAX_ROWS,
  };
}

function toStatement(q: Query): InStatement {
  assertAllowed(q?.sql);
  return { sql: q.sql, args: (q.params ?? []) as never };
}

/** Serves one Data API action ("health" | "query" | "batch"). */
export async function handleDbRequest(db: Client, action: string, req: IncomingMessage, res: ServerResponse, mode: string) {
  try {
    if (action === "health" && req.method === "GET") {
      await db.execute("select 1");
      return send(res, 200, { ok: true, mode });
    }
    if (req.method !== "POST") return send(res, 405, { error: "Method not allowed", code: "method" });

    const body = await readJson(req, MAX_BODY_BYTES);
    if (action === "query") {
      return send(res, 200, toResponse(await db.execute(toStatement(body as Query))));
    }
    if (action === "batch") {
      const queries = (Array.isArray(body.queries) ? body.queries : []) as Query[];
      const results = await db.batch(queries.map(toStatement), "write");
      return send(res, 200, { results: results.map(toResponse) });
    }
    send(res, 404, { error: "Not found", code: "not_found" });
  } catch (error) {
    const status = (error as { status?: number }).status ?? 400;
    send(res, status, { error: error instanceof Error ? error.message : String(error), code: "query_failed" });
  }
}
