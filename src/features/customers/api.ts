import { count, desc, eq, getTableColumns, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { searchColumns, type Page } from "@/db/helpers";
import { customers, tickets, type Customer } from "@/db/schema";
import { helpdeskConfig } from "@/config/helpdesk";

export type CustomerRow = Customer & { ticketCount: number; lastActivity: Date | null };

const fromSeconds = (value: unknown) => (value == null ? null : new Date(Number(value) * 1000));

export async function listCustomers({ search, page = 0 }: { search?: string; page?: number }): Promise<Page<CustomerRow>> {
  const where = searchColumns(search, [customers.name, customers.email]);
  const lastActivity = sql`(select max(t.updated_at) from tickets t where t.customer_id = "customers"."id")`;
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        ...getTableColumns(customers),
        ticketCount: sql<number>`(select count(*) from tickets t where t.customer_id = "customers"."id")`.mapWith(Number),
        lastActivity: sql<Date | null>`${lastActivity}`.mapWith(fromSeconds),
      })
      .from(customers)
      .where(where)
      // SQLite sorts NULLs first ascending, so customers with no tickets end up last here.
      .orderBy(desc(lastActivity), desc(customers.createdAt))
      .limit(helpdeskConfig.pageSize)
      .offset(page * helpdeskConfig.pageSize),
    db.select({ total: count() }).from(customers).where(where),
  ]);
  return { rows, total };
}

export async function getCustomer(id: number) {
  const customer = await db.select().from(customers).where(eq(customers.id, id)).get();
  return customer ?? null;
}

export async function listCustomerTickets(customerId: number) {
  return db
    .select({
      id: tickets.id,
      ticketNumber: tickets.ticketNumber,
      subject: tickets.subject,
      status: tickets.status,
      priority: tickets.priority,
      updatedAt: tickets.updatedAt,
    })
    .from(tickets)
    .where(eq(tickets.customerId, customerId))
    .orderBy(desc(tickets.updatedAt))
    .limit(200);
}
