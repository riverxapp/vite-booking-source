import { cn } from "@/lib/utils";
import type { Option, Tone } from "@/config/helpdesk";

// Flat tint fill + 1px border. The label always carries the meaning; tone only reinforces it.
const toneClasses: Record<Tone, string> = {
  neutral: "border-border bg-muted text-muted-foreground",
  blue: "border-brand/30 bg-brand-soft text-brand",
  green: "border-success/35 bg-success/10 text-success",
  amber: "border-amber-600/35 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  red: "border-destructive/35 bg-destructive/10 text-destructive",
  violet: "border-violet-600/30 bg-violet-500/10 text-violet-800 dark:text-violet-300",
};

type ToneBadgeProps = {
  options: readonly Option[];
  value: string | null | undefined;
  className?: string;
};

export function ToneBadge({ options, value, className }: ToneBadgeProps) {
  if (!value) return null;
  const option = options.find((o) => o.value === value);
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-sm border px-1.5 py-px font-mono text-[0.68rem] font-medium uppercase leading-5 tracking-[0.08em]",
        toneClasses[option?.tone ?? "neutral"],
        className,
      )}
    >
      {option?.label ?? value}
    </span>
  );
}
