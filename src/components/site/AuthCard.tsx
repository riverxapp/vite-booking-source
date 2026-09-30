import type { FormEventHandler, ReactNode } from "react";
import { useBranding } from "@/features/branding/use-branding";
import { PublicLayout } from "./PublicLayout";

type AuthCardProps = {
  eyebrow: string;
  title: string;
  /** Defaults to "to <company>". */
  subtitle?: ReactNode;
  onSubmit: FormEventHandler<HTMLFormElement>;
  /** The fields band. */
  children: ReactNode;
  /** The footer band: errors, submit, links. */
  footer: ReactNode;
};

/** The single square card every auth page uses: ruled header, fields and footer bands. */
export function AuthCard({ eyebrow, title, subtitle, onSubmit, children, footer }: AuthCardProps) {
  const { name } = useBranding();
  return (
    <PublicLayout className="flex flex-1 items-center justify-center bg-background px-4 py-12">
      <form onSubmit={onSubmit} noValidate className="w-full max-w-sm border bg-card" aria-labelledby="auth-title">
        <div className="border-b px-6 py-5">
          <p className="rx-meta rx-mark">{eyebrow}</p>
          <h1 id="auth-title" className="mt-2 text-[1.5rem] font-bold tracking-[-0.02em]">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle ?? `to ${name}`}</p>
        </div>
        <div className="space-y-4 px-6 py-5">{children}</div>
        <div className="space-y-3 border-t px-6 py-4">{footer}</div>
      </form>
    </PublicLayout>
  );
}

export function FormError({ message }: { message: string | null | undefined }) {
  return message ? (
    <p role="alert" className="font-mono text-xs text-destructive">
      {message}
    </p>
  ) : null;
}
