import { useEffect, useState } from "react";
import { CheckCircle2, X, XCircle } from "@/components/icons";
import { dismissToast, subscribeToasts, type ToastItem } from "@/lib/toast";
import { cn } from "@/lib/utils";

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => subscribeToasts(setItems), []);

  return (
    <div
      aria-live="polite"
      aria-relevant="additions"
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
    >
      {items.map((t) => {
        const Icon = t.kind === "error" ? XCircle : CheckCircle2;
        return (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            className="pointer-events-auto flex items-start gap-3 border border-rule-strong bg-card p-3 text-sm shadow-modal animate-in fade-in-0 slide-in-from-bottom-1"
          >
            <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", t.kind === "error" ? "text-destructive" : "text-success")} />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{t.title}</p>
              {t.description ? <p className="mt-0.5 break-words font-mono text-xs text-muted-foreground">{t.description}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              className="rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
