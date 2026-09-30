import { bookingConfig } from "@/config/booking";
import { dateValue } from "./dates";

const { locale } = bookingConfig;
const dateFormat = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" });
const dateTimeFormat = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
const relativeFormat = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
// Booking dates and times are wall-clock values: format them in UTC so the viewer's zone never shifts them.
const dayFormat = new Intl.DateTimeFormat(locale, { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const longDayFormat = new Intl.DateTimeFormat(locale, { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
const timeFormat = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
const priceFormat = new Intl.NumberFormat(locale, { style: "currency", currency: bookingConfig.currency });

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 86400],
  ["month", 30 * 86400],
  ["week", 7 * 86400],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

/** Accepts Dates (Drizzle) and ISO strings (booking API). */
type DateLike = Date | string | null | undefined;
const toDate = (date: DateLike) => (date == null ? null : typeof date === "string" ? new Date(date) : date);

export function formatDate(date: DateLike) {
  const d = toDate(date);
  return d ? dateFormat.format(d) : "—";
}

export function formatDateTime(date: DateLike) {
  const d = toDate(date);
  return d ? dateTimeFormat.format(d) : "—";
}

export function formatRelative(date: DateLike) {
  const d = toDate(date);
  if (!d) return "—";
  const seconds = (d.getTime() - Date.now()) / 1000;
  for (const [unit, size] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= size) return relativeFormat.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

/** A booking date ("2026-10-01") → "Thu, Oct 1, 2026", or the long form. */
export function formatDay(date: string | null | undefined, style: "short" | "long" = "short") {
  if (!date) return "—";
  return (style === "long" ? longDayFormat : dayFormat).format(dateValue(date));
}

/** Minutes from midnight → "9:30 AM". */
export function formatTime(minutes: number) {
  return timeFormat.format(new Date(Date.UTC(2000, 0, 1, 0, minutes)));
}

export function formatTimeRange(start: number, end: number) {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? `${h} h` : "", m ? `${m} min` : ""].filter(Boolean).join(" ") || "0 min";
}

export function formatPrice(cents: number) {
  return cents === 0 ? "Free" : priceFormat.format(cents / 100);
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export function likePattern(search: string) {
  return `%${search.trim().replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

export function plural(count: number, word: string, pluralWord = `${word}s`) {
  return `${count.toLocaleString()} ${count === 1 ? word : pluralWord}`;
}

export function errorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}
