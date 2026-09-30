import type { Env } from "./env.js";

/**
 * Outgoing email. With RESEND_API_KEY and EMAIL_FROM set it sends through
 * Resend's HTTP API (no SDK needed); without them it logs the message on the
 * server, so every flow works in development.
 *
 * To use another provider, replace the fetch call in `sendEmail`.
 */

export type Email = { to: string; subject: string; text: string; html?: string };

/** Resolves true when the email was handed to the provider, false when it was only logged. */
export async function sendEmail(env: Env, email: Email): Promise<boolean> {
  if (!env.resendApiKey || !env.emailFrom) {
    console.info(`[email] Not sent (set RESEND_API_KEY and EMAIL_FROM to send). To: ${email.to}\nSubject: ${email.subject}\n\n${email.text}`);
    return false;
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.resendApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.emailFrom, to: [email.to], subject: email.subject, text: email.text, html: email.html }),
  });
  if (!response.ok) throw new Error(`Email provider returned ${response.status}: ${await response.text()}`);
  return true;
}

// --- booking confirmation: the one automated email -------------------------------

const LOCALE = "en-US";

export type ConfirmationDetails = {
  business: string;
  customerName: string;
  reference: string;
  serviceName: string;
  staffName: string;
  /** YYYY-MM-DD and minutes from midnight, wall-clock in the business time zone. */
  date: string;
  startMinute: number;
  endMinute: number;
  timezone: string;
  bookAgainUrl: string;
};

// Wall-clock values: format in UTC so the server's own zone never shifts them.
const dayFormat = new Intl.DateTimeFormat(LOCALE, { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
const timeFormat = new Intl.DateTimeFormat(LOCALE, { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
const day = (date: string) => dayFormat.format(new Date(`${date}T00:00:00Z`));
const time = (minutes: number) => timeFormat.format(new Date(Date.UTC(2000, 0, 1, 0, minutes)));

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function confirmationEmail(d: ConfirmationDetails): Omit<Email, "to"> {
  const when = `${day(d.date)}, ${time(d.startMinute)} – ${time(d.endMinute)} (${d.timezone})`;
  const rows: [string, string][] = [
    ["Service", d.serviceName],
    ["With", d.staffName],
    ["When", when],
    ["Reference", d.reference],
  ];
  const subject = `Booking confirmed: ${d.serviceName}, ${day(d.date)} at ${time(d.startMinute)}`;
  const text = [
    `Hi ${d.customerName},`,
    "",
    `Your booking with ${d.business} is confirmed.`,
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    "Need to change or cancel? Reply to this email and quote your reference.",
    "",
    `Book again: ${d.bookAgainUrl}`,
  ].join("\n");

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#ffffff;color:#111827;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.5">
  <div style="max-width:520px;margin:0 auto;border:1px solid #d6d6db">
    <div style="padding:20px 24px;border-bottom:1px solid #d6d6db">
      <p style="margin:0;font-family:Menlo,monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#5f6b7e">${escapeHtml(d.business)}</p>
      <h1 style="margin:8px 0 0;font-size:22px;color:#181894">Your booking is confirmed</h1>
    </div>
    <div style="padding:20px 24px">
      <p style="margin:0 0 16px">Hi ${escapeHtml(d.customerName)}, see you soon.</p>
      <table style="width:100%;border-collapse:collapse">
        ${rows
          .map(
            ([label, value]) =>
              `<tr><td style="padding:8px 0;border-top:1px solid #ececef;width:96px;font-family:Menlo,monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#5f6b7e;vertical-align:top">${label}</td><td style="padding:8px 0;border-top:1px solid #ececef">${escapeHtml(value)}</td></tr>`,
          )
          .join("")}
      </table>
    </div>
    <div style="padding:16px 24px;border-top:1px solid #d6d6db;color:#5f6b7e;font-size:13px">
      Need to change or cancel? Reply to this email and quote your reference.<br>
      <a href="${escapeHtml(d.bookAgainUrl)}" style="color:#181894">Book again</a>
    </div>
  </div>
</body></html>`;

  return { subject, text, html };
}
