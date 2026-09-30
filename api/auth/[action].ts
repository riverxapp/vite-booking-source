import type { IncomingMessage, ServerResponse } from "node:http";
import { handleAuthRequest } from "../../server/auth.js";
import { serverEnv } from "../../server/env.js";

// Vercel Node function for /api/auth/:action. Set TURSO_DATABASE_URL and
// TURSO_AUTH_TOKEN (server-only, no VITE_ prefix) in the project's env.
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const handled = await handleAuthRequest(req, res, serverEnv(process.env));
  if (!handled) {
    res.statusCode = 404;
    res.end();
  }
}
