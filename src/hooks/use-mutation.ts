import { useState } from "react";
import { toast } from "@/lib/toast";

/** Wraps a write so callers get a pending flag and a toast on failure. */
export function useMutation<A extends unknown[], R>(fn: (...args: A) => Promise<R>) {
  const [pending, setPending] = useState(false);

  async function run(...args: A): Promise<R | undefined> {
    setPending(true);
    try {
      return await fn(...args);
    } catch (e) {
      toast.error("Something went wrong", { description: e instanceof Error ? e.message : String(e) });
      return undefined;
    } finally {
      setPending(false);
    }
  }

  return { run, pending };
}
