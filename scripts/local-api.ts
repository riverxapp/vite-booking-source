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
 * do behind the Vercel functions. The dev server uses /__local-api/* (a RiverX
 * workspace preview sends /api/* to RiverX, not the app); `vite preview` serves a
 * production build, which calls /api/*.
 */
export function localApi(): Plugin {
  let env: Env = {};

  const middleware = (prefix: string) => (req: Req, res: Res, next: () => void) => {
    if (!req.url?.startsWith(`${prefix}/`)) return next();
    // The handlers route on /api/<area>/:action.
    const url = `/api${req.url.slice(prefix.length)}`;
    const handler = url.startsWith("/api/auth/") ? handleAuthRequest : url.startsWith("/api/booking/") ? handleBookingRequest : null;
    if (!handler) return next();
    req.url = url;
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
      server.middlewares.use(middleware("/__local-api"));
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware("/api"));
    },
  };
}
