import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Menu } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Avatar } from "@/components/common/Avatar";
import { useAuth } from "@/features/auth/use-auth";
import { cn } from "@/lib/utils";
import { BrandMark } from "./BrandMark";
import type { NavItem } from "./nav";
import { ThemeToggle } from "./ThemeToggle";

function NavList({ items }: { items: NavItem[] }) {
  return (
    <ul>
      {items.map(({ to, label, icon: Icon, end }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex h-10 items-center gap-3 border-l-2 border-transparent px-4 font-mono text-[0.72rem] uppercase tracking-[0.08em] text-muted-foreground transition-colors [transition-duration:120ms] hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                isActive && "border-brand bg-brand-soft font-semibold text-foreground hover:bg-brand-soft",
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

type ShellProps = {
  /** Where the brand mark links: the audience's home. */
  home: string;
  /** Small label above the main nav. */
  section: string;
  items: NavItem[];
  secondaryItems: NavItem[];
};

function SidebarBody({ home, section, items, secondaryItems }: ShellProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center border-b px-4">
        <BrandMark to={home} />
      </div>
      <nav className="flex-1 overflow-y-auto py-3" aria-label="Main">
        <p className="rx-meta px-4 pb-2">{section}</p>
        <NavList items={items} />
      </nav>
      <div className="border-t py-2">
        <NavList items={secondaryItems} />
      </div>
      <div className="flex items-center gap-2 border-t px-4 py-3">
        {user ? <Avatar name={user.name} src={user.avatar} /> : null}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{user?.name}</p>
          <p className="truncate font-mono text-[0.7rem] uppercase tracking-[0.06em] text-muted-foreground">{user?.role}</p>
        </div>
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="Log out"
          onClick={async () => {
            await signOut();
            navigate("/", { replace: true });
          }}
        >
          <LogOut />
        </Button>
      </div>
    </div>
  );
}

/** The admin dashboard shell (AppLayout): fixed sidebar on desktop, a sheet on mobile. */
export function SidebarShell(props: ShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMobileOpen(false), [location.pathname]);

  return (
    <div className="flex min-h-svh bg-background">
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 border-r bg-sidebar md:block">
        <SidebarBody {...props} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 bg-sidebar p-0" aria-describedby={undefined}>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarBody {...props} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-card px-4 md:hidden">
          <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
            <Menu />
          </Button>
          <BrandMark to={props.home} />
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
