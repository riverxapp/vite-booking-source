import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/common/Avatar";
import { PageHeader } from "@/components/common/PageHeader";
import { RecordNotFound } from "@/components/common/RecordNotFound";
import { ErrorState, LoadingRows } from "@/components/common/States";
import { ToneBadge } from "@/components/common/ToneBadge";
import { helpdeskConfig } from "@/config/helpdesk";
import { getCustomer, listCustomerTickets } from "@/features/customers/api";
import { useAsync } from "@/hooks/use-async";
import { formatDate, formatRelative, formatTicketNumber } from "@/lib/format";

export function CustomerDetailPage() {
  const id = Number(useParams().id);
  const customer = useAsync(() => getCustomer(id), [id]);
  const tickets = useAsync(() => listCustomerTickets(id), [id]);
  const c = customer.data;

  if (customer.error) return <div className="p-6"><ErrorState error={customer.error} onRetry={customer.reload} /></div>;
  if (customer.loading && !c) return <div className="space-y-4 p-6"><Skeleton className="h-10 w-64 rounded-none" /><Skeleton className="h-64 w-full rounded-none" /></div>;
  if (!c) return <RecordNotFound label="Customer" backTo="/app/customers" backLabel="Back to customers" />;

  return (
    <>
      <PageHeader
        eyebrow={
          <span>
            <Link to="/app/customers" className="hover:text-foreground">Customers</Link>
            <span className="px-1.5">/</span>#{c.id}
          </span>
        }
        title={
          <span className="flex items-center gap-3">
            <Avatar name={c.name} src={c.avatar} className="h-10 w-10 text-[0.8rem]" />
            <span className="truncate">{c.name}</span>
          </span>
        }
        description={
          <span className="font-mono text-xs">
            {c.email} · customer since {formatDate(c.createdAt)}
          </span>
        }
      />
      <div className="max-w-4xl p-4 sm:p-6">
        <Card>
          <CardHeader><CardTitle>Tickets ({tickets.data?.length ?? 0})</CardTitle></CardHeader>
          <CardContent className="p-0">
            {tickets.error ? (
              <div className="p-4"><ErrorState error={tickets.error} onRetry={tickets.reload} /></div>
            ) : !tickets.data ? (
              <LoadingRows rows={3} />
            ) : tickets.data.length ? (
              <ul className="divide-y">
                {tickets.data.map((t) => (
                  <li key={t.id}>
                    <Link to={`/app/tickets/${t.ticketNumber}`} className="flex items-center gap-3 px-4 py-3 hover:bg-accent">
                      <span className="w-14 shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{formatTicketNumber(t.ticketNumber)}</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{t.subject}</span>
                      <span className="hidden font-mono text-xs text-muted-foreground sm:inline">{formatRelative(t.updatedAt)}</span>
                      <ToneBadge options={helpdeskConfig.statuses} value={t.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-4 text-sm text-muted-foreground">No tickets yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
