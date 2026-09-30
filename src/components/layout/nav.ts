import { Inbox, LayoutDashboard, Settings, Ticket, Users, type IconComponent } from "@/components/icons";

export type NavItem = { to: string; label: string; icon: IconComponent; end?: boolean };

/** Agent dashboard. */
export const navItems: NavItem[] = [
  { to: "/app", label: "Inbox", icon: Inbox, end: true },
  { to: "/app/tickets", label: "All tickets", icon: Ticket },
  { to: "/app/customers", label: "Customers", icon: Users },
];

export const secondaryNavItems: NavItem[] = [{ to: "/app/settings", label: "Settings", icon: Settings }];

/** Customer portal. */
export const portalNavItems: NavItem[] = [
  { to: "/portal", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/portal/tickets", label: "Tickets", icon: Ticket },
];

export const portalSecondaryNavItems: NavItem[] = [{ to: "/portal/settings", label: "Settings", icon: Settings }];
