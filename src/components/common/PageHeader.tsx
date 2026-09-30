import type { ReactNode } from "react";

type PageHeaderProps = {
  /** Mono label above the title — section name or breadcrumb. */
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, actions, children }: PageHeaderProps) {
  return (
    <div className="border-b bg-card px-4 py-5 sm:px-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 space-y-1.5">
          {eyebrow ? <div className="rx-meta rx-mark">{eyebrow}</div> : null}
          <h1 className="truncate text-[1.6rem] font-bold leading-tight tracking-[-0.02em]">{title}</h1>
          {description ? <div className="text-sm text-muted-foreground">{description}</div> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}
