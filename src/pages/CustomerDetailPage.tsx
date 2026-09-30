import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/common/Avatar";
import { PageHeader } from "@/components/common/PageHeader";
import { RecordNotFound } from "@/components/common/RecordNotFound";
import { ErrorState, LoadingRows } from "@/components/common/States";
import { listBookings } from "@/features/bookings/api";
import { BookingList } from "@/features/bookings/BookingList";
import { getCustomer } from "@/features/customers/api";
import { useAsync } from "@/hooks/use-async";
import { formatDate } from "@/lib/format";

const HISTORY_LIMIT = 200;

export function CustomerDetailPage() {
  const id = Number(useParams().id);
  const customer = useAsync(() => getCustomer(id), [id]);
  // Booking history, newest first. `today` is irrelevant for "all".
  const history = useAsync(() => listBookings({ when: "all", today: "", customerId: id, pageSize: HISTORY_LIMIT }), [id]);
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
            <Avatar name={c.name} className="h-10 w-10 text-[0.8rem]" />
            <span className="truncate">{c.name}</span>
          </span>
        }
        description={
          <span className="font-mono text-xs">
            <a href={`mailto:${c.email}`} className="hover:text-brand">{c.email}</a>
            {c.phone ? <> · <a href={`tel:${c.phone}`} className="hover:text-brand">{c.phone}</a></> : null} · first booked {formatDate(c.createdAt)}
          </span>
        }
      />
      <div className="max-w-4xl p-4 sm:p-6">
        <Card>
          <CardHeader><CardTitle>Booking history ({history.data?.total ?? 0})</CardTitle></CardHeader>
          <CardContent className="p-0">
            {history.error ? (
              <div className="p-4"><ErrorState error={history.error} onRetry={history.reload} /></div>
            ) : !history.data ? (
              <LoadingRows rows={3} />
            ) : (
              <BookingList bookings={history.data.rows} show="staff" empty="No bookings yet." />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
