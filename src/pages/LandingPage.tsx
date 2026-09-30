import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicLayout } from "@/components/site/PublicLayout";
import { useBranding } from "@/features/branding/use-branding";
import { defaultBookingIntro } from "@/features/branding/intro";
import { listServices } from "@/features/booking/api";
import { NoServices } from "@/features/booking/NoServices";
import { useAsync } from "@/hooks/use-async";
import { formatDuration, formatPrice } from "@/lib/format";

/** The hero shows the product itself (DESIGN.md): the live service list, each row one click from booking. */
function ServiceMenu() {
  const { data, error, loading } = useAsync(listServices, []);
  return (
    <section className="w-full border border-rule-hard bg-card text-left" aria-labelledby="menu-title">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <h2 id="menu-title" className="rx-meta">Services{data ? ` · ${data.length}` : ""}</h2>
        <span className="rx-meta flex items-center gap-2">
          <span className="h-1.5 w-1.5 bg-warm" />
          Booking open
        </span>
      </div>
      {loading && !data ? (
        <div className="space-y-px bg-[var(--rule)]">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full rounded-none bg-card" />)}
        </div>
      ) : error ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Services couldn’t load right now. You can still start a booking.</p>
      ) : !data?.length ? (
        <NoServices />
      ) : (
        <ul className="divide-y">
          {data.map((s) => (
            <li key={s.id}>
              <Link to={`/book?service=${s.id}`} className="group flex items-center gap-4 px-4 py-3 hover:bg-accent">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{s.name}</span>
                  {s.description ? <span className="block truncate text-sm text-muted-foreground">{s.description}</span> : null}
                </span>
                <span className="hidden items-center gap-1.5 font-mono text-xs text-muted-foreground sm:flex">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDuration(s.durationMinutes)}
                </span>
                <span className="w-20 text-right font-mono text-sm tabular-nums">{formatPrice(s.priceCents)}</span>
                <span className="rx-bracket hidden font-mono text-[0.72rem] uppercase tracking-[0.08em] text-muted-foreground group-hover:text-brand md:inline">Book</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function LandingPage() {
  const { name, bookingIntro } = useBranding();
  return (
    <PublicLayout>
      <section className="mx-auto flex max-w-6xl flex-col items-center px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24">
        <p className="rx-meta rx-mark">{name} · Appointments</p>
        <h1 className="mt-5 max-w-3xl text-balance text-[clamp(2.6rem,5.2vw,4.4rem)] font-bold leading-[1.05] tracking-[-0.03em] text-headline">
          Book your appointment
        </h1>
        <p className="mt-5 max-w-xl whitespace-pre-wrap text-[1.02rem] text-muted-foreground">{bookingIntro || defaultBookingIntro(name)}</p>
        <div className="mt-8">
          <Button asChild size="lg" className="px-6">
            <Link to="/book">
              Book now
              <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="mt-14 w-full max-w-3xl">
          <ServiceMenu />
        </div>
      </section>
    </PublicLayout>
  );
}
