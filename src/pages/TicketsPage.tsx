import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Inbox, Ticket } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OptionSelect } from "@/components/common/OptionSelect";
import { PageHeader } from "@/components/common/PageHeader";
import { Pager } from "@/components/common/Pager";
import { SearchInput } from "@/components/common/SearchInput";
import { EmptyState, ErrorState, LoadingRows } from "@/components/common/States";
import { ToneBadge } from "@/components/common/ToneBadge";
import { activeStatuses, helpdeskConfig, type Option } from "@/config/helpdesk";
import { useAuth } from "@/features/auth/use-auth";
import { listTickets, type TicketScope } from "@/features/tickets/api";
import { listAgents } from "@/features/users/api";
import { useAsync } from "@/hooks/use-async";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useListParams } from "@/hooks/use-list-params";
import { formatRelative, formatTicketNumber, plural } from "@/lib/format";

const copy = {
  inbox: {
    title: "Inbox",
    emptyTitle: "Inbox zero",
    emptyText: "Open and pending tickets that are yours or unassigned show up here.",
  },
  all: {
    title: "All tickets",
    emptyTitle: "No tickets yet",
    emptyText: "Tickets appear here when customers submit them from the portal.",
  },
};

function TicketList({ scope }: { scope: TicketScope }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const list = useListParams(["status", "priority", "assignee"] as const);
  const [searchText, setSearchText] = useState(list.search);
  const debounced = useDebouncedValue(searchText);
  const text = copy[scope];

  useEffect(() => {
    if (debounced !== list.search) list.setSearch(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const agents = useAsync(listAgents, []);
  const assigneeOptions = useMemo<Option[]>(
    () => [
      { value: "me", label: "Me" },
      { value: "unassigned", label: "Unassigned" },
      ...(agents.data ?? []).filter((a) => a.id !== user?.profileId).map((a) => ({ value: String(a.id), label: a.name })),
    ],
    [agents.data, user?.profileId],
  );
  const statusOptions = scope === "inbox" ? helpdeskConfig.statuses.filter((s) => activeStatuses.includes(s.value)) : helpdeskConfig.statuses;
  const { status, priority, assignee } = list.filters;

  const { data, error, loading, reload } = useAsync(
    () => listTickets({ scope, meId: user!.profileId, search: list.search, status, priority, assignee: scope === "all" ? assignee : "", page: list.page }),
    [scope, list.search, status, priority, assignee, list.page],
  );

  const hasFilters = Boolean(list.search || status || priority || (scope === "all" && assignee));

  return (
    <>
      <PageHeader
        eyebrow="Tickets"
        title={text.title}
        description={<span className="font-mono text-xs">{data ? plural(data.total, "ticket") : " "}</span>}
      />
      <div className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <SearchInput value={searchText} onChange={setSearchText} placeholder="Search tickets…" />
          <OptionSelect kind="filter" options={statusOptions} value={status} onChange={(v) => list.setFilter("status", v)} emptyLabel="All statuses" />
          <OptionSelect kind="filter" options={helpdeskConfig.priorities} value={priority} onChange={(v) => list.setFilter("priority", v)} emptyLabel="All priorities" />
          {scope === "all" ? (
            <OptionSelect kind="filter" options={assigneeOptions} value={assignee} onChange={(v) => list.setFilter("assignee", v)} emptyLabel="All assignees" />
          ) : null}
        </div>

        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading && !data ? (
          <LoadingRows />
        ) : !data?.rows.length ? (
          <EmptyState
            icon={scope === "inbox" ? Inbox : Ticket}
            title={hasFilters ? "No matches" : text.emptyTitle}
            description={hasFilters ? "Try a different search or filter." : text.emptyText}
          />
        ) : (
          <>
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Ticket</TableHead>
                    <TableHead className="hidden md:table-cell">Customer</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Priority</TableHead>
                    <TableHead className="hidden lg:table-cell">Assignee</TableHead>
                    <TableHead className="hidden xl:table-cell">Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.map((t) => (
                    <TableRow key={t.id} className="cursor-pointer" onClick={() => navigate(`/app/tickets/${t.ticketNumber}`)}>
                      <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">{formatTicketNumber(t.ticketNumber)}</TableCell>
                      <TableCell className="hidden md:table-cell">{t.customerName}</TableCell>
                      <TableCell className="max-w-[22rem]">
                        <Link to={`/app/tickets/${t.ticketNumber}`} className="block truncate font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
                          {t.subject}
                        </Link>
                        <span className="block truncate text-xs text-muted-foreground md:hidden">{t.customerName}</span>
                      </TableCell>
                      <TableCell>
                        <ToneBadge options={helpdeskConfig.statuses} value={t.status} />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <ToneBadge options={helpdeskConfig.priorities} value={t.priority} />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {t.assigneeName ?? <span className="text-muted-foreground">Unassigned</span>}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell font-mono text-xs text-muted-foreground">{formatRelative(t.updatedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
            <Pager page={list.page} total={data.total} onPageChange={list.setPage} />
          </>
        )}
      </div>
    </>
  );
}

// `key` resets the list state when switching between the two sidebar entries.
export function InboxPage() {
  return <TicketList key="inbox" scope="inbox" />;
}

export function AllTicketsPage() {
  return <TicketList key="all" scope="all" />;
}
