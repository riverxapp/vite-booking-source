import { Briefcase, CalendarCheck, ExternalLink, Layers, LayoutDashboard, Settings, Users, type IconComponent } from "@/components/icons";

export type NavItem = { to: string; label: string; icon: IconComponent; end?: boolean };

/** Admin dashboard. */
export const navItems: NavItem[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/bookings", label: "Bookings", icon: CalendarCheck },
  { to: "/app/services", label: "Services", icon: Layers },
  { to: "/app/staff", label: "Staff", icon: Briefcase },
  { to: "/app/customers", label: "Customers", icon: Users },
];

export const secondaryNavItems: NavItem[] = [
  { to: "/app/settings", label: "Settings", icon: Settings },
  { to: "/book", label: "Booking page", icon: ExternalLink },
];
