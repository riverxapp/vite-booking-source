import { ChevronLeft, ChevronRight } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { bookingConfig } from "@/config/booking";

type PagerProps = { page: number; total: number; onPageChange: (page: number) => void };

export function Pager({ page, total, onPageChange }: PagerProps) {
  const size = bookingConfig.pageSize;
  const pages = Math.max(1, Math.ceil(total / size));
  const from = total === 0 ? 0 : page * size + 1;
  const to = Math.min(total, (page + 1) * size);

  return (
    <div className="flex items-center justify-between gap-4 px-1 py-3 font-mono text-xs text-muted-foreground">
      <span>
        {from}–{to} of {total.toLocaleString()}
      </span>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
          <ChevronLeft />
        </Button>
        <span className="px-2 font-mono tabular-nums">
          {page + 1} / {pages}
        </span>
        <Button variant="outline" size="sm" disabled={page + 1 >= pages} onClick={() => onPageChange(page + 1)} aria-label="Next page">
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
