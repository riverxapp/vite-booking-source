import { useState } from "react";
import { Link } from "react-router-dom";
import { Layers, Plus } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, ErrorState, LoadingRows } from "@/components/common/States";
import type { Service } from "@/db/schema";
import { listServices } from "@/features/services/api";
import { ServiceSheet } from "@/features/services/ServiceSheet";
import { useAsync } from "@/hooks/use-async";
import { formatDuration, formatPrice, plural } from "@/lib/format";

export function ServicesPage() {
  const { data, error, loading, reload } = useAsync(listServices, []);
  const [target, setTarget] = useState<Service | "new" | null>(null);

  const addButton = (
    <Button onClick={() => setTarget("new")}><Plus />New service</Button>
  );

  return (
    <>
      <PageHeader
        eyebrow="Booking"
        title="Services"
        description={<span className="font-mono text-xs">{data ? plural(data.length, "service") : " "}</span>}
        actions={addButton}
      />
      <div className="space-y-4 p-4 sm:p-6">
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading && !data ? (
          <LoadingRows rows={4} />
        ) : !data?.length ? (
          <EmptyState icon={Layers} title="No services yet" description="Add what customers can book: a name, how long it takes and what it costs." action={addButton} />
        ) : (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Length</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="hidden sm:table-cell text-right">Staff</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((s) => (
                  <TableRow key={s.id} className="cursor-pointer" onClick={() => setTarget(s)}>
                    <TableCell className="max-w-[22rem]">
                      <button type="button" className="block max-w-full truncate text-left font-medium hover:underline" onClick={(e) => { e.stopPropagation(); setTarget(s); }}>
                        {s.name}
                      </button>
                      {s.description ? <span className="block truncate text-xs text-muted-foreground">{s.description}</span> : null}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs">{formatDuration(s.durationMinutes)}</TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">{formatPrice(s.priceCents)}</TableCell>
                    <TableCell className="hidden sm:table-cell text-right font-mono tabular-nums">
                      {s.staffCount || <span className="text-destructive" title="Nobody performs this service, so it can’t be booked">0</span>}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {s.active && !s.staffCount ? (
                        <span className="rx-meta text-destructive">Needs staff</span>
                      ) : (
                        <span className="rx-meta">{s.active ? "Bookable" : "Hidden"}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
        {data?.some((s) => s.active && !s.staffCount) ? (
          <p className="text-sm text-muted-foreground">
            Services nobody performs don’t appear on the booking page. Open a person on the{" "}
            <Link to="/app/staff" className="text-brand hover:underline">Staff</Link> page, tick the service and set their working hours.
          </p>
        ) : null}
      </div>
      <ServiceSheet
        target={target}
        onClose={() => setTarget(null)}
        onSaved={() => {
          setTarget(null);
          reload();
        }}
      />
    </>
  );
}
