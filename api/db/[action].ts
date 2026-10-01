import type { IncomingMessage, ServerResponse } from "node:http";
import { getDb, isAdmin, userFromSession } from "../../server/auth.js";
import { handleDbRequest, send } from "../../server/db.js";
import { serverEnv } from "../../server/env.js";
import { sendError } from "../../server/http.js";

// Vercel Node function for /api/db/:action — the Data API for every production
// build, including apps published from RiverX. Requires an admin session; the public booking
// page uses /api/booking/* instead.
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const action = (req.url ?? "").split("?")[0].match(/^\/api\/db\/([a-z]+)\/?$/)?.[1] ?? "";
  try {
    const db = getDb(serverEnv(process.env));
    const user = await userFromSession(db, req);
    if (!user) return send(res, 401, { error: "Log in to continue.", code: "unauthorized" });
    if (!isAdmin(user)) return send(res, 403, { error: "Only admins can use the Data API.", code: "forbidden" });
    await handleDbRequest(db, action, req, res, "vercel-function");
  } catch (error) {
    sendError(res, error, "db");
  }
}
