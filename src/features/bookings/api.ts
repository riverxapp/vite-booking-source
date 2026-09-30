import { and, asc, count, desc, eq, gte, lt, lte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { searchColumns, type Page } from "@/db/helpers";
import { bookings, customers, services, staff } from "@/db/schema";
import { bookingConfig } from "@/config/booking";

export type BookingRow = {
  id: number;
  reference: string;
  date: string;
  startMinute: number;
  endMinute: number;
  status: string;
  notes: string | null;
  createdAt: Date;
  serviceId: number;
  serviceName: string;
  priceCents: number;
  staffId: number;
  staffName: string;
  customerId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
};

const bookingColumns = {
  id: bookings.id,
  reference: bookings.reference,
  date: bookings.date,
  startMinute: bookings.startMinute,
  endMinute: bookings.endMinute,
  status: bookings.status,
  notes: bookings.notes,
  createdAt: bookings.createdAt,
  serviceId: bookings.serviceId,
  serviceName: services.name,
  priceCents: services.priceCents,
  staffId: bookings.staffId,
  staffName: staff.name,
  customerId: bookings.customerId,
  customerName: customers.name,
  customerEmail: customers.email,
  customerPhone: customers.phone,
};

const joined = () =>
  db
    .select(bookingColumns)
    .from(bookings)
    .innerJoin(services, eq(services.id, bookings.serviceId))
    .innerJoin(staff, eq(staff.id, bookings.staffId))
    .innerJoin(customers, eq(customers.id, bookings.customerId));

/** "upcoming" includes the rest of today. */
export type BookingWhen = "upcoming" | "past" | "all";

export type BookingFilters = {
  when: BookingWhen;
  /** Today in the business time zone. */
  today: string;
  search?: string;
  status?: string;
  staffId?: number;
  serviceId?: number;
  customerId?: number;
  page?: number;
  pageSize?: number;
};

export async function listBookings({ when, today, search, status, staffId, serviceId, customerId, page = 0, pageSize = bookingConfig.pageSize }: BookingFilters): Promise<Page<BookingRow>> {
  const where = and(
    when === "upcoming" ? gte(bookings.date, today) : when === "past" ? lt(bookings.date, today) : undefined,
    status ? eq(bookings.status, status) : undefined,
    staffId ? eq(bookings.staffId, staffId) : undefined,
    serviceId ? eq(bookings.serviceId, serviceId) : undefined,
    customerId ? eq(bookings.customerId, customerId) : undefined,
    searchColumns(search, [bookings.reference, customers.name, customers.email, customers.phone]),
  );
  // Upcoming reads like a diary (soonest first); history reads newest first.
  const order = when === "upcoming" ? [asc(bookings.date), asc(bookings.startMinute)] : [desc(bookings.date), desc(bookings.startMinute)];
  const [rows, [{ total }]] = await Promise.all([
    joined().where(where).orderBy(...order).limit(pageSize).offset(page * pageSize),
    db.select({ total: count() }).from(bookings).innerJoin(customers, eq(customers.id, bookings.customerId)).where(where),
  ]);
  return { rows, total };
}

export async function getBookingByReference(reference: string): Promise<BookingRow | null> {
  const row = await joined().where(eq(bookings.reference, reference)).get();
  return row ?? null;
}

/** V1 has two statuses and one move: confirmed → cancelled. Cancelling frees the slot. */
export async function cancelBooking(id: number) {
  await db.update(bookings).set({ status: "cancelled" }).where(eq(bookings.id, id));
}

/** Confirmed bookings between two dates (inclusive), soonest first. For the dashboard. */
export async function listConfirmedBetween(from: string, to: string) {
  return joined()
    .where(and(eq(bookings.status, "confirmed"), gte(bookings.date, from), lte(bookings.date, to)))
    .orderBy(asc(bookings.date), asc(bookings.startMinute))
    .limit(1000);
}

export async function countBookings({ from, to, status }: { from?: string; to?: string; status?: string }) {
  const [{ n }] = await db
    .select({ n: count() })
    .from(bookings)
    .where(and(from ? gte(bookings.date, from) : undefined, to ? lte(bookings.date, to) : undefined, status ? eq(bookings.status, status) : undefined));
  return n;
}

/** Just ids and names for the list filters: no counts, no per-row subqueries. */
export async function listFilterOptions() {
  const [staffRows, serviceRows] = await Promise.all([
    db.select({ value: staff.id, label: staff.name }).from(staff).orderBy(staff.name).limit(500),
    db.select({ value: services.id, label: services.name }).from(services).orderBy(services.name).limit(500),
  ]);
  const toOptions = (rows: { value: number; label: string }[]) => rows.map((r) => ({ value: String(r.value), label: r.label }));
  return { staff: toOptions(staffRows), services: toOptions(serviceRows) };
}

export async function countCustomers() {
  const [{ n }] = await db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(customers);
  return n;
}
