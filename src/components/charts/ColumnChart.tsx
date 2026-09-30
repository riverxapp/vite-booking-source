import { niceTicks } from "./scale";

export type ColumnDatum = { label: string; value: number; /** Tooltip / table wording, e.g. "March 2026". */ detail?: string };

type ColumnChartProps = {
  /** Names the series; used for the accessible table caption. */
  title: string;
  data: ColumnDatum[];
  /** Singular / plural unit for tooltips, e.g. ["booking", "bookings"]. */
  unit: [string, string];
};

/**
 * Single-series column chart built from divs (DESIGN.md: no chart library).
 * One brand hue, ≤24px columns with a 4px rounded cap on a shared baseline,
 * hairline grid, mono axis labels. Each column shows a tooltip on hover and
 * keyboard focus; a visually hidden table carries the same numbers.
 */
export function ColumnChart({ title, data, unit }: ColumnChartProps) {
  const ticks = niceTicks(Math.max(0, ...data.map((d) => d.value)));
  const top = ticks[ticks.length - 1];
  const format = (v: number) => `${v.toLocaleString()} ${v === 1 ? unit[0] : unit[1]}`;

  return (
    <figure className="m-0">
      <div className="flex gap-2" aria-hidden="true">
        {/* y-axis: tick values, top to bottom */}
        <div className="relative h-44 w-6 shrink-0 font-mono text-[0.66rem] text-muted-foreground">
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 tabular-nums" style={{ bottom: `${(t / top) * 100}%`, transform: "translateY(50%)" }}>
              {t.toLocaleString()}
            </span>
          ))}
        </div>
        <div className="relative h-44 flex-1">
          {ticks.map((t) => (
            <div key={t} className="absolute inset-x-0 border-t" style={{ bottom: `${(t / top) * 100}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end">
            {data.map((d) => (
              <div
                key={d.label}
                tabIndex={0}
                className="group relative flex h-full flex-1 items-end justify-center outline-none"
                aria-label={`${d.detail ?? d.label}: ${format(d.value)}`}
              >
                <div
                  className="w-full max-w-6 rounded-t-[4px] bg-chart-1 transition-opacity [transition-duration:120ms] group-hover:opacity-80 group-focus-visible:opacity-80"
                  style={{ height: `${(d.value / top) * 100}%` }}
                />
                {/* Hit target is the whole column slot, not just the bar. */}
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap border border-rule-strong bg-popover px-2 py-1 font-mono text-[0.7rem] shadow-modal group-hover:block group-focus-visible:block">
                  <span className="text-muted-foreground">{d.detail ?? d.label}</span> · {format(d.value)}
                </div>
                <span className="absolute inset-0 group-focus-visible:ring-2 group-focus-visible:ring-inset group-focus-visible:ring-ring" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="ml-8 mt-1.5 flex" aria-hidden="true">
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center font-mono text-[0.66rem] uppercase text-muted-foreground">
            {d.label}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th scope="row">{d.detail ?? d.label}</th>
              <td>{format(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
