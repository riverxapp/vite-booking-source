import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

/** List state (search, filters, page) kept in the URL so it survives reloads and back/forward. */
export function useListParams<K extends string>(filterKeys: readonly K[]) {
  const [params, setParams] = useSearchParams();

  const search = params.get("q") ?? "";
  const page = Math.max(0, Number(params.get("page") ?? 0) || 0);
  const filters = Object.fromEntries(filterKeys.map((k) => [k, params.get(k) ?? ""])) as Record<K, string>;

  const update = useCallback(
    (patch: Record<string, string | number | null>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          // Any change other than paging returns to the first page.
          if (!("page" in patch)) next.delete("page");
          for (const [k, v] of Object.entries(patch)) {
            if (v === null || v === "" || (k === "page" && v === 0)) next.delete(k);
            else next.set(k, String(v));
          }
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  return {
    search,
    page,
    filters,
    setSearch: (q: string) => update({ q }),
    setPage: (p: number) => update({ page: p }),
    setFilter: (key: K, value: string) => update({ [key]: value }),
  };
}
