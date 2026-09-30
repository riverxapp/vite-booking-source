import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Clock } from "@/components/icons";
import { Avatar } from "@/components/common/Avatar";
import { bookingConfig } from "@/config/booking";
import { useAuth } from "@/features/auth/use-auth";
import { formatDuration, formatPrice, formatTime } from "@/lib/format";
import { dateValue, weekdayOf } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { BookableDay, PublicService, PublicStaff } from "./api";
import { ChoiceButton } from "./ChoiceButton";

/** Choose Service → Choose Staff → Choose Date → Choose Time. Details is its own file (it has a form). */

/** Visitors get a short note; a signed-in admin also learns what makes a service bookable. */
export function NoServices() {
  const { user } = useAuth();
  return (
    <div className="space-y-2 px-4 py-6 text-sm">
      <p className="text-muted-foreground">No services are open for booking yet. Check back soon.</p>
      {user ? (
        <p className="border border-dashed bg-muted p-3">
          <span className="rx-meta block text-foreground">Admin tip</span>
          A service shows here once it’s bookable and at least one active staff member performs it. Tick it on their page under{" "}
          <Link to="/app/staff" className="text-brand hover:underline">Staff</Link>, and give them working hours so there are times to pick.
        </p>
      ) : null}
    </div>
  );
}

export function ServiceStep({ services, selectedId, onChoose }: { services: PublicService[]; selectedId?: number; onChoose: (id: number) => void }) {
  if (!services.length) return <NoServices />;
  return (
    <ul className="divide-y">
      {services.map((s) => (
        <li key={s.id}>
          <ChoiceButton selected={s.id === selectedId} onClick={() => onChoose(s.id)}>
            <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <span className="font-semibold">{s.name}</span>
              <span className="font-mono text-sm tabular-nums">{formatPrice(s.priceCents)}</span>
            </span>
            {s.description ? <span className="mt-0.5 block text-sm text-muted-foreground">{s.description}</span> : null}
            <span className="mt-1.5 flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {formatDuration(s.durationMinutes)}
            </span>
          </ChoiceButton>
        </li>
      ))}
    </ul>
  );
}

export function StaffStep({ staff, selectedId, onChoose }: { staff: PublicStaff[]; selectedId?: number; onChoose: (id: number) => void }) {
  if (!staff.length) return <p className="px-4 py-6 text-sm text-muted-foreground">Nobody offers this service right now. Pick another one.</p>;
  return (
    <ul className="divide-y">
      {staff.map((m) => (
        <li key={m.id}>
          <ChoiceButton selected={m.id === selectedId} onClick={() => onChoose(m.id)}>
            <span className="flex items-center gap-3">
              <Avatar name={m.name} className="h-9 w-9" />
              <span className="font-semibold">{m.name}</span>
            </span>
          </ChoiceButton>
        </li>
      ))}
    </ul>
  );
}

const monthFormat = new Intl.DateTimeFormat(bookingConfig.locale, { month: "long", year: "numeric", timeZone: "UTC" });
const weekdayShort = new Intl.DateTimeFormat(bookingConfig.locale, { weekday: "short", timeZone: "UTC" });
const longDate = new Intl.DateTimeFormat(bookingConfig.locale, { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });

/** The booking window as month grids. Days without a free slot are shown but can't be picked. */
export function DateStep({ days, selected, onChoose }: { days: BookableDay[]; selected?: string; onChoose: (date: string) => void }) {
  const start = bookingConfig.weekStartsOn;
  const months = useMemo(() => {
    const groups: { label: string; days: BookableDay[] }[] = [];
    for (const d of days) {
      const label = monthFormat.format(dateValue(d.date));
      let last = groups[groups.length - 1];
      if (last?.label !== label) groups.push((last = { label, days: [] }));
      last.days.push(d);
    }
    return groups;
  }, [days]);
  // Any 7 consecutive dates give the column headings in order.
  const headings = Array.from({ length: 7 }, (_, i) => weekdayShort.format(new Date(Date.UTC(2023, 0, 1 + ((start + i) % 7)))));

  if (!days.some((d) => d.times.length)) {
    return <p className="px-4 py-6 text-sm text-muted-foreground">No free times in the next {days.length} days. Try someone else, or check back later.</p>;
  }
  return (
    <div className="space-y-6 p-4">
      {months.map((month) => {
        const lead = (weekdayOf(month.days[0].date) - start + 7) % 7;
        // Fill the last week so the grid's seam colour never shows through.
        const trail = (7 - ((lead + month.days.length) % 7)) % 7;
        return (
          <div key={month.label}>
            <h3 className="rx-meta mb-2 text-foreground">{month.label}</h3>
            <div className="grid grid-cols-7 gap-px border bg-[var(--rule)]" role="group" aria-label={month.label}>
              {headings.map((h) => (
                <span key={h} className="bg-muted py-1.5 text-center font-mono text-[0.66rem] uppercase tracking-[0.08em] text-muted-foreground" aria-hidden="true">
                  {h}
                </span>
              ))}
              {Array.from({ length: lead }, (_, i) => <span key={`pad-${i}`} className="bg-card" aria-hidden="true" />)}
              {month.days.map((d) => {
                const open = d.times.length > 0;
                const isSelected = d.date === selected;
                return (
                  <button
                    key={d.date}
                    type="button"
                    disabled={!open}
                    onClick={() => onChoose(d.date)}
                    aria-pressed={isSelected}
                    aria-label={`${longDate.format(dateValue(d.date))}: ${open ? `${d.times.length} ${d.times.length === 1 ? "time" : "times"} free` : "unavailable"}`}
                    className={cn(
                      "flex h-12 flex-col items-center justify-center gap-0.5 bg-card font-mono text-sm tabular-nums transition-colors [transition-duration:120ms] focus-visible:relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:h-14",
                      open ? "font-semibold hover:bg-accent" : "cursor-not-allowed text-muted-foreground/50 line-through",
                      isSelected && "bg-primary text-primary-foreground hover:bg-primary",
                    )}
                  >
                    {Number(d.date.slice(8))}
                    {open ? <span className={cn("hidden text-[0.6rem] font-normal sm:block", isSelected ? "text-primary-foreground" : "text-muted-foreground")}>{d.times.length} free</span> : null}
                  </button>
                );
              })}
              {Array.from({ length: trail }, (_, i) => <span key={`end-${i}`} className="bg-card" aria-hidden="true" />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const PERIODS = [
  { label: "Morning", until: 12 * 60 },
  { label: "Afternoon", until: 17 * 60 },
  { label: "Evening", until: 24 * 60 },
];

export function TimeStep({ times, selected, timezone, onChoose }: { times: number[]; selected?: number; timezone: string; onChoose: (minute: number) => void }) {
  const groups = PERIODS.map((p, i) => ({ ...p, times: times.filter((t) => t < p.until && t >= (PERIODS[i - 1]?.until ?? 0)) })).filter((g) => g.times.length);
  return (
    <div className="space-y-5 p-4">
      {groups.map((g) => (
        <div key={g.label}>
          <h3 className="rx-meta mb-2">{g.label}</h3>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {g.times.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onChoose(t)}
                aria-pressed={t === selected}
                className={cn(
                  "h-11 rounded-md border font-mono text-sm tabular-nums transition-colors [transition-duration:120ms] hover:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  t === selected ? "border-primary bg-primary text-primary-foreground" : "bg-card",
                )}
              >
                {formatTime(t)}
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="rx-meta">Times are in {timezone.replace(/_/g, " ")}</p>
    </div>
  );
}
