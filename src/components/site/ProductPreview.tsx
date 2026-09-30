import { ToneBadge } from "@/components/common/ToneBadge";
import { helpdeskConfig } from "@/config/helpdesk";

/**
 * The hero visual is the product's own interface (DESIGN.md: "show it, don't
 * illustrate it"): a static, non-interactive ticket inbox built from the same
 * config the app uses. Rows are sample values for the preview only.
 */
const sample = [
  { number: 1042, customer: "John Smith", subject: "Can’t log in", status: "open", priority: "high", assignee: "Alex" },
  { number: 1041, customer: "Sarah Lee", subject: "Billing question", status: "pending", priority: "normal", assignee: "Sam" },
  { number: 1040, customer: "Priya Raman", subject: "Export to CSV fails", status: "open", priority: "normal", assignee: "Alex" },
  { number: 1038, customer: "Marco Rossi", subject: "Change account email", status: "resolved", priority: "low", assignee: "Sam" },
];

export function ProductPreview() {
  return (
    <div className="relative w-full border border-rule-hard bg-card text-left" role="img" aria-label="Preview of the agent ticket inbox">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <span className="rx-meta">Inbox · 4 tickets</span>
        <span className="rx-meta flex items-center gap-2">
          <span className="h-1.5 w-1.5 bg-warm" />
          Live
        </span>
      </div>
      <div className="grid grid-cols-[4rem_1fr_auto] gap-x-4 border-b bg-muted px-4 py-2 sm:grid-cols-[4rem_8rem_1fr_6rem_5rem_4rem]">
        {["Ticket", "Customer", "Subject", "Status", "Priority", "Assignee"].map((h, i) => (
          <span key={h} className={`rx-meta ${i === 1 || i > 3 ? "hidden sm:block" : ""}`}>{h}</span>
        ))}
      </div>
      <ul className="divide-y">
        {sample.map((t) => (
          <li key={t.number} className="grid grid-cols-[4rem_1fr_auto] items-center gap-x-4 px-4 py-2.5 text-[0.84rem] sm:grid-cols-[4rem_8rem_1fr_6rem_5rem_4rem]">
            <span className="font-mono text-[0.72rem] text-muted-foreground">#{t.number}</span>
            <span className="hidden truncate sm:block">{t.customer}</span>
            <span className="truncate font-medium">{t.subject}</span>
            <span><ToneBadge options={helpdeskConfig.statuses} value={t.status} /></span>
            <span className="hidden sm:block"><ToneBadge options={helpdeskConfig.priorities} value={t.priority} /></span>
            <span className="hidden truncate text-muted-foreground sm:block">{t.assignee}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
