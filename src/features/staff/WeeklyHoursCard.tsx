import { useEffect, useState, type FormEvent } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { SettingsCard } from "@/components/common/SettingsCard";
import { bookingConfig } from "@/config/booking";
import { inputToMinutes, minutesToInput } from "@/lib/dates";
import { errorMessage } from "@/lib/format";
import { toast } from "@/lib/toast";
import { setWeeklyHours, type WeeklyHours } from "./api";

type DayRow = { on: boolean; start: string; end: string };

// A day switched on starts with the default hours.
const DEFAULT_START = minutesToInput(bookingConfig.defaultHours.startMinute);
const DEFAULT_END = minutesToInput(bookingConfig.defaultHours.endMinute);

function toRows(hours: WeeklyHours): DayRow[] {
  return bookingConfig.weekdays.map((_, weekday) => {
    const h = hours.find((x) => x.weekday === weekday);
    return h ? { on: true, start: minutesToInput(h.startMinute), end: minutesToInput(h.endMinute) } : { on: false, start: DEFAULT_START, end: DEFAULT_END };
  });
}

/** Availability: which days someone works and their hours, one range per day, in the business time zone. */
export function WeeklyHoursCard({ staffId, hours, timezone, onSaved }: { staffId: number; hours: WeeklyHours; timezone: string; onSaved: () => void }) {
  const [rows, setRows] = useState(() => toRows(hours));
  const [pending, setPending] = useState(false);
  const [invalid, setInvalid] = useState<number[]>([]);

  useEffect(() => setRows(toRows(hours)), [hours]);

  const order = Array.from({ length: 7 }, (_, i) => (bookingConfig.weekStartsOn + i) % 7);
  const update = (weekday: number, patch: Partial<DayRow>) => {
    setRows((r) => r.map((row, i) => (i === weekday ? { ...row, ...patch } : row)));
    setInvalid((w) => w.filter((d) => d !== weekday));
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = rows.map((r, weekday) => ({ weekday, on: r.on, startMinute: inputToMinutes(r.start), endMinute: inputToMinutes(r.end) }));
    const bad = parsed.filter((p) => p.on && (p.startMinute == null || p.endMinute == null || p.endMinute <= p.startMinute)).map((p) => p.weekday);
    setInvalid(bad);
    if (bad.length) return;
    setPending(true);
    try {
      await setWeeklyHours(staffId, parsed.filter((p) => p.on).map((p) => ({ weekday: p.weekday, startMinute: p.startMinute!, endMinute: p.endMinute! })));
      toast.success("Working hours saved");
      onSaved();
    } catch (err) {
      toast.error("Couldn’t save working hours", { description: errorMessage(err) });
    } finally {
      setPending(false);
    }
  }

  return (
    <SettingsCard title="Working hours" description={`Customers can book inside these hours. Times are in ${timezone.replace(/_/g, " ")}.`} onSubmit={onSubmit} pending={pending}>
      <ul className="-my-2 divide-y">
        {order.map((weekday) => {
          const row = rows[weekday];
          const name = bookingConfig.weekdays[weekday];
          return (
            <li key={weekday} className="grid grid-cols-[7.5rem_1fr] items-center gap-3 py-2.5 sm:grid-cols-[9rem_1fr]">
              <label className="flex items-center gap-2.5 text-sm font-medium">
                <Checkbox checked={row.on} onChange={(e) => update(weekday, { on: e.target.checked })} />
                {name}
              </label>
              {row.on ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Input type="time" step={900} value={row.start} onChange={(e) => update(weekday, { start: e.target.value })} aria-label={`${name} start`} aria-invalid={invalid.includes(weekday) || undefined} className="h-9 w-[7.5rem] font-mono" />
                  <span className="text-muted-foreground" aria-hidden="true">–</span>
                  <Input type="time" step={900} value={row.end} onChange={(e) => update(weekday, { end: e.target.value })} aria-label={`${name} end`} aria-invalid={invalid.includes(weekday) || undefined} className="h-9 w-[7.5rem] font-mono" />
                  {invalid.includes(weekday) ? <span className="text-xs text-destructive">End after start</span> : null}
                </div>
              ) : (
                <span className="rx-meta">Day off</span>
              )}
            </li>
          );
        })}
      </ul>
    </SettingsCard>
  );
}
