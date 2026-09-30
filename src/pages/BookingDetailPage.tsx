import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Mail, XCircle } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/common/Avatar";
import { DetailItem } from "@/components/common/Field";
import { PageHeader } from "@/components/common/PageHeader";
import { RecordNotFound } from "@/components/common/RecordNotFound";
import { ErrorState } from "@/components/common/States";
import { ToneBadge } from "@/components/common/ToneBadge";
import { bookingConfig } from "@/config/booking";
import { cancelBooking, getBookingByReference } from "@/features/bookings/api";
import { useAsync } from "@/hooks/use-async";
import { useMutation } from "@/hooks/use-mutation";
import { formatDateTime, formatDay, formatDuration, formatPrice, formatTimeRange } from "@/lib/format";
import { toast } from "@/lib/toast";

export function BookingDetailPage() {
  const reference = useParams().reference ?? "";
  const booking = useAsync(() => getBookingByReference(reference), [reference]);
  const b = booking.data;
  const [confirming, setConfirming] = useState(false);

  const cancel = useMutation(async () => {
    await cancelBooking(b!.id);
    toast.success("Booking cancelled", { description: "The time is free to book again." });
    setConfirming(false);
    booking.reload();
  });

  if (booking.error) return <div className="p-6"><ErrorState error={booking.error} onRetry={booking.reload} /></div>;
  if (booking.loading && !b) return <div className="space-y-4 p-6"><Skeleton className="h-10 w-64 rounded-none" /><Skeleton className="h-64 w-full rounded-none" /></div>;
  if (!b) return <RecordNotFound label="Booking" backTo="/app/bookings" backLabel="Back to bookings" />;

  const cancelled = b.status === "cancelled";

  return (
    <>
      <PageHeader
        eyebrow={
          <span>
            <Link to="/app/bookings" className="hover:text-foreground">Bookings</Link>
            <span className="px-1.5">/</span>
            {b.reference}
          </span>
        }
        title={`${b.serviceName} · ${b.customerName}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <ToneBadge options={bookingConfig.statuses} value={b.status} />
            <span className="font-mono text-xs">{formatDay(b.date, "long")} · {formatTimeRange(b.startMinute, b.endMinute)}</span>
          </span>
        }
        actions={
          cancelled ? null : confirming ? (
            <>
              <span className="text-sm text-muted-foreground">Cancel this booking?</span>
              <Button variant="outline" onClick={() => setConfirming(false)} disabled={cancel.pending}>Keep it</Button>
              <Button variant="destructive" onClick={() => void cancel.run()} disabled={cancel.pending}>{cancel.pending ? "Cancelling…" : "Yes, cancel"}</Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setConfirming(true)}><XCircle />Cancel booking</Button>
          )
        }
      />

      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="min-w-0 space-y-6">
          <Card>
            <CardHeader><CardTitle>Appointment</CardTitle></CardHeader>
            <CardContent className="py-2">
              <dl>
                <DetailItem label="Service">{b.serviceName}</DetailItem>
                <DetailItem label="With"><Link to={`/app/staff/${b.staffId}`} className="hover:underline">{b.staffName}</Link></DetailItem>
                <DetailItem label="Date"><span className="font-mono text-xs">{formatDay(b.date, "long")}</span></DetailItem>
                <DetailItem label="Time"><span className="font-mono text-xs">{formatTimeRange(b.startMinute, b.endMinute)}</span></DetailItem>
                <DetailItem label="Length"><span className="font-mono text-xs">{formatDuration(b.endMinute - b.startMinute)}</span></DetailItem>
                <DetailItem label="Price"><span className="font-mono text-xs">{formatPrice(b.priceCents)}</span></DetailItem>
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Customer notes</CardTitle></CardHeader>
            <CardContent>
              {b.notes ? <p className="whitespace-pre-wrap break-words text-[0.94rem] leading-relaxed">{b.notes}</p> : <p className="text-sm text-muted-foreground">No notes.</p>}
            </CardContent>
          </Card>
          {cancelled ? <p className="rx-meta">Cancelled bookings don’t block the calendar. The customer isn’t emailed about cancellations in V1.</p> : null}
        </section>

        <aside className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Link to={`/app/customers/${b.customerId}`} className="-m-2 flex items-center gap-3 p-2 hover:bg-accent">
                <Avatar name={b.customerName} className="h-10 w-10" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{b.customerName}</span>
                  <span className="block truncate font-mono text-[0.72rem] text-muted-foreground">{b.customerEmail}</span>
                </span>
              </Link>
              {b.customerPhone ? <p className="font-mono text-xs"><a href={`tel:${b.customerPhone}`} className="hover:text-brand">{b.customerPhone}</a></p> : null}
              <Button asChild variant="outline" size="sm" className="w-full">
                <a href={`mailto:${b.customerEmail}?subject=${encodeURIComponent(`Your booking ${b.reference}`)}`}><Mail />Email customer</a>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Record</CardTitle></CardHeader>
            <CardContent className="py-2">
              <dl>
                <DetailItem label="Reference"><span className="font-mono text-xs">{b.reference}</span></DetailItem>
                <DetailItem label="Booked"><span className="font-mono text-xs">{formatDateTime(b.createdAt)}</span></DetailItem>
              </dl>
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}
