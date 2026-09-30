/**
 * Minimal toast store (replaces sonner). `toast.success` / `toast.error` push a
 * message; <Toaster /> in src/components/ui/toaster.tsx renders them.
 */

export type ToastKind = "success" | "error";
export type ToastItem = { id: number; kind: ToastKind; title: string; description?: string };

type Listener = (items: ToastItem[]) => void;

const DURATION_MS = 4000;
const MAX_VISIBLE = 3;

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener(items);
}

export function dismissToast(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

function push(kind: ToastKind, title: string, options?: { description?: string }) {
  const id = nextId++;
  items = [...items, { id, kind, title, description: options?.description }].slice(-MAX_VISIBLE);
  emit();
  setTimeout(() => dismissToast(id), DURATION_MS);
}

export function subscribeToasts(listener: Listener) {
  listeners.add(listener);
  listener(items);
  return () => {
    listeners.delete(listener);
  };
}

export const toast = {
  success: (title: string, options?: { description?: string }) => push("success", title, options),
  error: (title: string, options?: { description?: string }) => push("error", title, options),
};
