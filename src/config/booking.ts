import { env } from "@/lib/env";

/**
 * Single place to adapt the booking vocabulary.
 * Stored values are the `value` keys: renaming a label is safe, changing a
 * `value` orphans existing rows that use the old key. The server
 * (server/booking.ts) writes "confirmed" for new bookings, and only confirmed
 * bookings block a slot.
 *
 * Scheduling rules (booking window, slot interval, minimum notice) live on the
 * server, in server/slots.ts.
 */

export type Tone = "neutral" | "blue" | "green" | "amber" | "red" | "violet";

export type Option = { value: string; label: string; tone?: Tone };

export const bookingConfig = {
  /** Fallback name until an admin sets the company name in Settings. */
  appName: env.appName,
  locale: "en-US",
  /** ISO 4217 code for service prices. */
  currency: "USD",
  pageSize: 25,

  // V1: a booking is confirmed when it is made; admins can cancel it.
  statuses: [
    { value: "confirmed", label: "Confirmed", tone: "green" },
    { value: "cancelled", label: "Cancelled", tone: "neutral" },
  ] satisfies Option[],

  /** Choices offered in the service form, in minutes. */
  durations: [15, 30, 45, 60, 75, 90, 120, 150, 180, 240],

  /** Index = weekday (0 = Sunday), matching availability.weekday. */
  weekdays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  /** Order of the days in the availability editor. */
  weekStartsOn: 1,

  /** Working hours every new staff member starts with: Monday–Friday, 9 AM–5 PM (minutes from midnight). */
  defaultHours: { weekdays: [1, 2, 3, 4, 5], startMinute: 9 * 60, endMinute: 17 * 60 },
};

export function optionLabel(options: readonly Option[], value: string | null | undefined) {
  if (!value) return "";
  return options.find((o) => o.value === value)?.label ?? value;
}
