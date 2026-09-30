import type { IncomingMessage, ServerResponse } from "node:http";
import { handleBookingRequest } from "../../server/booking.js";
import { serverEnv } from "../../server/env.js";

// Vercel Node function for /api/booking/:action, the public booking API.
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const handled = await handleBookingRequest(req, res, serverEnv(process.env));
  if (!handled) {
    res.statusCode = 404;
    res.end();
  }
}
