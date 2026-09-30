const DEFAULT_APP_NAME = "RiverX Helpdesk";
const DEFAULT_API_BASE_URL = "/api";
// Production builds outside RiverX use our own Data API function (api/db/[action].ts).
const DEFAULT_DB_URL = import.meta.env.PROD ? "/api/db" : "";

export const env = {
  appName: import.meta.env.VITE_APP_NAME || DEFAULT_APP_NAME,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL,
  dbUrl: import.meta.env.VITE_RIVERX_DB_URL || DEFAULT_DB_URL,
  dbKey: import.meta.env.VITE_RIVERX_DB_KEY || "",
};
