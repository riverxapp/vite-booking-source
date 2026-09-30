import type { IncomingMessage, ServerResponse } from "node:http";
import { serverEnv } from "../../server/env.js";
import { handlePortalRequest } from "../../server/portal.js";

// Vercel Node function for /api/portal/:action, the customer portal API.
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const handled = await handlePortalRequest(req, res, serverEnv(process.env));
  if (!handled) {
    res.statusCode = 404;
    res.end();
  }
}
