import { and, count, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { searchColumns, type Page } from "@/db/helpers";
import { customers, messages, tickets, users } from "@/db/schema";
import { activeStatuses, helpdeskConfig } from "@/config/helpdesk";
import type { ThreadMessage } from "./types";

export type TicketScope = "inbox" | "all";

export type TicketFilters = {
  scope: TicketScope;
  /** The signed-in agent's users.id: the Inbox and the "Me" assignee filter use it. */
  meId: number;
  search?: string;
  status?: string;
  priority?: string;
  /** "", "me", "unassigned" or a users.id. */
  assignee?: string;
  page?: number;
};

const ticketColumns = {
  id: tickets.id,
  ticketNumber: tickets.ticketNumber,
  subject: tickets.subject,
  status: tickets.status,
  priority: tickets.priority,
  createdAt: tickets.createdAt,
  updatedAt: tickets.updatedAt,
  customerId: tickets.customerId,
  customerName: customers.name,
  customerEmail: customers.email,
  customerAvatar: customers.avatar,
  assigneeId: tickets.assigneeId,
  assigneeName: users.name,
};

export type TicketRow = {
  id: number;
  ticketNumber: number;
  subject: string;
  status: string;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
  customerId: number;
  customerName: string;
  customerEmail: string;
  customerAvatar: string | null;
  assigneeId: number | null;
  assigneeName: string | null;
};

function assigneeFilter(assignee: string | undefined, meId: number) {
  if (!assignee) return undefined;
  if (assignee === "me") return eq(tickets.assigneeId, meId);
  if (assignee === "unassigned") return isNull(tickets.assigneeId);
  return eq(tickets.assigneeId, Number(assignee));
}

export async function listTickets({ scope, meId, search, status, priority, assignee, page = 0 }: TicketFilters): Promise<Page<TicketRow>> {
  const where = and(
    // Inbox: still needs work, and is mine or nobody's.
    scope === "inbox" ? and(inArray(tickets.status, activeStatuses), or(eq(tickets.assigneeId, meId), isNull(tickets.assigneeId))) : undefined,
    status ? eq(tickets.status, status) : undefined,
    priority ? eq(tickets.priority, priority) : undefined,
    assigneeFilter(assignee, meId),
    searchColumns(search?.replace(/^\s*#/, ""), [tickets.subject, customers.name, customers.email, sql`cast(${tickets.ticketNumber} as text)`]),
  );
  const [rows, [{ total }]] = await Promise.all([
    db
      .select(ticketColumns)
      .from(tickets)
      .innerJoin(customers, eq(customers.id, tickets.customerId))
      .leftJoin(users, eq(users.id, tickets.assigneeId))
      .where(where)
      .orderBy(desc(tickets.updatedAt))
      .limit(helpdeskConfig.pageSize)
      .offset(page * helpdeskConfig.pageSize),
    db.select({ total: count() }).from(tickets).innerJoin(customers, eq(customers.id, tickets.customerId)).where(where),
  ]);
  return { rows, total };
}

export async function getTicketByNumber(ticketNumber: number): Promise<TicketRow | null> {
  const row = await db
    .select(ticketColumns)
    .from(tickets)
    .innerJoin(customers, eq(customers.id, tickets.customerId))
    .leftJoin(users, eq(users.id, tickets.assigneeId))
    .where(eq(tickets.ticketNumber, ticketNumber))
    .get();
  return row ?? null;
}

/** The full thread, internal notes included. Agents only. */
export async function listMessages(ticketId: number): Promise<ThreadMessage[]> {
  const rows = await db
    .select({
      id: messages.id,
      senderType: messages.senderType,
      message: messages.message,
      isInternal: messages.isInternal,
      createdAt: messages.createdAt,
      agentName: users.name,
      agentAvatar: users.avatar,
      customerName: customers.name,
      customerAvatar: customers.avatar,
    })
    .from(messages)
    .leftJoin(users, and(eq(messages.senderType, "agent"), eq(users.id, messages.senderId)))
    .leftJoin(customers, and(eq(messages.senderType, "customer"), eq(customers.id, messages.senderId)))
    .where(eq(messages.ticketId, ticketId))
    .orderBy(messages.createdAt, messages.id);
  return rows.map((m) => {
    const agent = m.senderType === "agent";
    return {
      id: m.id,
      senderType: agent ? "agent" : "customer",
      senderName: (agent ? m.agentName : m.customerName) ?? (agent ? "Former agent" : "Customer"),
      senderAvatar: (agent ? m.agentAvatar : m.customerAvatar) ?? null,
      message: m.message,
      isInternal: m.isInternal,
      createdAt: m.createdAt,
    };
  });
}

export type TicketPatch = { status?: string; priority?: string; assigneeId?: number | null };

export async function updateTicket(id: number, patch: TicketPatch) {
  await db.update(tickets).set(patch).where(eq(tickets.id, id));
}

/** A reply (visible to the customer) or an internal note (agents only). */
export async function addAgentMessage({ ticketId, agentId, message, isInternal }: { ticketId: number; agentId: number; message: string; isInternal: boolean }) {
  await db.batch([
    db.insert(messages).values({ ticketId, senderType: "agent", senderId: agentId, message, isInternal }),
    db.update(tickets).set({ updatedAt: new Date() }).where(eq(tickets.id, ticketId)),
  ]);
}
