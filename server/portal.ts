import type { IncomingMessage, ServerResponse } from "node:http";
import type { Client } from "@libsql/client";
import { getDb, userFromSession, type Env } from "./auth.js";
import { httpError, nowSeconds, queryParam, readJson, routeAction, send, sendError, str } from "./http.js";

/**
 * Customer portal API. Customers never get Data API access; everything they
 * see goes through these routes, which only return their own tickets and never
 * return internal notes.
 *
 *   GET  /api/portal/branding            public: company name, logo, portal intro
 *   GET  /api/portal/tickets             my tickets
 *   POST /api/portal/tickets  { subject, message }
 *   GET  /api/portal/ticket?number=1042  one ticket + its public conversation
 *   POST /api/portal/reply    { number, message }
 */

const MAX_BODY_BYTES = 64 * 1024;
const MAX_SUBJECT = 200;
const MAX_MESSAGE = 20_000;
// First ticket is #1001.
const FIRST_TICKET_NUMBER = 1001;

const toDate = (seconds: unknown) => new Date(Number(seconds) * 1000).toISOString();

async function requireCustomer(db: Client, req: IncomingMessage) {
  const user = await userFromSession(db, req);
  if (!user) throw httpError(401, "Log in to continue.");
  if (user.role !== "customer") throw httpError(403, "The customer portal is for customer accounts.");
  return user;
}

function readMessage(value: unknown) {
  const message = str(value).trim();
  if (!message) throw httpError(400, "Write a message.");
  if (message.length > MAX_MESSAGE) throw httpError(400, `Keep messages under ${MAX_MESSAGE.toLocaleString()} characters.`);
  return message;
}

async function findOwnTicket(db: Client, customerId: number, number: unknown) {
  const ticketNumber = Number(number);
  if (!Number.isInteger(ticketNumber)) throw httpError(400, "Missing ticket number.");
  const rs = await db.execute({
    sql: "select id, ticket_number, subject, status, created_at, updated_at from tickets where ticket_number = ? and customer_id = ?",
    args: [ticketNumber, customerId],
  });
  const row = rs.rows[0];
  if (!row) throw httpError(404, "Ticket not found.");
  return row;
}

async function branding(db: Client, res: ServerResponse) {
  const rs = await db.execute("select company_name, logo_url, portal_intro from helpdesk_settings where id = 1");
  const row = rs.rows[0];
  send(res, 200, { companyName: row?.company_name ?? null, logoUrl: row?.logo_url ?? null, portalIntro: row?.portal_intro ?? null });
}

async function listTickets(db: Client, req: IncomingMessage, res: ServerResponse) {
  const user = await requireCustomer(db, req);
  const rs = await db.execute({
    sql: "select ticket_number, subject, status, created_at, updated_at from tickets where customer_id = ? order by updated_at desc limit 200",
    args: [user.profileId],
  });
  send(res, 200, {
    tickets: rs.rows.map((r) => ({
      ticketNumber: Number(r.ticket_number),
      subject: r.subject,
      status: r.status,
      createdAt: toDate(r.created_at),
      updatedAt: toDate(r.updated_at),
    })),
  });
}

async function createTicket(db: Client, req: IncomingMessage, res: ServerResponse) {
  const user = await requireCustomer(db, req);
  const body = await readJson(req, MAX_BODY_BYTES);
  const subject = str(body.subject).trim();
  if (!subject) throw httpError(400, "Add a subject.");
  if (subject.length > MAX_SUBJECT) throw httpError(400, `Keep the subject under ${MAX_SUBJECT} characters.`);
  const message = readMessage(body.message);
  const now = nowSeconds();

  // One batch = one transaction, so the number can't be taken between the two statements.
  const [created] = await db.batch(
    [
      {
        sql: `insert into tickets (ticket_number, subject, customer_id, status, priority, created_at, updated_at)
              values ((select coalesce(max(ticket_number), ?) + 1 from tickets), ?, ?, 'open', 'normal', ?, ?)
              returning ticket_number`,
        args: [FIRST_TICKET_NUMBER - 1, subject, user.profileId, now, now],
      },
      {
        sql: `insert into messages (ticket_id, sender_type, sender_id, message, is_internal, created_at)
              values (last_insert_rowid(), 'customer', ?, ?, 0, ?)`,
        args: [user.profileId, message, now],
      },
    ],
    "write",
  );
  send(res, 201, { ticketNumber: Number(created.rows[0].ticket_number) });
}

async function getTicket(db: Client, req: IncomingMessage, res: ServerResponse) {
  const user = await requireCustomer(db, req);
  const ticket = await findOwnTicket(db, user.profileId, queryParam(req, "number"));
  const rs = await db.execute({
    sql: `select m.id, m.sender_type, m.message, m.created_at,
                 case m.sender_type when 'agent' then u.name else c.name end as sender_name,
                 case m.sender_type when 'agent' then u.avatar else c.avatar end as sender_avatar
          from messages m
          left join users u on m.sender_type = 'agent' and u.id = m.sender_id
          left join customers c on m.sender_type = 'customer' and c.id = m.sender_id
          where m.ticket_id = ? and m.is_internal = 0
          order by m.created_at, m.id`,
    args: [ticket.id],
  });
  send(res, 200, {
    ticket: {
      ticketNumber: Number(ticket.ticket_number),
      subject: ticket.subject,
      status: ticket.status,
      createdAt: toDate(ticket.created_at),
      updatedAt: toDate(ticket.updated_at),
    },
    messages: rs.rows.map((m) => ({
      id: Number(m.id),
      senderType: m.sender_type,
      senderName: m.sender_name ?? (m.sender_type === "agent" ? "Support" : "You"),
      senderAvatar: m.sender_avatar ?? null,
      message: m.message,
      isInternal: false,
      createdAt: toDate(m.created_at),
    })),
  });
}

async function reply(db: Client, req: IncomingMessage, res: ServerResponse) {
  const user = await requireCustomer(db, req);
  const body = await readJson(req, MAX_BODY_BYTES);
  const ticket = await findOwnTicket(db, user.profileId, body.number);
  const message = readMessage(body.message);
  const now = nowSeconds();
  // A customer reply puts a pending or resolved ticket back in front of the team.
  await db.batch(
    [
      {
        sql: "insert into messages (ticket_id, sender_type, sender_id, message, is_internal, created_at) values (?, 'customer', ?, ?, 0, ?)",
        args: [ticket.id, user.profileId, message, now],
      },
      { sql: "update tickets set status = 'open', updated_at = ? where id = ?", args: [now, ticket.id] },
    ],
    "write",
  );
  send(res, 201, { ok: true });
}

/** Handles /api/portal/:action. Returns false when the path is not a portal route. */
export async function handlePortalRequest(req: IncomingMessage, res: ServerResponse, env: Env): Promise<boolean> {
  const action = routeAction(req, "/api/portal");
  if (!action) return false;

  try {
    const db = getDb(env);
    const route = `${req.method} ${action}`;
    if (route === "GET branding") await branding(db, res);
    else if (route === "GET tickets") await listTickets(db, req, res);
    else if (route === "POST tickets") await createTicket(db, req, res);
    else if (route === "GET ticket") await getTicket(db, req, res);
    else if (route === "POST reply") await reply(db, req, res);
    else throw httpError(404, "Not found");
  } catch (error) {
    sendError(res, error, "portal");
  }
  return true;
}
