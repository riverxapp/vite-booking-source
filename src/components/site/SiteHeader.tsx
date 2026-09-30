import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/layout/BrandMark";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { HOME } from "@/features/auth/api";
import { useAuth } from "@/features/auth/use-auth";

export function SiteHeader() {
  const { user } = useAuth();
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <BrandMark />
        <nav className="ml-auto flex items-center gap-3 sm:gap-5" aria-label="Site">
          {user ? (
            <Link to={HOME} className="hidden font-mono text-[0.72rem] uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground sm:inline">
              Dashboard
            </Link>
          ) : null}
          <ThemeToggle />
          <Button asChild size="sm">
            <Link to="/book">Book now</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
