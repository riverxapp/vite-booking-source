import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar } from "@/components/common/Avatar";
import { PageHeader } from "@/components/common/PageHeader";
import { Pager } from "@/components/common/Pager";
import { SearchInput } from "@/components/common/SearchInput";
import { EmptyState, ErrorState, LoadingRows } from "@/components/common/States";
import { listCustomers } from "@/features/customers/api";
import { useAsync } from "@/hooks/use-async";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useListParams } from "@/hooks/use-list-params";
import { formatDay, plural } from "@/lib/format";

export function CustomersPage() {
  const navigate = useNavigate();
  const list = useListParams([] as const);
  const [searchText, setSearchText] = useState(list.search);
  const debounced = useDebouncedValue(searchText);

  useEffect(() => {
    if (debounced !== list.search) list.setSearch(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const { data, error, loading, reload } = useAsync(() => listCustomers({ search: list.search, page: list.page }), [list.search, list.page]);

  return (
    <>
      <PageHeader
        eyebrow="Booking"
        title="Customers"
        description={<span className="font-mono text-xs">{data ? plural(data.total, "customer") : " "}</span>}
      />
      <div className="space-y-4 p-4 sm:p-6">
        <SearchInput value={searchText} onChange={setSearchText} placeholder="Search name, email, phone…" />

        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading && !data ? (
          <LoadingRows />
        ) : !data?.rows.length ? (
          <EmptyState
            icon={Users}
            title={list.search ? "No matches" : "No customers yet"}
            description={list.search ? "Try a different search." : "Customers appear here the first time they book."}
          />
        ) : (
          <>
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden lg:table-cell">Phone</TableHead>
                    <TableHead className="text-right">Bookings</TableHead>
                    <TableHead className="hidden sm:table-cell">Last booking</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.map((c) => (
                    <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate(`/app/customers/${c.id}`)}>
                      <TableCell>
                        <span className="flex items-center gap-3">
                          <Avatar name={c.name} />
                          <span className="min-w-0">
                            <Link to={`/app/customers/${c.id}`} className="block truncate font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
                              {c.name}
                            </Link>
                            <span className="block truncate font-mono text-xs text-muted-foreground md:hidden">{c.email}</span>
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell font-mono text-xs">{c.email}</TableCell>
                      <TableCell className="hidden lg:table-cell font-mono text-xs">{c.phone ?? "—"}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{c.bookingCount}</TableCell>
                      <TableCell className="hidden sm:table-cell font-mono text-xs text-muted-foreground">{formatDay(c.lastBooking)}</TableCell>
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
