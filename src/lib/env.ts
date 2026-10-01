const DEFAULT_APP_NAME = "RiverX Booking";
// The dev server must stay off /api: under a RiverX workspace preview the backend
// domain routes /api/* to RiverX itself. Production builds use the Vercel functions.
const DEFAULT_API_BASE_URL = import.meta.env.PROD ? "/api" : "/__local-api";
// Production builds (Vercel, including apps published from RiverX) always use
// our own Data API function (api/db/[action].ts), which checks the login
// session and reaches Turso with the server-only TURSO_* env. In dev,
// VITE_RIVERX_DB_* point at the dev DB proxy (scripts/local-db-proxy.ts);
// a RiverX publishable key would let anyone with the bundle query the
// database, so none is used in production builds.

export const env = {
  appName: import.meta.env.VITE_APP_NAME || DEFAULT_APP_NAME,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL,
  dbUrl: import.meta.env.PROD ? "/api/db" : import.meta.env.VITE_RIVERX_DB_URL || "",
  dbKey: import.meta.env.PROD ? "" : import.meta.env.VITE_RIVERX_DB_KEY || "",
};
