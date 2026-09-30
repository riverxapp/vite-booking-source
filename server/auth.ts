import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { promisify } from "node:util";
import { createClient, type Client } from "@libsql/client";
import { sendEmail } from "./email.js";
import type { Env } from "./env.js";
import { clientIp, httpError, nowSeconds, optionalUrl, rateLimit, readCookie, readJson, routeAction, send, sendError, str, validEmail } from "./http.js";

/**
 * Server-side auth for the admin dashboard. Customers book without an account
 * (server/booking.ts); only admins log in. Runs only on the server (Vite
 * middleware in dev, a Vercel function in production) with the private
 * TURSO_* credentials.
 *
 *   POST /api/auth/signup           { name, email, password, code? } → first one needs no code, then ADMIN_SIGNUP_CODE
 *   POST /api/auth/login            { email, password }
 *   POST /api/auth/logout
 *   GET  /api/auth/me
 *   POST /api/auth/forgot-password  { email }
 *   POST /api/auth/reset-password   { token, password }
 *   POST /api/auth/profile          { name, email, avatar }
 *
 * Credentials live in auth_users; the name, email and avatar people see live in
 * `users`. Passwords are scrypt-hashed. Session and reset tokens are random,
 * and only their SHA-256 is stored.
 */

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

const COOKIE = "booking_session";
const SESSION_DAYS = 30;
const RESET_MINUTES = 60;
const MAX_BODY_BYTES = 16 * 1024;

export type Role = "admin";

/** `id` is the auth_users id; `profileId` is the matching users.id. */
export type SessionUser = { id: number; role: Role; profileId: number; name: string; email: string; avatar: string | null };

export const isAdmin = (user: SessionUser | null) => user?.role === "admin";

let client: Client | null = null;
export function getDb(env: Env) {
  if (!env.url) throw httpError(503, "The server is not configured: set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.");
  client ??= createClient({ url: env.url, authToken: env.authToken });
  return client;
}

// --- password + token helpers ------------------------------------------------

async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(password.normalize("NFKC"), salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string) {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password.normalize("NFKC"), Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

// Verifying against a throwaway hash keeps unknown-email logins as slow as real ones.
const DUMMY_HASH = hashPassword("not-a-real-password");

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

function sameSecret(a: string, b: string) {
  const x = Buffer.from(sha256(a));
  const y = Buffer.from(sha256(b));
  return timingSafeEqual(x, y);
}

// --- http helpers -------------------------------------------------------------

const isProduction = () => process.env.NODE_ENV === "production";

function sessionCookie(req: IncomingMessage, token: string, maxAgeSeconds: number) {
  const secure = req.headers["x-forwarded-proto"] === "https" || isProduction();
  return [`${COOKIE}=${encodeURIComponent(token)}`, "Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${maxAgeSeconds}`, secure ? "Secure" : ""]
    .filter(Boolean)
    .join("; ");
}

export function appOrigin(req: IncomingMessage, env: Env) {
  if (env.appUrl) return env.appUrl.replace(/\/$/, "");
  const proto = String(req.headers["x-forwarded-proto"] ?? "http").split(",")[0];
  const host = String(req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost");
  return `${proto}://${host}`;
}

function readCredentials(body: Record<string, unknown>) {
  const name = str(body.name).trim().slice(0, 120);
  const email = str(body.email).trim().toLowerCase();
  const password = str(body.password);
  if (!name) throw httpError(400, "Enter your name.");
  if (!validEmail(email)) throw httpError(400, "Enter a valid email.");
  checkPassword(password);
  return { name, email, password };
}

function checkPassword(password: string) {
  if (password.length < 8 || password.length > 200) throw httpError(400, "Use a password of at least 8 characters.");
}

export const isUniqueViolation = (error: unknown) => /UNIQUE constraint failed/i.test(String((error as Error)?.message));

// --- session store ------------------------------------------------------------

async function createSession(db: Client, authUserId: number) {
  const token = randomBytes(32).toString("base64url");
  const now = nowSeconds();
  await db.execute({
    sql: "insert into auth_sessions (id, user_id, expires_at, created_at) values (?, ?, ?, ?)",
    args: [sha256(token), authUserId, now + SESSION_DAYS * 86400, now],
  });
  return token;
}

const SESSION_USER_SQL = `
  select a.id, a.role, a.email, u.id as profile_id, u.name, u.avatar
  from auth_users a
  join users u on u.auth_user_id = a.id`;

function toSessionUser(row: Record<string, unknown> | undefined): SessionUser | null {
  if (!row || row.profile_id == null) return null;
  return {
    id: Number(row.id),
    role: String(row.role) as Role,
    profileId: Number(row.profile_id),
    name: String(row.name),
    email: String(row.email),
    avatar: row.avatar == null ? null : String(row.avatar),
  };
}

async function userById(db: Client, authUserId: number) {
  const rs = await db.execute({ sql: `${SESSION_USER_SQL} where a.id = ?`, args: [authUserId] });
  return toSessionUser(rs.rows[0] as Record<string, unknown> | undefined);
}

export async function userFromSession(db: Client, req: IncomingMessage): Promise<SessionUser | null> {
  const token = readCookie(req, COOKIE);
  if (!token) return null;
  const rs = await db.execute({
    sql: `${SESSION_USER_SQL} join auth_sessions s on s.user_id = a.id where s.id = ? and s.expires_at > ?`,
    args: [sha256(token), nowSeconds()],
  });
  return toSessionUser(rs.rows[0] as Record<string, unknown> | undefined);
}

async function requireUser(db: Client, req: IncomingMessage) {
  const user = await userFromSession(db, req);
  if (!user) throw httpError(401, "Log in to continue.");
  return user;
}

// --- routes -------------------------------------------------------------------

/** The first account becomes the admin with no code; later ones need ADMIN_SIGNUP_CODE. */
async function signup(db: Client, req: IncomingMessage, res: ServerResponse, env: Env) {
  const body = await readJson(req, MAX_BODY_BYTES);
  rateLimit(`signup:${clientIp(req)}`);
  const count = await db.execute("select count(*) as n from auth_users");
  if (Number(count.rows[0].n) > 0) {
    const code = str(body.code).trim();
    if (!env.adminSignupCode) throw httpError(403, "Signup is closed. Ask your admin to set ADMIN_SIGNUP_CODE and share it with you.");
    if (!code) throw httpError(403, "Enter the team invite code from your admin.");
    if (!sameSecret(code, env.adminSignupCode)) throw httpError(403, "That team invite code is not valid.");
  }

  const { name, email, password } = readCredentials(body);
  const existing = await db.execute({ sql: "select 1 from auth_users where email = ?", args: [email] });
  if (existing.rows.length) throw httpError(409, "An account with this email already exists. Log in instead.");

  // The login and its profile row in one batch.
  const now = nowSeconds();
  const [created] = await db
    .batch(
      [
        { sql: "insert into auth_users (email, password_hash, role, created_at) values (?, ?, 'admin', ?) returning id", args: [email, await hashPassword(password), now] },
        { sql: "insert into users (auth_user_id, name, email, role, created_at) values (last_insert_rowid(), ?, ?, 'admin', ?)", args: [name, email, now] },
      ],
      "write",
    )
    .catch((error) => {
      if (isUniqueViolation(error)) throw httpError(409, "An account with this email already exists. Log in instead.");
      throw error;
    });

  const authUserId = Number(created.rows[0].id);
  const token = await createSession(db, authUserId);
  send(res, 201, { user: await userById(db, authUserId) }, { "Set-Cookie": sessionCookie(req, token, SESSION_DAYS * 86400) });
}

async function login(db: Client, req: IncomingMessage, res: ServerResponse) {
  const body = await readJson(req, MAX_BODY_BYTES);
  const email = str(body.email).trim().toLowerCase();
  const password = str(body.password);
  rateLimit(`login:${clientIp(req)}:${email}`);

  const rs = await db.execute({ sql: "select id, password_hash from auth_users where email = ?", args: [email] });
  const row = rs.rows[0];
  const ok = row ? await verifyPassword(password, String(row.password_hash)) : (await verifyPassword(password, await DUMMY_HASH), false);
  if (!row || !ok) throw httpError(401, "Email or password is incorrect.");

  const user = await userById(db, Number(row.id));
  if (!user) throw httpError(403, "This account has no profile. Ask an admin to check it.");
  const token = await createSession(db, user.id);
  send(res, 200, { user }, { "Set-Cookie": sessionCookie(req, token, SESSION_DAYS * 86400) });
}

async function logout(db: Client, req: IncomingMessage, res: ServerResponse) {
  const token = readCookie(req, COOKIE);
  if (token) await db.execute({ sql: "delete from auth_sessions where id = ?", args: [sha256(token)] });
  send(res, 200, { ok: true }, { "Set-Cookie": sessionCookie(req, "", 0) });
}

async function forgotPassword(db: Client, req: IncomingMessage, res: ServerResponse, env: Env) {
  const body = await readJson(req, MAX_BODY_BYTES);
  const email = str(body.email).trim().toLowerCase();
  rateLimit(`forgot:${clientIp(req)}`, 10);
  if (!validEmail(email)) throw httpError(400, "Enter a valid email.");

  const rs = await db.execute({ sql: "select id from auth_users where email = ?", args: [email] });
  let devResetUrl: string | undefined;
  if (rs.rows[0]) {
    const userId = Number(rs.rows[0].id);
    const token = randomBytes(32).toString("base64url");
    const now = nowSeconds();
    await db.batch(
      [
        { sql: "delete from auth_password_resets where user_id = ?", args: [userId] },
        {
          sql: "insert into auth_password_resets (id, user_id, expires_at, created_at) values (?, ?, ?, ?)",
          args: [sha256(token), userId, now + RESET_MINUTES * 60, now],
        },
      ],
      "write",
    );
    const link = `${appOrigin(req, env)}/reset-password?token=${token}`;
    const text = `Someone asked to reset the password for this account.\n\nChoose a new one here (the link works for ${RESET_MINUTES} minutes):\n${link}\n\nIf it wasn't you, ignore this email.`;
    await sendEmail(env, { to: email, subject: "Reset your password", text }).catch((error) => console.error("[auth] reset email failed", error));
    // Without an email provider the link only reaches the server log, so dev also hands it to the page.
    if (!isProduction()) devResetUrl = link;
  }
  // Same answer whether or not the email exists, so it can't be used to probe accounts.
  send(res, 200, { ok: true, devResetUrl });
}

async function resetPassword(db: Client, req: IncomingMessage, res: ServerResponse) {
  const body = await readJson(req, MAX_BODY_BYTES);
  const token = str(body.token);
  const password = str(body.password);
  rateLimit(`reset:${clientIp(req)}`, 20);
  checkPassword(password);

  const rs = await db.execute({
    sql: "select user_id from auth_password_resets where id = ? and expires_at > ?",
    args: [sha256(token), nowSeconds()],
  });
  if (!token || !rs.rows[0]) throw httpError(400, "This reset link is invalid or has expired. Request a new one.");
  const userId = Number(rs.rows[0].user_id);

  // Signs out every existing session before starting a fresh one.
  await db.batch(
    [
      { sql: "update auth_users set password_hash = ? where id = ?", args: [await hashPassword(password), userId] },
      { sql: "delete from auth_password_resets where user_id = ?", args: [userId] },
      { sql: "delete from auth_sessions where user_id = ?", args: [userId] },
    ],
    "write",
  );
  const user = await userById(db, userId);
  if (!user) throw httpError(403, "This account has no profile. Ask an admin to check it.");
  const session = await createSession(db, userId);
  send(res, 200, { user }, { "Set-Cookie": sessionCookie(req, session, SESSION_DAYS * 86400) });
}

async function updateProfile(db: Client, req: IncomingMessage, res: ServerResponse) {
  const user = await requireUser(db, req);
  const body = await readJson(req, MAX_BODY_BYTES);
  const name = str(body.name).trim().slice(0, 120);
  const email = str(body.email).trim().toLowerCase();
  const avatar = optionalUrl(body.avatar, "Avatar");
  if (!name) throw httpError(400, "Enter your name.");
  if (!validEmail(email)) throw httpError(400, "Enter a valid email.");

  await db
    .batch(
      [
        { sql: "update auth_users set email = ? where id = ?", args: [email, user.id] },
        { sql: "update users set name = ?, email = ?, avatar = ? where auth_user_id = ?", args: [name, email, avatar, user.id] },
      ],
      "write",
    )
    .catch((error) => {
      if (isUniqueViolation(error)) throw httpError(409, "Another account already uses this email.");
      throw error;
    });
  send(res, 200, { user: await userById(db, user.id) });
}

/** Handles /api/auth/:action. Returns false when the path is not an auth route. */
export async function handleAuthRequest(req: IncomingMessage, res: ServerResponse, env: Env): Promise<boolean> {
  const action = routeAction(req, "/api/auth");
  if (!action) return false;

  try {
    const db = getDb(env);
    if (action === "me" && req.method === "GET") send(res, 200, { user: await userFromSession(db, req) });
    else if (req.method !== "POST") throw httpError(405, "Method not allowed");
    else if (action === "signup") await signup(db, req, res, env);
    else if (action === "login") await login(db, req, res);
    else if (action === "logout") await logout(db, req, res);
    else if (action === "forgot-password") await forgotPassword(db, req, res, env);
    else if (action === "reset-password") await resetPassword(db, req, res);
    else if (action === "profile") await updateProfile(db, req, res);
    else throw httpError(404, "Not found");
  } catch (error) {
    sendError(res, error, "auth");
  }
  return true;
}
