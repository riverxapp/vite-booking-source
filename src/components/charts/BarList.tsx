export type BarDatum = { label: string; value: number };

/**
 * Horizontal bars for a handful of labelled categories, one brand hue. The
 * label and the value sit beside every bar, so identity never rests on colour
 * and no tooltip is needed; it is a real list for screen readers.
 */
export function BarList({ data, total }: { data: BarDatum[]; /** Bars scale to this (e.g. all tickets). */ total: number }) {
  const max = Math.max(1, total);
  return (
    <ul className="space-y-3">
      {data.map((d) => {
        const share = d.value / max;
        return (
          <li key={d.label} className="grid grid-cols-[5.5rem_1fr_4.5rem] items-center gap-3 text-sm">
            <span className="truncate">{d.label}</span>
            <span className="h-2 bg-muted" aria-hidden="true">
              <span className="block h-full rounded-r-[4px] bg-chart-1" style={{ width: `${share * 100}%` }} />
            </span>
            <span className="text-right font-mono text-xs tabular-nums text-muted-foreground">
              {d.value.toLocaleString()} <span className="text-[0.66rem]">({Math.round(share * 100)}%)</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
