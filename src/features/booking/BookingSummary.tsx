import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDay, formatDuration, formatPrice, formatTimeRange } from "@/lib/format";
import type { PublicService, PublicStaff } from "./api";
import type { Choice } from "./use-booking-params";

type SummaryProps = {
  service?: PublicService;
  staff?: PublicStaff;
  date?: string;
  time?: number;
  onChange: (choice: Choice) => void;
};

function Row({ label, value, onChange }: { label: string; value?: string; onChange: () => void }) {
  return (
    <div className="grid grid-cols-[4.5rem_1fr_auto] items-baseline gap-2 border-b py-2.5 text-sm last:border-b-0">
      <dt className="rx-meta">{label}</dt>
      <dd className="min-w-0 break-words">{value ?? <span className="text-muted-foreground">—</span>}</dd>
      {value ? (
        <button type="button" onClick={onChange} className="rx-bracket font-mono text-[0.66rem] uppercase tracking-[0.08em] text-muted-foreground hover:text-brand" aria-label={`Change ${label.toLowerCase()}`}>
          Change
        </button>
      ) : <span />}
    </div>
  );
}

/** What has been chosen so far, with a way back to each choice. */
export function BookingSummary({ service, staff, date, time, onChange }: SummaryProps) {
  return (
    <Card>
      <CardHeader><CardTitle>Your booking</CardTitle></CardHeader>
      <CardContent className="py-1">
        <dl>
          <Row label="Service" value={service?.name} onChange={() => onChange("service")} />
          <Row label="With" value={staff?.name} onChange={() => onChange("staff")} />
          <Row label="Date" value={date ? formatDay(date) : undefined} onChange={() => onChange("date")} />
          <Row label="Time" value={time != null && service ? formatTimeRange(time, time + service.durationMinutes) : undefined} onChange={() => onChange("time")} />
        </dl>
      </CardContent>
      {service ? (
        <div className="flex items-center justify-between border-t px-4 py-3 font-mono text-sm tabular-nums">
          <span className="text-muted-foreground">{formatDuration(service.durationMinutes)}</span>
          <span className="font-semibold">{formatPrice(service.priceCents)}</span>
        </div>
      ) : null}
    </Card>
  );
}
