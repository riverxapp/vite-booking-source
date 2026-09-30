/** Server-only settings. Never VITE_-prefixed. */
export type Env = {
  url?: string;
  authToken?: string;
  /** Lets more admins sign up once the first one exists. Unset: signup closes after the first admin. */
  adminSignupCode?: string;
  /** Public origin for links in emails, e.g. https://book.example.com. Defaults to the request's origin. */
  appUrl?: string;
  /** Resend API key. Unset: emails are logged on the server instead of sent. */
  resendApiKey?: string;
  /** Sender for every email, e.g. "Acme Bookings <bookings@acme.com>" (a domain verified with Resend). */
  emailFrom?: string;
};

/** Reads them from process.env (Vercel) or the Vite-loaded .env (dev). */
export function serverEnv(source: Record<string, string | undefined>): Env {
  return {
    url: source.TURSO_DATABASE_URL,
    authToken: source.TURSO_AUTH_TOKEN,
    adminSignupCode: source.ADMIN_SIGNUP_CODE || undefined,
    appUrl: source.APP_URL || undefined,
    resendApiKey: source.RESEND_API_KEY || undefined,
    emailFrom: source.EMAIL_FROM || undefined,
  };
}
