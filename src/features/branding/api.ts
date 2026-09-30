import { apiRequest } from "@/lib/api";

export type Branding = { companyName: string | null; logoUrl: string | null; bookingIntro: string | null; timezone: string };

/**
 * Public: the booking page, login pages and sidebar all read it, signed in or not.
 * The admin-only write lives in ./save.ts, so public pages never load Drizzle.
 */
export async function fetchBranding() {
  return apiRequest<Branding>("booking/branding");
}
