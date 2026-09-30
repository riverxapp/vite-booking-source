import { count, desc, eq, getTableColumns, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { searchColumns, type Page } from "@/db/helpers";
import { customers, type Customer } from "@/db/schema";
import { bookingConfig } from "@/config/booking";

export type CustomerRow = Customer & { bookingCount: number; lastBooking: string | null };

export async function listCustomers({ search, page = 0 }: { search?: string; page?: number }): Promise<Page<CustomerRow>> {
  const where = searchColumns(search, [customers.name, customers.email, customers.phone]);
  const lastBooking = sql<string | null>`(select max(b.date) from bookings b where b.customer_id = "customers"."id")`;
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        ...getTableColumns(customers),
        bookingCount: sql<number>`(select count(*) from bookings b where b.customer_id = "customers"."id")`.mapWith(Number),
        lastBooking,
      })
      .from(customers)
      .where(where)
      // SQLite sorts NULLs first ascending, so customers with no bookings end up last here.
      .orderBy(desc(lastBooking), desc(customers.createdAt))
      .limit(bookingConfig.pageSize)
      .offset(page * bookingConfig.pageSize),
    db.select({ total: count() }).from(customers).where(where),
  ]);
  return { rows, total };
}

export async function getCustomer(id: number) {
  const customer = await db.select().from(customers).where(eq(customers.id, id)).get();
  return customer ?? null;
}
