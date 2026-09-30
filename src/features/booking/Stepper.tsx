import { Check } from "@/components/icons";
import { cn } from "@/lib/utils";

export const STEP_LABELS = ["Service", "Staff", "Date", "Time", "Details"] as const;

/** Progress through the flow. Finished steps are buttons that go back to them. */
export function Stepper({ current, onSelect }: { current: number; onSelect: (step: number) => void }) {
  return (
    <ol className="grid grid-cols-5 border bg-card" aria-label="Booking steps">
      {STEP_LABELS.map((label, i) => {
        const done = i < current;
        const content = (
          <>
            <span className="flex h-5 w-5 shrink-0 items-center justify-center border font-mono text-[0.66rem] tabular-nums">
              {done ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            <span className="hidden sm:inline">{label}</span>
            <span className="sr-only sm:hidden">{label}</span>
          </>
        );
        const base = "flex h-11 w-full items-center justify-center gap-2 border-b-2 px-1 font-mono text-[0.72rem] uppercase tracking-[0.08em] sm:justify-start sm:px-3";
        return (
          <li key={label} className={cn("min-w-0", i > 0 && "border-l")} aria-current={i === current ? "step" : undefined}>
            {done ? (
              <button
                type="button"
                onClick={() => onSelect(i)}
                className={cn(base, "border-transparent text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring")}
                aria-label={`${label}: change`}
              >
                {content}
              </button>
            ) : (
              <span className={cn(base, i === current ? "border-brand bg-brand-soft font-semibold text-foreground" : "border-transparent text-muted-foreground")}>
                {content}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
