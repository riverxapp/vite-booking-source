import type { Plugin } from "vite";
import { handleAuthRequest } from "../server/auth";
import { handleBookingRequest } from "../server/booking";
import type { Env } from "../server/env";
import { loadServerEnv } from "./local-db-proxy";

type Req = Parameters<typeof handleAuthRequest>[0];
type Res = Parameters<typeof handleAuthRequest>[1];

/**
 * Serves the auth API (/api/auth/*) and the public booking API (/api/booking/*)
 * from the Vite dev and preview servers, so they work locally exactly as they
 * do behind the Vercel functions.
 */
export function localApi(): Plugin {
  let env: Env = {};

  const middleware = (req: Req, res: Res, next: () => void) => {
    const handler = req.url?.startsWith("/api/auth/") ? handleAuthRequest : req.url?.startsWith("/api/booking/") ? handleBookingRequest : null;
    if (!handler) return next();
    handler(req, res, env).then((handled) => {
      if (!handled) next();
    }, next);
  };

  return {
    name: "local-api",
    config(_, { mode }) {
      env = loadServerEnv(mode);
    },
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}
