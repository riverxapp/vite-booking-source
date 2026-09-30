/**
 * Slot calculation: staff availability + service duration − existing bookings.
 *
 * Pure functions, no I/O. Every date is a "YYYY-MM-DD" string and every time a
 * number of minutes from midnight, both wall-clock in the business time zone.
 */

/** Scheduling rules. Change them here; the booking page reads the result. */
export const BOOKING_RULES = {
  /** How far ahead customers can book, counting today. */
  windowDays: 30,
  /** Slots start every N minutes from the start of the working day. */
  slotIntervalMinutes: 30,
  /** No slot starts sooner than this after now. */
  minNoticeMinutes: 60,
};

export type WorkingHours = { weekday: number; startMinute: number; endMinute: number };
export type BusyRange = { date: string; startMinute: number; endMinute: number };
export type Day = { date: string; times: number[] };

export function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const weekdayOf = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay();

/** Today's date and the current minute in `timeZone`. */
export function nowIn(timeZone: string, at = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, minute: (Number(get("hour")) % 24) * 60 + Number(get("minute")) };
}

export function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

const overlaps = (start: number, end: number, busy: BusyRange) => start < busy.endMinute && end > busy.startMinute;

type SlotInput = {
  hours: WorkingHours[];
  /** Confirmed bookings of this staff member. Cancelled ones must not be passed. */
  busy: BusyRange[];
  durationMinutes: number;
  now: { date: string; minute: number };
  rules?: typeof BOOKING_RULES;
};

/** Free start times on one date. Dates before today, or beyond the window, have none. */
export function slotsForDate(date: string, { hours, busy, durationMinutes, now, rules = BOOKING_RULES }: SlotInput) {
  const offset = Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${now.date}T00:00:00Z`)) / 86_400_000);
  if (offset < 0 || offset >= rules.windowDays || durationMinutes <= 0) return [];

  const working = hours.find((h) => h.weekday === weekdayOf(date));
  if (!working) return [];

  // Minutes from today's midnight, so the notice period can run past midnight.
  const earliest = now.minute + rules.minNoticeMinutes;
  const booked = busy.filter((b) => b.date === date);
  const times: number[] = [];
  for (let start = working.startMinute; start + durationMinutes <= working.endMinute; start += rules.slotIntervalMinutes) {
    if (offset * 1440 + start < earliest) continue;
    const end = start + durationMinutes;
    if (!booked.some((b) => overlaps(start, end, b))) times.push(start);
  }
  return times;
}

/** Every date in the booking window, today first, with its free start times (possibly none). */
export function bookableDays(input: SlotInput): Day[] {
  const windowDays = (input.rules ?? BOOKING_RULES).windowDays;
  return Array.from({ length: windowDays }, (_, i) => {
    const date = addDays(input.now.date, i);
    return { date, times: slotsForDate(date, input) };
  });
}
