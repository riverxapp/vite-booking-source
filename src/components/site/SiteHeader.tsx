import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/layout/BrandMark";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { homeFor, isStaff } from "@/features/auth/api";
import { useAuth } from "@/features/auth/use-auth";
import { cn } from "@/lib/utils";

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "hidden h-14 items-center border-b-2 border-transparent px-1 font-mono text-[0.72rem] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground sm:flex",
    isActive && "border-brand text-foreground",
  );

export function SiteHeader() {
  const { user } = useAuth();
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <BrandMark />
        <nav className="ml-auto flex items-center gap-5" aria-label="Site">
          {user ? null : (
            <>
              <NavLink to="/login" className={navClass}>Log in</NavLink>
              <NavLink to="/signup" className={navClass}>Sign up</NavLink>
            </>
          )}
          <ThemeToggle />
          <Button asChild size="sm">
            {user ? (
              <Link to={homeFor(user)}>{isStaff(user) ? "Open inbox" : "My dashboard"}</Link>
            ) : (
              <Link to="/portal/tickets/new">Submit a ticket</Link>
            )}
          </Button>
        </nav>
      </div>
    </header>
  );
}
