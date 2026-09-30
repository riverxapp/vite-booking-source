import type { ReactNode } from "react";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

/** Header, solid ground, footer: the frame of every public page (landing, booking, auth). */
export function PublicLayout({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SiteHeader />
      <main className={className ?? "flex-1 bg-background"}>{children}</main>
      <SiteFooter />
    </div>
  );
}
