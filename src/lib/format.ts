import { helpdeskConfig } from "@/config/helpdesk";

const dateFormat = new Intl.DateTimeFormat(helpdeskConfig.locale, { month: "short", day: "numeric", year: "numeric" });
const dateTimeFormat = new Intl.DateTimeFormat(helpdeskConfig.locale, { dateStyle: "medium", timeStyle: "short" });
const relativeFormat = new Intl.RelativeTimeFormat(helpdeskConfig.locale, { numeric: "auto" });

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 86400],
  ["month", 30 * 86400],
  ["week", 7 * 86400],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

/** Accepts Dates (Drizzle) and ISO strings (portal API). */
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

export function formatTicketNumber(ticketNumber: number) {
  return `#${ticketNumber}`;
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
