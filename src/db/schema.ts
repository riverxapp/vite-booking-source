import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";

const createdAt = integer("created_at", { mode: "timestamp" })
  .notNull()
  .$defaultFn(() => new Date());

// Status, priority and role values are plain text keys. Their labels live in
// src/config/helpdesk.ts, so no seed data is needed.

/** Staff: admins and agents. One row per staff login (auth_users). */
export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    authUserId: integer("auth_user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    avatar: text("avatar"),
    role: text("role").notNull().default("agent"),
    createdAt,
  },
  (t) => [uniqueIndex("users_auth_user_idx").on(t.authUserId), uniqueIndex("users_email_idx").on(t.email)],
);

/** People who open tickets. `authUserId` is set once they have a portal login. */
export const customers = sqliteTable(
  "customers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    authUserId: integer("auth_user_id").references(() => authUsers.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    avatar: text("avatar"),
    createdAt,
  },
  (t) => [uniqueIndex("customers_auth_user_idx").on(t.authUserId), uniqueIndex("customers_email_idx").on(t.email), index("customers_name_idx").on(t.name)],
);

export const tickets = sqliteTable(
  "tickets",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    // The number people see (#1042). Assigned by the server when a customer opens a ticket.
    ticketNumber: integer("ticket_number").notNull(),
    subject: text("subject").notNull(),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("open"),
    priority: text("priority").notNull().default("normal"),
    assigneeId: integer("assignee_id").references(() => users.id, { onDelete: "set null" }),
    createdAt,
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    uniqueIndex("tickets_number_idx").on(t.ticketNumber),
    index("tickets_customer_idx").on(t.customerId),
    index("tickets_assignee_idx").on(t.assigneeId),
    index("tickets_status_updated_idx").on(t.status, t.updatedAt),
  ],
);

/**
 * One row per reply or internal note. `senderId` points at customers.id or
 * users.id depending on `senderType`. Internal notes are agent-only: the
 * customer portal API (server/portal.ts) never returns them.
 */
export const messages = sqliteTable(
  "messages",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    ticketId: integer("ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    senderType: text("sender_type").notNull(),
    senderId: integer("sender_id").notNull(),
    message: text("message").notNull(),
    isInternal: integer("is_internal", { mode: "boolean" }).notNull().default(false),
    createdAt,
  },
  (t) => [index("messages_ticket_idx").on(t.ticketId, t.createdAt)],
);

/** Single row (id = 1): the branding shown on the portal, login pages and sidebar. */
export const helpdeskSettings = sqliteTable("helpdesk_settings", {
  id: integer("id").primaryKey(),
  companyName: text("company_name"),
  logoUrl: text("logo_url"),
  // Plain text shown at the top of the customer portal dashboard.
  portalIntro: text("portal_intro"),
});

// Auth tables. Read and written ONLY by the server (server/auth.ts).
// The Data API rejects any SQL that references auth_* tables — never query
// them from src/.
export const authUsers = sqliteTable(
  "auth_users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [uniqueIndex("auth_users_email_idx").on(t.email)],
);

export const authSessions = sqliteTable(
  "auth_sessions",
  {
    // SHA-256 of the session token; the token itself only lives in the cookie.
    id: text("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [index("auth_sessions_user_idx").on(t.userId)],
);

export const authPasswordResets = sqliteTable(
  "auth_password_resets",
  {
    // SHA-256 of the reset token; the token itself is only in the emailed link.
    id: text("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [index("auth_password_resets_user_idx").on(t.userId)],
);

export type User = typeof users.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type HelpdeskSettings = typeof helpdeskSettings.$inferSelect;
