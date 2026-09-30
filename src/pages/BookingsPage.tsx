import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarCheck } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OptionSelect } from "@/components/common/OptionSelect";
import { PageHeader } from "@/components/common/PageHeader";
import { Pager } from "@/components/common/Pager";
import { SearchInput } from "@/components/common/SearchInput";
import { EmptyState, ErrorState, LoadingRows } from "@/components/common/States";
import { ToneBadge } from "@/components/common/ToneBadge";
import { bookingConfig, type Option } from "@/config/booking";
import { listBookings, listFilterOptions, type BookingWhen } from "@/features/bookings/api";
import { useBranding } from "@/features/branding/use-branding";
import { useAsync } from "@/hooks/use-async";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useListParams } from "@/hooks/use-list-params";
import { nowIn } from "@/lib/dates";
import { formatDay, formatTimeRange, plural } from "@/lib/format";

// "" (the URL default) means upcoming.
const whenOptions: Option[] = [
  { value: "past", label: "Past" },
  { value: "all", label: "All dates" },
];

export function BookingsPage() {
  const navigate = useNavigate();
  const branding = useBranding();
  const list = useListParams(["when", "status", "staff", "service"] as const);
  const [searchText, setSearchText] = useState(list.search);
  const debounced = useDebouncedValue(searchText);

  useEffect(() => {
    if (debounced !== list.search) list.setSearch(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const options = useAsync(listFilterOptions, []);
  const staffOptions = options.data?.staff ?? [];
  const serviceOptions = options.data?.services ?? [];

  const { status, staff: staffId, service: serviceId } = list.filters;
  const when = (list.filters.when || "upcoming") as BookingWhen;
  const today = nowIn(branding.timezone).date;

  const { data, error, loading, reload } = useAsync(
    () =>
      listBookings({
        when,
        today,
        search: list.search,
        status,
        staffId: staffId ? Number(staffId) : undefined,
        serviceId: serviceId ? Number(serviceId) : undefined,
        page: list.page,
      }),
    [when, today, list.search, status, staffId, serviceId, list.page],
    branding.loaded,
  );

  const hasFilters = Boolean(list.search || status || staffId || serviceId);

  return (
    <>
      <PageHeader
        eyebrow="Booking"
        title="Bookings"
        description={<span className="font-mono text-xs">{data ? `${plural(data.total, "booking")} · ${when === "upcoming" ? "upcoming" : when === "past" ? "past" : "all dates"}` : " "}</span>}
      />
      <div className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <SearchInput value={searchText} onChange={setSearchText} placeholder="Search name, email, phone, reference…" />
          <OptionSelect kind="filter" options={whenOptions} value={list.filters.when} onChange={(v) => list.setFilter("when", v)} emptyLabel="Upcoming" />
          <OptionSelect kind="filter" options={bookingConfig.statuses} value={status} onChange={(v) => list.setFilter("status", v)} emptyLabel="All statuses" />
          <OptionSelect kind="filter" options={staffOptions} value={staffId} onChange={(v) => list.setFilter("staff", v)} emptyLabel="All staff" />
          <OptionSelect kind="filter" options={serviceOptions} value={serviceId} onChange={(v) => list.setFilter("service", v)} emptyLabel="All services" />
        </div>

        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading && !data ? (
          <LoadingRows />
        ) : !data?.rows.length ? (
          <EmptyState
            icon={CalendarCheck}
            title={hasFilters ? "No matches" : when === "upcoming" ? "No upcoming bookings" : "No bookings yet"}
            description={hasFilters ? "Try a different search or filter." : "Bookings appear here as soon as customers book on your booking page."}
          />
        ) : (
          <>
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden md:table-cell">Service</TableHead>
                    <TableHead className="hidden lg:table-cell">Staff</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden xl:table-cell">Ref</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.map((b) => (
                    <TableRow key={b.id} className="cursor-pointer" onClick={() => navigate(`/app/bookings/${b.reference}`)}>
                      <TableCell className="whitespace-nowrap font-mono text-xs tabular-nums">
                        <span className="block">{formatDay(b.date)}</span>
                        <span className="text-muted-foreground">{formatTimeRange(b.startMinute, b.endMinute)}</span>
                      </TableCell>
                      <TableCell className="max-w-[16rem]">
                        <Link to={`/app/bookings/${b.reference}`} className="block truncate font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
                          {b.customerName}
                        </Link>
                        <span className="block truncate text-xs text-muted-foreground md:hidden">{b.serviceName} · {b.staffName}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{b.serviceName}</TableCell>
                      <TableCell className="hidden lg:table-cell">{b.staffName}</TableCell>
                      <TableCell><ToneBadge options={bookingConfig.statuses} value={b.status} /></TableCell>
                      <TableCell className="hidden xl:table-cell font-mono text-xs text-muted-foreground">{b.reference}</TableCell>
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
