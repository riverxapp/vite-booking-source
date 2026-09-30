import { db } from "@/db/client";
import { helpdeskSettings } from "@/db/schema";
import { apiRequest } from "@/lib/api";

export type Branding = { companyName: string | null; logoUrl: string | null; portalIntro: string | null };

/** Public: the portal, login pages and sidebar all read it, signed in or not. */
export async function fetchBranding() {
  return apiRequest<Branding>("portal/branding");
}

/** Staff-only write through the Data API. The UI offers it to admins. */
export async function saveBranding({ companyName, logoUrl, portalIntro }: Branding) {
  await db
    .insert(helpdeskSettings)
    .values({ id: 1, companyName, logoUrl, portalIntro })
    .onConflictDoUpdate({ target: helpdeskSettings.id, set: { companyName, logoUrl, portalIntro } });
}
