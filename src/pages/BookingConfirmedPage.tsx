import { Link, useLocation } from "react-router-dom";
import { CheckCircle2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { DetailItem } from "@/components/common/Field";
import { PublicLayout } from "@/components/site/PublicLayout";
import type { ConfirmedBooking } from "@/features/booking/api";
import { formatDay, formatDuration, formatPrice, formatTimeRange } from "@/lib/format";

type ConfirmationState = { booking: ConfirmedBooking; emailSent: boolean } | null;

/** Booking Confirmed. The booking arrives in history state, so it survives a reload but not a shared link. */
export function BookingConfirmedPage() {
  const state = useLocation().state as ConfirmationState;
  const b = state?.booking;

  return (
    <PublicLayout className="flex flex-1 items-start justify-center bg-background px-4 py-12 sm:py-16">
      <section className="w-full max-w-lg border bg-card" aria-labelledby="confirmed-title">
        <div className="border-b border-l-2 border-l-brand px-6 py-5">
          <p className="rx-meta rx-mark">Booking confirmed</p>
          <h1 id="confirmed-title" className="mt-2 flex items-center gap-2.5 text-[1.5rem] font-bold tracking-[-0.02em]">
            <CheckCircle2 className="h-6 w-6 shrink-0 text-success" />
            {b ? `You’re booked, ${b.customerName.split(" ")[0]}` : "You’re booked"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {!b
              ? "Your confirmation email has the details."
              : state.emailSent
                ? <>We’ve emailed a confirmation to <span className="font-mono text-foreground">{b.email}</span>.</>
                : "Keep your reference: you’ll need it if you contact us about this booking."}
          </p>
        </div>
        {b ? (
          <dl className="px-6 py-3">
            <DetailItem label="Reference"><span className="font-mono font-semibold tracking-[0.12em]">{b.reference}</span></DetailItem>
            <DetailItem label="Service">{b.serviceName}</DetailItem>
            <DetailItem label="With">{b.staffName}</DetailItem>
            <DetailItem label="Date">{formatDay(b.date, "long")}</DetailItem>
            <DetailItem label="Time">
              <span className="font-mono text-xs">{formatTimeRange(b.startMinute, b.endMinute)}</span>
              <span className="block font-mono text-[0.7rem] text-muted-foreground">{b.timezone.replace(/_/g, " ")}</span>
            </DetailItem>
            <DetailItem label="Length"><span className="font-mono text-xs">{formatDuration(b.durationMinutes)}</span></DetailItem>
            <DetailItem label="Price"><span className="font-mono text-xs">{formatPrice(b.priceCents)}</span></DetailItem>
          </dl>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4">
          <Button asChild variant="bracket"><Link to="/">Back to home</Link></Button>
          <Button asChild variant="outline"><Link to="/book">Book another</Link></Button>
        </div>
      </section>
    </PublicLayout>
  );
}
