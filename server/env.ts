import type { Env } from "./auth.js";

/** Server-only settings, from process.env (Vercel) or the Vite-loaded .env (dev). Never VITE_-prefixed. */
export function serverEnv(source: Record<string, string | undefined>): Env {
  return {
    url: source.TURSO_DATABASE_URL,
    authToken: source.TURSO_AUTH_TOKEN,
    agentSignupCode: source.AGENT_SIGNUP_CODE || undefined,
    appUrl: source.APP_URL || undefined,
  };
}
