import { Link } from "react-router-dom";
import { ToneBadge } from "@/components/common/ToneBadge";
import { bookingConfig } from "@/config/booking";
import { formatDay, formatTime } from "@/lib/format";
import type { BookingRow } from "./api";

type BookingListProps = {
  bookings: BookingRow[];
  /** The second line names whoever the page is not about. */
  show: "customer" | "staff" | "both";
  /** Leave out the date, e.g. in a "today" list. */
  timeOnly?: boolean;
  empty: string;
};

/** Compact booking rows for dashboard, staff and customer pages. Each links to the booking. */
export function BookingList({ bookings, show, timeOnly, empty }: BookingListProps) {
  if (!bookings.length) return <p className="px-4 py-4 text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="divide-y">
      {bookings.map((b) => (
        <li key={b.id}>
          <Link to={`/app/bookings/${b.reference}`} className="flex items-center gap-3 px-4 py-3 hover:bg-accent">
            <span className={`shrink-0 font-mono text-xs tabular-nums text-muted-foreground ${timeOnly ? "w-20" : "w-28 sm:w-40"}`}>
              {timeOnly ? formatTime(b.startMinute) : (
                <>
                  <span className="block text-foreground">{formatDay(b.date)}</span>
                  {formatTime(b.startMinute)}
                </>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{b.serviceName}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {show === "customer" ? b.customerName : show === "staff" ? `with ${b.staffName}` : `${b.customerName} · with ${b.staffName}`}
              </span>
            </span>
            <ToneBadge options={bookingConfig.statuses} value={b.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
