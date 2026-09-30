import { activeStatuses, helpdeskConfig } from "@/config/helpdesk";
import type { PortalTicket } from "./api";

const monthLabel = new Intl.DateTimeFormat(helpdeskConfig.locale, { month: "short" });
const monthDetail = new Intl.DateTimeFormat(helpdeskConfig.locale, { month: "long", year: "numeric" });

/** Dashboard figures for one customer, computed from their ticket list. */
export function portalStats(tickets: PortalTicket[], months = 6, now = new Date()) {
  const byStatus = helpdeskConfig.statuses.map((s) => ({ label: s.label, value: tickets.filter((t) => t.status === s.value).length }));

  // Oldest month first, ending with the current one.
  const buckets = Array.from({ length: months }, (_, i) => {
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    return { start, label: monthLabel.format(start), detail: monthDetail.format(start), value: 0 };
  });
  for (const t of tickets) {
    const created = new Date(t.createdAt);
    const bucket = buckets.find((b) => b.start.getFullYear() === created.getFullYear() && b.start.getMonth() === created.getMonth());
    if (bucket) bucket.value += 1;
  }

  const lastActivity = tickets.reduce<string | null>((latest, t) => (!latest || t.updatedAt > latest ? t.updatedAt : latest), null);

  return {
    total: tickets.length,
    active: tickets.filter((t) => activeStatuses.includes(t.status)).length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    lastActivity,
    byStatus,
    perMonth: buckets.map(({ label, detail, value }) => ({ label, detail, value })),
  };
}
