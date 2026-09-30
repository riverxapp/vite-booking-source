import { or, sql, type SQL } from "drizzle-orm";
import type { SQLiteColumn } from "drizzle-orm/sqlite-core";
import { likePattern } from "@/lib/format";

/** Case-insensitive "contains" match across columns, with LIKE wildcards escaped. */
export function searchColumns(term: string | undefined, columns: (SQLiteColumn | SQL)[]) {
  if (!term?.trim()) return undefined;
  const pattern = likePattern(term);
  return or(...columns.map((c) => sql`${c} like ${pattern} escape '\\'`));
}

export type Page<T> = { rows: T[]; total: number };

export type Option = { id: number; label: string; hint?: string | null };
