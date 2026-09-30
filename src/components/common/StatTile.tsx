/** One cell of a flush `gap-px` stat grid: meta label over a mono value. */
export function StatTile({ label, value, hint, small }: { label: string; value: string; hint?: string; /** For worded values like "Tomorrow". */ small?: boolean }) {
  return (
    <div className="bg-card px-4 py-4">
      <p className="rx-meta">{label}</p>
      <p className={`mt-1.5 font-mono font-semibold tabular-nums leading-tight ${small ? "pt-1.5 text-base" : "text-[1.6rem] leading-none"}`}>{value}</p>
      {hint ? <p className="mt-1.5 font-mono text-[0.7rem] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
