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

// /api/db authenticates with the session cookie; the dev proxy also needs dbKey.
export const isDatabaseConfigured = Boolean(env.dbUrl);

// Absolute, so apiRequest never prefixes it with the API base URL. Handles the
// relative URL of the dev proxy as well as an absolute Data API URL.
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
