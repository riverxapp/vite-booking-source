import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Option } from "@/config/helpdesk";
import { cn } from "@/lib/utils";

const ALL = "__all__";
const NONE = "__none__";

type OptionSelectProps = {
  options: readonly Option[];
  value: string;
  onChange: (value: string) => void;
  /** Adds a first entry that maps to "" (e.g. "All stages" in filters, "None" in forms). */
  emptyLabel?: string;
  placeholder?: string;
  className?: string;
  id?: string;
  kind?: "filter" | "field";
};

export function OptionSelect({
  options,
  value,
  onChange,
  emptyLabel,
  placeholder,
  className,
  id,
  kind = "field",
}: OptionSelectProps) {
  const empty = kind === "filter" ? ALL : NONE;
  return (
    <Select value={value || (emptyLabel ? empty : undefined)} onValueChange={(v) => onChange(v === empty ? "" : v)}>
      <SelectTrigger id={id} className={cn(kind === "filter" ? "h-9 w-full sm:w-44" : "", className)}>
        <SelectValue placeholder={placeholder ?? "Select…"} />
      </SelectTrigger>
      <SelectContent>
        {emptyLabel ? <SelectItem value={empty}>{emptyLabel}</SelectItem> : null}
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
