import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Ticket } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OptionSelect } from "@/components/common/OptionSelect";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchInput } from "@/components/common/SearchInput";
import { EmptyState, ErrorState, LoadingRows } from "@/components/common/States";
import { ToneBadge } from "@/components/common/ToneBadge";
import { helpdeskConfig } from "@/config/helpdesk";
import { listMyTickets } from "@/features/portal/api";
import { useAsync } from "@/hooks/use-async";
import { formatDateTime, formatRelative, formatTicketNumber, plural } from "@/lib/format";

const newTicketButton = (
  <Button asChild>
    <Link to="/portal/tickets/new"><Plus />New ticket</Link>
  </Button>
);

export function PortalTicketsPage() {
  const navigate = useNavigate();
  const { data, error, loading, reload } = useAsync(listMyTickets, []);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  // A customer has at most a few hundred tickets, so filtering happens in the browser.
  const rows = useMemo(() => {
    const term = search.trim().toLowerCase().replace(/^#/, "");
    return (data ?? []).filter(
      (t) => (!status || t.status === status) && (!term || t.subject.toLowerCase().includes(term) || String(t.ticketNumber).includes(term)),
    );
  }, [data, search, status]);
  const hasFilters = Boolean(search.trim() || status);

  return (
    <>
      <PageHeader
        eyebrow="Support"
        title="Tickets"
        description={<span className="font-mono text-xs">{data ? plural(data.length, "ticket") : " "}</span>}
        actions={newTicketButton}
      />
      <div className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row">
          <SearchInput value={search} onChange={setSearch} placeholder="Search tickets…" />
          <OptionSelect kind="filter" options={helpdeskConfig.statuses} value={status} onChange={setStatus} emptyLabel="All statuses" />
        </div>

        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading && !data ? (
          <LoadingRows rows={4} />
        ) : !rows.length ? (
          <EmptyState
            icon={Ticket}
            title={hasFilters ? "No matches" : "No tickets yet"}
            description={hasFilters ? "Try a different search or status." : "Tell us what you need help with and we’ll get back to you here."}
            action={hasFilters ? null : newTicketButton}
          />
        ) : (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Ticket</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((t) => (
                  <TableRow key={t.ticketNumber} className="cursor-pointer" onClick={() => navigate(`/portal/tickets/${t.ticketNumber}`)}>
                    <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">{formatTicketNumber(t.ticketNumber)}</TableCell>
                    <TableCell className="max-w-[24rem]">
                      <Link to={`/portal/tickets/${t.ticketNumber}`} className="block truncate font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
                        {t.subject}
                      </Link>
                    </TableCell>
                    <TableCell><ToneBadge options={helpdeskConfig.statuses} value={t.status} /></TableCell>
                    <TableCell className="hidden sm:table-cell font-mono text-xs text-muted-foreground" title={formatDateTime(t.updatedAt)}>
                      {formatRelative(t.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </>
  );
}
