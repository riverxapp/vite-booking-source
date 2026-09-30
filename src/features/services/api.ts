import { count, eq, getTableColumns, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { bookings, services, staffServices, type NewService, type Service } from "@/db/schema";

export type ServiceRow = Service & { staffCount: number };

/** A business has a handful of services, so the list is not paginated. */
export async function listServices(): Promise<ServiceRow[]> {
  return db
    .select({
      ...getTableColumns(services),
      staffCount: sql<number>`(select count(*) from staff_services ss where ss.service_id = "services"."id")`.mapWith(Number),
    })
    .from(services)
    .orderBy(services.name)
    .limit(500);
}

export type ServiceInput = Pick<NewService, "name" | "description" | "durationMinutes" | "priceCents" | "active">;

export async function createService(input: ServiceInput) {
  await db.insert(services).values(input);
}

export async function updateService(id: number, input: ServiceInput) {
  await db.update(services).set(input).where(eq(services.id, id));
}

/** Bookings keep their history, so a service that has any can only be hidden. */
export async function deleteService(id: number) {
  const [{ n }] = await db.select({ n: count() }).from(bookings).where(eq(bookings.serviceId, id));
  if (n > 0) throw new Error("This service has bookings. Set it to hidden instead, so they keep their history.");
  await db.batch([db.delete(staffServices).where(eq(staffServices.serviceId, id)), db.delete(services).where(eq(services.id, id))]);
}
