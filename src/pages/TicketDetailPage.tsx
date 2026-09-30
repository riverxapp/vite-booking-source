import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/common/Avatar";
import { DetailItem } from "@/components/common/Field";
import { OptionSelect } from "@/components/common/OptionSelect";
import { PageHeader } from "@/components/common/PageHeader";
import { RecordNotFound } from "@/components/common/RecordNotFound";
import { ErrorState, LoadingRows } from "@/components/common/States";
import { ToneBadge } from "@/components/common/ToneBadge";
import { helpdeskConfig } from "@/config/helpdesk";
import { useAuth } from "@/features/auth/use-auth";
import { addAgentMessage, getTicketByNumber, listMessages, updateTicket, type TicketPatch } from "@/features/tickets/api";
import { ReplyBox } from "@/features/tickets/ReplyBox";
import { Thread } from "@/features/tickets/Thread";
import { listAgents } from "@/features/users/api";
import { useAsync } from "@/hooks/use-async";
import { useMutation } from "@/hooks/use-mutation";
import { formatDateTime, formatTicketNumber } from "@/lib/format";
import { toast } from "@/lib/toast";

export function TicketDetailPage() {
  const number = Number(useParams().number);
  const { user } = useAuth();
  const ticket = useAsync(() => getTicketByNumber(number), [number]);
  const t = ticket.data;
  const thread = useAsync(() => listMessages(t!.id), [t?.id], Boolean(t));
  const agents = useAsync(listAgents, []);
  const agentOptions = useMemo(() => (agents.data ?? []).map((a) => ({ value: String(a.id), label: a.name })), [agents.data]);

  const change = useMutation(async (patch: TicketPatch) => {
    await updateTicket(t!.id, patch);
    ticket.reload();
  });

  const send = useMutation(async (message: string, isInternal: boolean) => {
    await addAgentMessage({ ticketId: t!.id, agentId: user!.profileId, message, isInternal });
    toast.success(isInternal ? "Internal note added" : "Reply sent");
    thread.reload();
    ticket.reload();
    return true;
  });

  if (ticket.error) return <div className="p-6"><ErrorState error={ticket.error} onRetry={ticket.reload} /></div>;
  if (ticket.loading && !t) return <div className="space-y-4 p-6"><Skeleton className="h-10 w-64 rounded-none" /><Skeleton className="h-64 w-full rounded-none" /></div>;
  if (!t) return <RecordNotFound label="Ticket" backTo="/app/tickets" backLabel="Back to all tickets" />;

  return (
    <>
      <PageHeader
        eyebrow={
          <span>
            <Link to="/app/tickets" className="hover:text-foreground">Tickets</Link>
            <span className="px-1.5">/</span>
            {formatTicketNumber(t.ticketNumber)}
          </span>
        }
        title={`${formatTicketNumber(t.ticketNumber)} — ${t.subject}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <ToneBadge options={helpdeskConfig.statuses} value={t.status} />
            <ToneBadge options={helpdeskConfig.priorities} value={t.priority} />
            <span>{t.assigneeName ?? "Unassigned"}</span>
          </span>
        }
      >
        <div className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-3" aria-label="Ticket actions" role="group">
          <div className="space-y-1.5">
            <Label htmlFor="ticket-status">Status</Label>
            <OptionSelect id="ticket-status" options={helpdeskConfig.statuses} value={t.status} onChange={(status) => void change.run({ status })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ticket-priority">Priority</Label>
            <OptionSelect id="ticket-priority" options={helpdeskConfig.priorities} value={t.priority} onChange={(priority) => void change.run({ priority })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ticket-assignee">Assignee</Label>
            <OptionSelect
              id="ticket-assignee"
              options={agentOptions}
              value={t.assigneeId ? String(t.assigneeId) : ""}
              emptyLabel="Unassigned"
              onChange={(v) => void change.run({ assigneeId: v ? Number(v) : null })}
            />
          </div>
        </div>
      </PageHeader>

      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="min-w-0 space-y-4" aria-label="Conversation">
          {thread.error ? (
            <ErrorState error={thread.error} onRetry={thread.reload} />
          ) : !thread.data ? (
            <LoadingRows rows={3} />
          ) : (
            <Thread messages={thread.data} />
          )}
          <ReplyBox allowInternal onSend={async (message, internal) => Boolean(await send.run(message, internal))} />
          <p className="rx-meta">Internal notes are only visible to your team, never in the customer portal.</p>
        </section>

        <aside className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
            <CardContent>
              <Link to={`/app/customers/${t.customerId}`} className="-m-2 flex items-center gap-3 p-2 hover:bg-accent">
                <Avatar name={t.customerName} src={t.customerAvatar} className="h-10 w-10" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{t.customerName}</span>
                  <span className="block truncate font-mono text-[0.72rem] text-muted-foreground">{t.customerEmail}</span>
                </span>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="py-2">
              <dl>
                <DetailItem label="Ticket"><span className="font-mono text-xs">{formatTicketNumber(t.ticketNumber)}</span></DetailItem>
                <DetailItem label="Created"><span className="font-mono text-xs">{formatDateTime(t.createdAt)}</span></DetailItem>
                <DetailItem label="Updated"><span className="font-mono text-xs">{formatDateTime(t.updatedAt)}</span></DetailItem>
              </dl>
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}
