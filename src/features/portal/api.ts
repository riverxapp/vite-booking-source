import { apiRequest } from "@/lib/api";
import type { ThreadMessage } from "@/features/tickets/types";

/** Customer portal calls (server/portal.ts). Dates arrive as ISO strings. */

export type PortalTicket = { ticketNumber: number; subject: string; status: string; createdAt: string; updatedAt: string };
export type PortalTicketDetail = { ticket: PortalTicket; messages: ThreadMessage[] };

export async function listMyTickets() {
  const { tickets } = await apiRequest<{ tickets: PortalTicket[] }>("portal/tickets");
  return tickets;
}

export async function getMyTicket(ticketNumber: number) {
  return apiRequest<PortalTicketDetail>(`portal/ticket?number=${ticketNumber}`);
}

export async function createTicket(input: { subject: string; message: string }) {
  return apiRequest<{ ticketNumber: number }>("portal/tickets", { method: "POST", body: input });
}

export async function replyToTicket(ticketNumber: number, message: string) {
  await apiRequest("portal/reply", { method: "POST", body: { number: ticketNumber, message } });
}
