import { count, eq, getTableColumns, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { availability, bookings, staff, staffServices, type Staff } from "@/db/schema";
import { bookingConfig } from "@/config/booking";

export type StaffRow = Staff & { serviceCount: number; workingDays: number[] };

export type WeeklyHours = { weekday: number; startMinute: number; endMinute: number }[];

export async function listStaff(): Promise<StaffRow[]> {
  const rows = await db
    .select({
      ...getTableColumns(staff),
      serviceCount: sql<number>`(select count(*) from staff_services ss where ss.staff_id = "staff"."id")`.mapWith(Number),
      workingDays: sql<string | null>`(select group_concat(a.weekday) from availability a where a.staff_id = "staff"."id")`,
    })
    .from(staff)
    .orderBy(staff.name)
    .limit(500);
  return rows.map((r) => ({ ...r, workingDays: r.workingDays ? r.workingDays.split(",").map(Number) : [] }));
}

export async function getStaff(id: number) {
  const [member, services, hours] = await Promise.all([
    db.select().from(staff).where(eq(staff.id, id)).get(),
    db.select({ serviceId: staffServices.serviceId }).from(staffServices).where(eq(staffServices.staffId, id)),
    db
      .select({ weekday: availability.weekday, startMinute: availability.startMinute, endMinute: availability.endMinute })
      .from(availability)
      .where(eq(availability.staffId, id)),
  ]);
  return member ? { ...member, serviceIds: services.map((s) => s.serviceId), hours } : null;
}

export type StaffInput = { name: string; email: string; active: boolean };

/** New staff start with the default working hours, so they can be booked straight away. */
export async function createStaff(input: StaffInput) {
  const [created] = await db.insert(staff).values(input).returning({ id: staff.id });
  const { weekdays, startMinute, endMinute } = bookingConfig.defaultHours;
  await setWeeklyHours(created.id, weekdays.map((weekday) => ({ weekday, startMinute, endMinute })));
  return created.id;
}

export async function updateStaff(id: number, input: StaffInput) {
  await db.update(staff).set(input).where(eq(staff.id, id));
}

/** Replaces the whole set in one batch. */
export async function setStaffServices(staffId: number, serviceIds: number[]) {
  await db.batch([
    db.delete(staffServices).where(eq(staffServices.staffId, staffId)),
    ...serviceIds.map((serviceId) => db.insert(staffServices).values({ staffId, serviceId })),
  ]);
}

/** Replaces the whole week in one batch. Days left out are days off. */
export async function setWeeklyHours(staffId: number, hours: WeeklyHours) {
  await db.batch([
    db.delete(availability).where(eq(availability.staffId, staffId)),
    ...hours.map((h) => db.insert(availability).values({ staffId, ...h })),
  ]);
}

/** Bookings keep their history, so someone with any can only be deactivated. */
export async function deleteStaff(id: number) {
  const [{ n }] = await db.select({ n: count() }).from(bookings).where(eq(bookings.staffId, id));
  if (n > 0) throw new Error("This person has bookings. Deactivate them instead, so those bookings keep their history.");
  await db.batch([
    db.delete(availability).where(eq(availability.staffId, id)),
    db.delete(staffServices).where(eq(staffServices.staffId, id)),
    db.delete(staff).where(eq(staff.id, id)),
  ]);
}
