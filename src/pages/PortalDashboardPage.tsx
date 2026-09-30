import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus, Ticket } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarList } from "@/components/charts/BarList";
import { ColumnChart } from "@/components/charts/ColumnChart";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, ErrorState } from "@/components/common/States";
import { ToneBadge } from "@/components/common/ToneBadge";
import { helpdeskConfig } from "@/config/helpdesk";
import { useAuth } from "@/features/auth/use-auth";
import { useBranding } from "@/features/branding/use-branding";
import { listMyTickets } from "@/features/portal/api";
import { defaultPortalIntro } from "@/features/portal/intro";
import { portalStats } from "@/features/portal/stats";
import { useAsync } from "@/hooks/use-async";
import { formatDateTime, formatRelative, formatTicketNumber } from "@/lib/format";

const newTicketButton = (
  <Button asChild>
    <Link to="/portal/tickets/new"><Plus />New ticket</Link>
  </Button>
);

function StatTile({ label, value, title, small }: { label: string; value: string; title?: string; /** For worded values like "2 days ago". */ small?: boolean }) {
  return (
    <div className="bg-card px-4 py-4" title={title}>
      <p className="rx-meta">{label}</p>
      <p className={`mt-1.5 font-mono font-semibold tabular-nums leading-tight ${small ? "pt-1.5 text-base" : "text-[1.6rem] leading-none"}`}>{value}</p>
    </div>
  );
}

export function PortalDashboardPage() {
  const { user } = useAuth();
  const branding = useBranding();
  const { data, error, loading, reload } = useAsync(listMyTickets, []);
  const stats = useMemo(() => portalStats(data ?? []), [data]);
  const recent = (data ?? []).slice(0, 5);

  return (
    <>
      <PageHeader eyebrow="Dashboard" title={`Welcome, ${user?.name.split(" ")[0] ?? "there"}`} actions={newTicketButton} />
      <div className="space-y-6 p-4 sm:p-6">
        <section aria-labelledby="intro-title" className="border border-l-2 border-l-brand bg-card px-5 py-4">
          <h2 id="intro-title" className="rx-meta rx-mark">From {branding.name}</h2>
          <p className="mt-2 max-w-3xl whitespace-pre-wrap text-[0.94rem] leading-relaxed">{branding.portalIntro || defaultPortalIntro(branding.name)}</p>
        </section>

        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading && !data ? (
          <Skeleton className="h-72 w-full rounded-none" />
        ) : !stats.total ? (
          <EmptyState icon={Ticket} title="No tickets yet" description="When you open a ticket, its progress shows up here." action={newTicketButton} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-px border bg-[var(--rule)] lg:grid-cols-4">
              <StatTile label="Total tickets" value={stats.total.toLocaleString()} />
              <StatTile label="Open or pending" value={stats.active.toLocaleString()} />
              <StatTile label="Resolved" value={stats.resolved.toLocaleString()} />
              <StatTile label="Last activity" value={formatRelative(stats.lastActivity)} title={formatDateTime(stats.lastActivity)} small />
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <Card>
                <CardHeader><CardTitle>Tickets opened · last 6 months</CardTitle></CardHeader>
                <CardContent className="pt-8">
                  <ColumnChart title="Tickets opened per month, last 6 months" data={stats.perMonth} unit={["ticket", "tickets"]} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Tickets by status</CardTitle></CardHeader>
                <CardContent className="pt-6">
                  <BarList data={stats.byStatus} total={stats.total} />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Recent tickets</CardTitle>
                <Button asChild variant="bracket"><Link to="/portal/tickets">View all</Link></Button>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y">
                  {recent.map((t) => (
                    <li key={t.ticketNumber}>
                      <Link to={`/portal/tickets/${t.ticketNumber}`} className="flex items-center gap-3 px-4 py-3 hover:bg-accent">
                        <span className="w-14 shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{formatTicketNumber(t.ticketNumber)}</span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{t.subject}</span>
                        <span className="hidden font-mono text-xs text-muted-foreground sm:inline">{formatRelative(t.updatedAt)}</span>
                        <ToneBadge options={helpdeskConfig.statuses} value={t.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
