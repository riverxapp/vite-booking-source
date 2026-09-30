import { portalNavItems, portalSecondaryNavItems } from "./nav";
import { SidebarShell } from "./SidebarShell";

/** Customer portal shell: the same sidebar as the agent dashboard, with the customer's own nav. */
export function PortalLayout() {
  return <SidebarShell home="/portal" section="Support" items={portalNavItems} secondaryItems={portalSecondaryNavItems} />;
}
