import { env } from "@/lib/env";

/**
 * Single place to adapt this helpdesk template.
 * Stored values are the `value` keys: renaming a label is safe, changing a
 * `value` orphans existing rows that use the old key. The server (server/portal.ts)
 * also writes "open" for new tickets and on customer replies.
 */

export type Tone = "neutral" | "blue" | "green" | "amber" | "red" | "violet";

export type Option = { value: string; label: string; tone?: Tone };

export const helpdeskConfig = {
  /** Fallback name until an admin sets the company name in Settings. */
  appName: env.appName,
  locale: "en-US",
  pageSize: 25,

  // New ticket → Open → Pending → Resolved. Agents can move between any of them.
  statuses: [
    { value: "open", label: "Open", tone: "blue" },
    { value: "pending", label: "Pending", tone: "amber" },
    { value: "resolved", label: "Resolved", tone: "green" },
  ] satisfies Option[],

  priorities: [
    { value: "low", label: "Low", tone: "neutral" },
    { value: "normal", label: "Normal", tone: "neutral" },
    { value: "high", label: "High", tone: "red" },
  ] satisfies Option[],

  roles: [
    { value: "admin", label: "Admin", tone: "violet" },
    { value: "agent", label: "Agent", tone: "neutral" },
  ] satisfies Option[],
};

/** Statuses that still need the team's attention (shown in the Inbox). */
export const activeStatuses = ["open", "pending"];

export function optionLabel(options: readonly Option[], value: string | null | undefined) {
  if (!value) return "";
  return options.find((o) => o.value === value)?.label ?? value;
}
