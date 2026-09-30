import { sqliteTable, text, integer, index, uniqueIndex, primaryKey } from "drizzle-orm/sqlite-core";

const createdAt = integer("created_at", { mode: "timestamp" })
  .notNull()
  .$defaultFn(() => new Date());

// Status values are plain text keys. Their labels live in src/config/booking.ts,
// so no seed data is needed.
//
// Booking times are wall-clock times in the business time zone
// (business_settings.timezone): a `date` string (YYYY-MM-DD) plus minutes from
// midnight. Slot maths never has to convert time zones.

/** Admin logins. One row per auth_users row. */
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
    role: text("role").notNull().default("admin"),
    createdAt,
  },
  (t) => [uniqueIndex("users_auth_user_idx").on(t.authUserId), uniqueIndex("users_email_idx").on(t.email)],
);

/** What can be booked. Inactive services stay on old bookings but leave the booking page. */
export const services = sqliteTable(
  "services",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    description: text("description"),
    durationMinutes: integer("duration_minutes").notNull(),
    // Minor units (cents), so prices never go through floating point.
    priceCents: integer("price_cents").notNull().default(0),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt,
  },
  (t) => [index("services_name_idx").on(t.name)],
);

/** The people customers book with. Staff don't log in. */
export const staff = sqliteTable(
  "staff",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt,
  },
  (t) => [index("staff_name_idx").on(t.name)],
);

/** Which services each staff member performs. */
export const staffServices = sqliteTable(
  "staff_services",
  {
    staffId: integer("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    serviceId: integer("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.staffId, t.serviceId] }), index("staff_services_service_idx").on(t.serviceId)],
);

/** Weekly working hours: at most one range per staff member and weekday (0 = Sunday). */
export const availability = sqliteTable(
  "availability",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    staffId: integer("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    weekday: integer("weekday").notNull(),
    startMinute: integer("start_minute").notNull(),
    endMinute: integer("end_minute").notNull(),
  },
  (t) => [uniqueIndex("availability_staff_weekday_idx").on(t.staffId, t.weekday)],
);

/** People who have booked. Matched by email: booking again updates their name and phone. */
export const customers = sqliteTable(
  "customers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    createdAt,
  },
  (t) => [uniqueIndex("customers_email_idx").on(t.email), index("customers_name_idx").on(t.name)],
);

export const bookings = sqliteTable(
  "bookings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    // The code people see ("K7F3QXPA"). Assigned by the server (server/booking.ts).
    reference: text("reference").notNull(),
    serviceId: integer("service_id")
      .notNull()
      .references(() => services.id),
    staffId: integer("staff_id")
      .notNull()
      .references(() => staff.id),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id),
    date: text("date").notNull(),
    startMinute: integer("start_minute").notNull(),
    endMinute: integer("end_minute").notNull(),
    status: text("status").notNull().default("confirmed"),
    notes: text("notes"),
    createdAt,
  },
  (t) => [
    uniqueIndex("bookings_reference_idx").on(t.reference),
    index("bookings_staff_date_idx").on(t.staffId, t.date),
    index("bookings_date_idx").on(t.date, t.startMinute),
    index("bookings_customer_idx").on(t.customerId),
    index("bookings_service_idx").on(t.serviceId),
  ],
);

/** Single row (id = 1): branding, the booking page intro and the business time zone. */
export const businessSettings = sqliteTable("business_settings", {
  id: integer("id").primaryKey(),
  companyName: text("company_name"),
  logoUrl: text("logo_url"),
  // Plain text shown on the landing page and the first booking step.
  bookingIntro: text("booking_intro"),
  // IANA name, e.g. "Europe/London". Availability and bookings are in this zone. Null means UTC.
  timezone: text("timezone"),
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
export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;
export type Staff = typeof staff.$inferSelect;
export type Availability = typeof availability.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type BusinessSettings = typeof businessSettings.$inferSelect;
