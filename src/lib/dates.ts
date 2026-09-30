/**
 * Calendar-day helpers for booking dates ("YYYY-MM-DD" strings in the business
 * time zone) and times (minutes from midnight). All arithmetic runs in UTC so
 * the viewer's own time zone never shifts a day.
 */

const toUtc = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

export const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export function addDays(date: string, days: number) {
  const d = toUtc(date);
  d.setUTCDate(d.getUTCDate() + days);
  return isoDate(d);
}

/** 0 = Sunday. */
export const weekdayOf = (date: string) => toUtc(date).getUTCDay();

/** A booking date as a Date at UTC midnight, for Intl formatting with timeZone "UTC". */
export const dateValue = (date: string) => toUtc(date);

/** Today's date and the current minute in a time zone. Falls back to UTC for an unknown zone. */
export function nowIn(timeZone: string | null | undefined, at = new Date()) {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = zoneFormat(timeZone || "UTC").formatToParts(at);
  } catch {
    parts = zoneFormat("UTC").formatToParts(at);
  }
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, minute: (Number(get("hour")) % 24) * 60 + Number(get("minute")) };
}

const zoneFormat = (timeZone: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

export function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** "09:30" ↔ 570, for <input type="time">. */
export const minutesToInput = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

export function inputToMinutes(value: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}
