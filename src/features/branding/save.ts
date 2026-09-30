import { db } from "@/db/client";
import { businessSettings } from "@/db/schema";
import type { Branding } from "./api";

/** Admin-only write through the Data API. Kept apart from ./api.ts so public pages don't load Drizzle. */
export async function saveBranding({ companyName, logoUrl, bookingIntro, timezone }: Omit<Branding, "timezone"> & { timezone: string | null }) {
  const values = { companyName, logoUrl, bookingIntro, timezone };
  await db
    .insert(businessSettings)
    .values({ id: 1, ...values })
    .onConflictDoUpdate({ target: businessSettings.id, set: values });
}
