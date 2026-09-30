import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  label: string;
  htmlFor?: string;
  error?: string;
  className?: string;
  children: ReactNode;
};

export function FormField({ label, htmlFor, error, className, children }: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

type DetailItemProps = { label: string; children: ReactNode };

export function DetailItem({ label, children }: DetailItemProps) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] items-baseline gap-2 border-b py-2 text-sm last:border-b-0">
      <dt className="rx-meta">{label}</dt>
      <dd className="min-w-0 break-words">{children || <span className="text-muted-foreground">—</span>}</dd>
    </div>
  );
}
