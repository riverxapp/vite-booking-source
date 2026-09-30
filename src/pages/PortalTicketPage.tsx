import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailItem } from "@/components/common/Field";
import { PageHeader } from "@/components/common/PageHeader";
import { RecordNotFound } from "@/components/common/RecordNotFound";
import { ErrorState } from "@/components/common/States";
import { ToneBadge } from "@/components/common/ToneBadge";
import { helpdeskConfig } from "@/config/helpdesk";
import { getMyTicket, replyToTicket } from "@/features/portal/api";
import { ReplyBox } from "@/features/tickets/ReplyBox";
import { Thread } from "@/features/tickets/Thread";
import { useAsync } from "@/hooks/use-async";
import { useMutation } from "@/hooks/use-mutation";
import { formatDateTime, formatTicketNumber } from "@/lib/format";

export function PortalTicketPage() {
  const number = Number(useParams().number);
  const { data, error, loading, reload } = useAsync(() => getMyTicket(number), [number]);
  const reply = useMutation(async (message: string) => {
    await replyToTicket(number, message);
    reload();
    return true;
  });

  if (error && (error as Error & { status?: number }).status === 404) {
    return <RecordNotFound label="Ticket" backTo="/portal/tickets" backLabel="Back to tickets" />;
  }
  if (error) return <div className="p-6"><ErrorState error={error} onRetry={reload} /></div>;
  if (loading && !data) return <div className="space-y-4 p-6"><Skeleton className="h-10 w-64 rounded-none" /><Skeleton className="h-64 w-full rounded-none" /></div>;
  if (!data) return null;
  const { ticket, messages } = data;

  return (
    <>
      <PageHeader
        eyebrow={
          <span>
            <Link to="/portal/tickets" className="hover:text-foreground">Tickets</Link>
            <span className="px-1.5">/</span>
            {formatTicketNumber(ticket.ticketNumber)}
          </span>
        }
        title={`${formatTicketNumber(ticket.ticketNumber)} — ${ticket.subject}`}
        description={<ToneBadge options={helpdeskConfig.statuses} value={ticket.status} />}
      />
      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="min-w-0 space-y-4" aria-label="Conversation">
          <Thread messages={messages} />
          <ReplyBox onSend={async (message) => Boolean(await reply.run(message))} />
          {ticket.status === "resolved" ? <p className="rx-meta">This ticket is resolved. Replying reopens it.</p> : null}
        </section>
        <aside>
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="py-2">
              <dl>
                <DetailItem label="Ticket"><span className="font-mono text-xs">{formatTicketNumber(ticket.ticketNumber)}</span></DetailItem>
                <DetailItem label="Status"><ToneBadge options={helpdeskConfig.statuses} value={ticket.status} /></DetailItem>
                <DetailItem label="Opened"><span className="font-mono text-xs">{formatDateTime(ticket.createdAt)}</span></DetailItem>
                <DetailItem label="Updated"><span className="font-mono text-xs">{formatDateTime(ticket.updatedAt)}</span></DetailItem>
              </dl>
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}
