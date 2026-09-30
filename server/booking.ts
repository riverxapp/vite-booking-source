import { randomInt } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Client, Row } from "@libsql/client";
import { appOrigin, getDb, isUniqueViolation } from "./auth.js";
import { confirmationEmail, sendEmail } from "./email.js";
import type { Env } from "./env.js";
import { clientIp, httpError, nowSeconds, queryParam, rateLimit, readJson, routeAction, send, sendError, str, validEmail } from "./http.js";
import { addDays, BOOKING_RULES, bookableDays, isValidTimeZone, nowIn, slotsForDate } from "./slots.js";

/**
 * Public booking API: no login. Customers never get Data API access; the
 * booking page reads and writes only through these fixed queries.
 *
 *   GET  /api/booking/branding                 company name, logo, booking intro, time zone
 *   GET  /api/booking/services                 active services someone can perform
 *   GET  /api/booking/staff?service=1          active staff for a service
 *   GET  /api/booking/slots?service=1&staff=2  { timezone, days: [{ date, times }] } for the booking window
 *   POST /api/booking/bookings  { serviceId, staffId, date, startMinute, name, email, phone, notes? }
 */

const MAX_BODY_BYTES = 16 * 1024;
const MAX_NOTES = 1000;
// No 0/O or 1/I, so references survive being read out over the phone.
const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const newReference = () => Array.from({ length: 8 }, () => REFERENCE_ALPHABET[randomInt(REFERENCE_ALPHABET.length)]).join("");

function id(value: unknown, label: string) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw httpError(400, `Choose a ${label}.`);
  return n;
}

function readSettings(row: Row | undefined) {
  const timezone = row?.timezone ? String(row.timezone) : "UTC";
  return {
    companyName: row?.company_name == null ? null : String(row.company_name),
    logoUrl: row?.logo_url == null ? null : String(row.logo_url),
    bookingIntro: row?.booking_intro == null ? null : String(row.booking_intro),
    timezone: isValidTimeZone(timezone) ? timezone : "UTC",
  };
}

const SETTINGS_SQL = "select company_name, logo_url, booking_intro, timezone from business_settings where id = 1";

/**
 * Everything needed to compute slots for one service + staff pair, in one round trip.
 * `onDate` narrows the bookings read to that one date (creating a booking needs no more).
 */
async function loadBookable(db: Client, serviceId: number, staffId: number, onDate?: string) {
  // Any zone's "today" is within a day of UTC's, so this range covers the window everywhere.
  const utcToday = nowIn("UTC").date;
  const [from, to] = onDate ? [onDate, onDate] : [addDays(utcToday, -1), addDays(utcToday, BOOKING_RULES.windowDays + 1)];
  const [service, member, hours, busy, settings] = await db.batch(
    [
      { sql: "select id, name, duration_minutes, price_cents from services where id = ? and active = 1", args: [serviceId] },
      {
        sql: `select st.id, st.name from staff st join staff_services ss on ss.staff_id = st.id
              where st.id = ? and ss.service_id = ? and st.active = 1`,
        args: [staffId, serviceId],
      },
      { sql: "select weekday, start_minute, end_minute from availability where staff_id = ?", args: [staffId] },
      {
        sql: "select date, start_minute, end_minute from bookings where staff_id = ? and status = 'confirmed' and date between ? and ?",
        args: [staffId, from, to],
      },
      SETTINGS_SQL,
    ],
    "read",
  );
  const s = service.rows[0];
  if (!s) throw httpError(404, "This service is not available.");
  const m = member.rows[0];
  if (!m) throw httpError(404, "This person doesn't offer that service.");

  const { timezone, companyName } = readSettings(settings.rows[0]);
  return {
    service: { id: Number(s.id), name: String(s.name), durationMinutes: Number(s.duration_minutes), priceCents: Number(s.price_cents) },
    staff: { id: Number(m.id), name: String(m.name) },
    timezone,
    companyName,
    input: {
      hours: hours.rows.map((r) => ({ weekday: Number(r.weekday), startMinute: Number(r.start_minute), endMinute: Number(r.end_minute) })),
      busy: busy.rows.map((r) => ({ date: String(r.date), startMinute: Number(r.start_minute), endMinute: Number(r.end_minute) })),
      durationMinutes: Number(s.duration_minutes),
      now: nowIn(timezone),
    },
  };
}

async function branding(db: Client, res: ServerResponse) {
  const rs = await db.execute(SETTINGS_SQL);
  send(res, 200, readSettings(rs.rows[0]));
}

async function listServices(db: Client, res: ServerResponse) {
  const rs = await db.execute(`
    select s.id, s.name, s.description, s.duration_minutes, s.price_cents
    from services s
    where s.active = 1
      and exists (select 1 from staff_services ss join staff st on st.id = ss.staff_id where ss.service_id = s.id and st.active = 1)
    order by s.name`);
  send(res, 200, {
    services: rs.rows.map((r) => ({
      id: Number(r.id),
      name: String(r.name),
      description: r.description == null ? null : String(r.description),
      durationMinutes: Number(r.duration_minutes),
      priceCents: Number(r.price_cents),
    })),
  });
}

async function listStaff(db: Client, req: IncomingMessage, res: ServerResponse) {
  const serviceId = id(queryParam(req, "service"), "service");
  const rs = await db.execute({
    sql: `select st.id, st.name from staff st join staff_services ss on ss.staff_id = st.id
          where ss.service_id = ? and st.active = 1 order by st.name`,
    args: [serviceId],
  });
  send(res, 200, { staff: rs.rows.map((r) => ({ id: Number(r.id), name: String(r.name) })) });
}

async function slots(db: Client, req: IncomingMessage, res: ServerResponse) {
  const ctx = await loadBookable(db, id(queryParam(req, "service"), "service"), id(queryParam(req, "staff"), "staff member"));
  send(res, 200, { timezone: ctx.timezone, days: bookableDays(ctx.input) });
}

function readBooking(body: Record<string, unknown>) {
  const date = str(body.date);
  const startMinute = Number(body.startMinute);
  const name = str(body.name).trim().slice(0, 120);
  const email = str(body.email).trim().toLowerCase();
  const phone = str(body.phone).trim();
  const notes = str(body.notes).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw httpError(400, "Choose a date.");
  if (!Number.isInteger(startMinute) || startMinute < 0 || startMinute >= 1440) throw httpError(400, "Choose a time.");
  if (!name) throw httpError(400, "Enter your name.");
  if (!validEmail(email)) throw httpError(400, "Enter a valid email.");
  if (phone.length > 40 || !/^[\d\s()+.-]+$/.test(phone) || phone.replace(/\D/g, "").length < 7) throw httpError(400, "Enter a valid phone number.");
  if (notes.length > MAX_NOTES) throw httpError(400, `Keep notes under ${MAX_NOTES.toLocaleString()} characters.`);
  return { serviceId: id(body.serviceId, "service"), staffId: id(body.staffId, "staff member"), date, startMinute, name, email, phone, notes: notes || null };
}

const SLOT_TAKEN = "That time was just taken. Pick another one.";

async function createBooking(db: Client, req: IncomingMessage, res: ServerResponse, env: Env) {
  rateLimit(`book:${clientIp(req)}`, 20);
  const input = readBooking(await readJson(req, MAX_BODY_BYTES));
  const ctx = await loadBookable(db, input.serviceId, input.staffId, input.date);
  if (!slotsForDate(input.date, ctx.input).includes(input.startMinute)) throw httpError(409, SLOT_TAKEN);

  const endMinute = input.startMinute + ctx.service.durationMinutes;
  const now = nowSeconds();
  let reference = "";
  for (let attempt = 0; !reference; attempt++) {
    const candidate = newReference();
    try {
      // One batch = one transaction. The insert only happens if no confirmed
      // booking overlaps, so two people can't take the same slot at once.
      const [, inserted] = await db.batch(
        [
          {
            sql: `insert into customers (name, email, phone, created_at) values (?, ?, ?, ?)
                  on conflict (email) do update set name = excluded.name, phone = excluded.phone`,
            args: [input.name, input.email, input.phone, now],
          },
          {
            sql: `insert into bookings (reference, service_id, staff_id, customer_id, date, start_minute, end_minute, status, notes, created_at)
                  select ?, ?, ?, (select id from customers where email = ?), ?, ?, ?, 'confirmed', ?, ?
                  where not exists (
                    select 1 from bookings
                    where staff_id = ? and date = ? and status = 'confirmed' and start_minute < ? and end_minute > ?
                  )
                  returning reference`,
            args: [
              candidate, input.serviceId, input.staffId, input.email, input.date, input.startMinute, endMinute, input.notes, now,
              input.staffId, input.date, endMinute, input.startMinute,
            ],
          },
        ],
        "write",
      );
      if (!inserted.rows[0]) throw httpError(409, SLOT_TAKEN);
      reference = candidate;
    } catch (error) {
      // A reference collision is astronomically rare; one retry settles it.
      if (!isUniqueViolation(error) || attempt > 0) throw error;
    }
  }

  const business = ctx.companyName || "RiverX Booking";
  const email = confirmationEmail({
    business,
    customerName: input.name,
    reference,
    serviceName: ctx.service.name,
    staffName: ctx.staff.name,
    date: input.date,
    startMinute: input.startMinute,
    endMinute,
    timezone: ctx.timezone,
    bookAgainUrl: `${appOrigin(req, env)}/book`,
  });
  // The booking stands even if the email fails; the page shows the reference either way.
  const emailSent = await sendEmail(env, { to: input.email, ...email }).catch((error) => {
    console.error("[booking] confirmation email failed", error);
    return false;
  });

  send(res, 201, {
    booking: {
      reference,
      serviceName: ctx.service.name,
      staffName: ctx.staff.name,
      date: input.date,
      startMinute: input.startMinute,
      endMinute,
      durationMinutes: ctx.service.durationMinutes,
      priceCents: ctx.service.priceCents,
      customerName: input.name,
      email: input.email,
      timezone: ctx.timezone,
    },
    emailSent,
  });
}

/** Handles /api/booking/:action. Returns false when the path is not a booking route. */
export async function handleBookingRequest(req: IncomingMessage, res: ServerResponse, env: Env): Promise<boolean> {
  const action = routeAction(req, "/api/booking");
  if (!action) return false;

  try {
    const db = getDb(env);
    const route = `${req.method} ${action}`;
    if (route === "GET branding") await branding(db, res);
    else if (route === "GET services") await listServices(db, res);
    else if (route === "GET staff") await listStaff(db, req, res);
    else if (route === "GET slots") await slots(db, req, res);
    else if (route === "POST bookings") await createBooking(db, req, res, env);
    else throw httpError(404, "Not found");
  } catch (error) {
    sendError(res, error, "booking");
  }
  return true;
}
