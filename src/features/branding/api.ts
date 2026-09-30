import { db } from "@/db/client";
import { businessSettings } from "@/db/schema";
import { apiRequest } from "@/lib/api";

export type Branding = { companyName: string | null; logoUrl: string | null; bookingIntro: string | null; timezone: string };

/** Public: the booking page, login pages and sidebar all read it, signed in or not. */
export async function fetchBranding() {
  return apiRequest<Branding>("booking/branding");
}

/** Admin-only write through the Data API. */
export async function saveBranding({ companyName, logoUrl, bookingIntro, timezone }: Omit<Branding, "timezone"> & { timezone: string | null }) {
  const values = { companyName, logoUrl, bookingIntro, timezone };
  await db
    .insert(businessSettings)
    .values({ id: 1, ...values })
    .onConflictDoUpdate({ target: businessSettings.id, set: values });
}
