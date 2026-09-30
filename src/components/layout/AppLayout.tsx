import { navItems, secondaryNavItems } from "./nav";
import { SidebarShell } from "./SidebarShell";

export function AppLayout() {
  return <SidebarShell home="/app" section="Booking" items={navItems} secondaryItems={secondaryNavItems} />;
}
