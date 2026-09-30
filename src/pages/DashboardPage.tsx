import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarList } from "@/components/charts/BarList";
import { ColumnChart } from "@/components/charts/ColumnChart";
import { PageHeader } from "@/components/common/PageHeader";
import { StatTile } from "@/components/common/StatTile";
import { ErrorState } from "@/components/common/States";
import { useAuth } from "@/features/auth/use-auth";
import { countBookings, countCustomers, listConfirmedBetween, type BookingRow } from "@/features/bookings/api";
import { BookingList } from "@/features/bookings/BookingList";
import { useBranding } from "@/features/branding/use-branding";
import { useAsync } from "@/hooks/use-async";
import { addDays, nowIn } from "@/lib/dates";
import { formatDay } from "@/lib/format";

const CHART_DAYS = 14;
const WINDOW_DAYS = 30;

function dashboardStats(bookings: BookingRow[], today: string, nowMinute: number) {
  const week = addDays(today, 6);
  const todays = bookings.filter((b) => b.date === today);
  const perDay = Array.from({ length: CHART_DAYS }, (_, i) => {
    const date = addDays(today, i);
    return { label: String(Number(date.slice(8))), detail: formatDay(date, "long"), value: bookings.filter((b) => b.date === date).length };
  });
  const byService = new Map<string, number>();
  for (const b of bookings) byService.set(b.serviceName, (byService.get(b.serviceName) ?? 0) + 1);
  return {
    todays,
    remainingToday: todays.filter((b) => b.endMinute > nowMinute).length,
    nextWeek: bookings.filter((b) => b.date <= week).length,
    later: bookings.filter((b) => b.date > today).slice(0, 6),
    perDay,
    byService: [...byService].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6),
  };
}

export function DashboardPage() {
  const { user } = useAuth();
  const branding = useBranding();
  const now = nowIn(branding.timezone);
  const today = now.date;

  // Wait for the business time zone: "today" depends on it.
  const { data, error, reload } = useAsync(
    async () => {
      const [upcoming, thisMonth, customers] = await Promise.all([
        listConfirmedBetween(today, addDays(today, WINDOW_DAYS - 1)),
        countBookings({ from: `${today.slice(0, 7)}-01`, to: `${today.slice(0, 7)}-31`, status: "confirmed" }),
        countCustomers(),
      ]);
      return { upcoming, thisMonth, customers };
    },
    [today],
    branding.loaded,
  );
  const stats = useMemo(() => (data ? dashboardStats(data.upcoming, today, now.minute) : null), [data, today, now.minute]);

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title={`Hello, ${user?.name.split(" ")[0] ?? "there"}`}
        description={<span className="font-mono text-xs">{formatDay(today, "long")} · {branding.timezone.replace(/_/g, " ")}</span>}
        actions={
          <Button asChild variant="outline">
            <Link to="/book"><ExternalLink />Booking page</Link>
          </Button>
        }
      />
      <div className="space-y-6 p-4 sm:p-6">
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : !data || !stats ? (
          <Skeleton className="h-72 w-full rounded-none" />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-px border bg-[var(--rule)] lg:grid-cols-4">
              <StatTile label="Today" value={stats.todays.length.toLocaleString()} hint={`${stats.remainingToday} still to come`} />
              <StatTile label="Next 7 days" value={stats.nextWeek.toLocaleString()} />
              <StatTile label="This month" value={data.thisMonth.toLocaleString()} hint="confirmed" />
              <StatTile label="Customers" value={data.customers.toLocaleString()} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle>Today’s schedule</CardTitle>
                  <Button asChild variant="bracket"><Link to="/app/bookings">All bookings</Link></Button>
                </CardHeader>
                <CardContent className="p-0">
                  <BookingList bookings={stats.todays} show="both" timeOnly empty="Nothing booked today." />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Coming up</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <BookingList bookings={stats.later} show="both" empty={stats.todays.length ? `Nothing else booked in the next ${WINDOW_DAYS} days.` : `Nothing booked in the next ${WINDOW_DAYS} days.`} />
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <Card>
                <CardHeader><CardTitle>Bookings · next {CHART_DAYS} days</CardTitle></CardHeader>
                <CardContent className="pt-8">
                  <ColumnChart title={`Confirmed bookings per day, next ${CHART_DAYS} days`} data={stats.perDay} unit={["booking", "bookings"]} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>By service · next {WINDOW_DAYS} days</CardTitle></CardHeader>
                <CardContent className="pt-6">
                  {stats.byService.length ? (
                    <BarList data={stats.byService} total={data.upcoming.length} />
                  ) : (
                    <p className="text-sm text-muted-foreground">No upcoming bookings yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </>
  );
}
