import { Link } from "react-router-dom";
import { useBranding } from "@/features/branding/use-branding";
import { initials } from "@/lib/format";

export function BrandMark({ to = "/" }: { to?: string }) {
  const { name, logoUrl } = useBranding();
  return (
    <Link to={to} className="flex min-w-0 items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {logoUrl ? (
        <img src={logoUrl} alt="" className="h-7 w-7 shrink-0 object-contain" />
      ) : (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-primary font-mono text-[0.72rem] font-semibold text-primary-foreground">
          {initials(name) || "H"}
        </span>
      )}
      <span className="truncate text-[0.95rem] font-bold tracking-tight">{name}</span>
    </Link>
  );
}
