import { navItems, secondaryNavItems } from "./nav";
import { SidebarShell } from "./SidebarShell";

export function AppLayout() {
  return <SidebarShell home="/app" section="Helpdesk" items={navItems} secondaryItems={secondaryNavItems} />;
}
