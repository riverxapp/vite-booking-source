import type { ReactNode } from "react";
import type { IconComponent } from "@/components/icons";
import { AlertTriangle, DatabaseZap } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: IconComponent;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 border bg-card px-6 py-12 text-center", className)}>
      <div className="flex h-10 w-10 items-center justify-center border bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description ? <p className="max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 border border-destructive/40 bg-card px-6 py-10 text-center">
      <AlertTriangle className="h-5 w-5 text-destructive" />
      <div className="space-y-1">
        <p className="font-medium">Couldn’t load data</p>
        <p className="max-w-md break-words font-mono text-xs text-muted-foreground">{error.message}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function LoadingRows({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-px border bg-[var(--rule)]">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-11 w-full rounded-none" />
      ))}
    </div>
  );
}

export function DatabaseSetup() {
  return (
    <div className="mx-auto max-w-xl p-6">
      <EmptyState
        icon={DatabaseZap}
        title="Connect a database to get started"
        description={
          <>
            In RiverX, open the <b>Data</b> tab and click <b>Create database</b>. Running locally? Put{" "}
            <code className="rounded bg-muted px-1">TURSO_DATABASE_URL</code> and{" "}
            <code className="rounded bg-muted px-1">TURSO_AUTH_TOKEN</code> in <code className="rounded bg-muted px-1">.env</code>,
            run <code className="rounded bg-muted px-1">pnpm db:push</code>, then restart <code className="rounded bg-muted px-1">pnpm dev</code>.
          </>
        }
      />
    </div>
  );
}
