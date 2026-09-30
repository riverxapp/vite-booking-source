import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/States";
import { PublicLayout } from "@/components/site/PublicLayout";
import { createBooking, getSlots, listServices, listStaffFor } from "@/features/booking/api";
import { BookingSummary } from "@/features/booking/BookingSummary";
import { DetailsStep, type DetailsValues } from "@/features/booking/DetailsStep";
import { Stepper } from "@/features/booking/Stepper";
import { DateStep, ServiceStep, StaffStep, TimeStep } from "@/features/booking/steps";
import { CHOICES, useBookingParams } from "@/features/booking/use-booking-params";
import { useBranding } from "@/features/branding/use-branding";
import { defaultBookingIntro } from "@/features/branding/intro";
import { useAsync } from "@/hooks/use-async";
import { useForm } from "@/hooks/use-form";
import { errorMessage, formatDay } from "@/lib/format";
import { toast } from "@/lib/toast";

const HEADINGS = ["Choose a service", "Choose who you’d like to see", "Choose a date", "Choose a time", "Your details"];

/**
 * Choose Service → Staff → Date → Time → Enter Details → Booking Confirmed.
 * Each choice is a URL parameter; a choice that no longer holds (a hidden
 * service, a slot someone took) sends the visitor back to that step.
 */
export function BookPage() {
  const navigate = useNavigate();
  const branding = useBranding();
  const p = useBookingParams();
  const form = useForm<DetailsValues>({ defaultValues: { name: "", email: "", phone: "", notes: "" } });

  // All three load in parallel from the URL ids, so a deep link doesn't wait on a chain of
  // requests. Each result only counts once the choice before it checks out.
  const services = useAsync(listServices, []);
  const staff = useAsync(() => listStaffFor(p.serviceId!), [p.serviceId], p.serviceId != null);
  const slots = useAsync(() => getSlots(p.serviceId!, p.staffId!), [p.serviceId, p.staffId], p.serviceId != null && p.staffId != null);
  const service = services.data?.find((s) => s.id === p.serviceId);
  const member = service ? staff.data?.find((s) => s.id === p.staffId) : undefined;
  const day = member ? slots.data?.days.find((d) => d.date === p.date && d.times.length) : undefined;
  const time = day && p.time != null && day.times.includes(p.time) ? p.time : undefined;

  const step = !service ? 0 : !member ? 1 : !day ? 2 : time == null ? 3 : 4;
  // A choice in the URL whose data hasn't arrived yet: wait rather than flash an earlier step.
  const waiting = (p.serviceId != null && services.loading) || (p.staffId != null && staff.loading) || (p.date != null && slots.loading);
  // A stale id in the URL makes a later request fail (e.g. slots for a staff member who no
  // longer offers the service). That's not an error: the visitor just lands on the earlier step.
  const error = services.error ?? (service ? staff.error : null) ?? (member ? slots.error : null);

  // Move focus to the new step's heading so keyboard and screen reader users follow along.
  const heading = useRef<HTMLHeadingElement>(null);
  const firstStep = useRef(true);
  useEffect(() => {
    if (waiting) return;
    if (firstStep.current) firstStep.current = false;
    else heading.current?.focus();
  }, [step, waiting]);

  const back = () => p.clearFrom(CHOICES[step - 1]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const result = await createBooking({
        serviceId: service!.id,
        staffId: member!.id,
        date: day!.date,
        startMinute: time!,
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        notes: values.notes.trim() || undefined,
      });
      // Replace, so Back from the confirmation returns to the time step rather than resubmitting.
      navigate("/book/confirmed", { replace: true, state: result });
    } catch (e) {
      if ((e as { status?: number }).status === 409) {
        toast.error("That time was just taken", { description: "Pick another one. Your details are kept." });
        slots.reload();
        p.clearFrom("time");
      } else {
        toast.error("Couldn’t make the booking", { description: errorMessage(e) });
      }
    }
  });

  let body;
  if (error) body = <div className="p-4"><ErrorState error={error} onRetry={() => (services.error ? services.reload() : staff.error ? staff.reload() : slots.reload())} /></div>;
  else if (waiting || (step === 0 && !services.data) || (step === 1 && !staff.data) || (step === 2 && !slots.data)) body = <Skeleton className="h-64 w-full rounded-none" />;
  else if (step === 0) body = <ServiceStep services={services.data!} selectedId={p.serviceId} onChoose={(id) => p.choose("service", id)} />;
  else if (step === 1) body = <StaffStep staff={staff.data!} selectedId={p.staffId} onChoose={(id) => p.choose("staff", id)} />;
  else if (step === 2) body = <DateStep days={slots.data!.days} selected={p.date} onChoose={(date) => p.choose("date", date)} />;
  else if (step === 3) body = <TimeStep times={day!.times} selected={p.time} timezone={slots.data!.timezone} onChoose={(t) => p.choose("time", t)} />;
  else body = <DetailsStep register={form.register} errors={form.formState.errors} onSubmit={onSubmit} pending={form.formState.isSubmitting} />;

  return (
    <PublicLayout>
      <div className="border-b bg-card">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          <p className="rx-meta rx-mark">{branding.name} · Booking</p>
          <h1 className="mt-2 text-[1.8rem] font-bold leading-tight tracking-[-0.02em]">Book an appointment</h1>
        </div>
      </div>
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
        <Stepper current={step} onSelect={(i) => p.clearFrom(CHOICES[i])} />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <Card className="min-w-0">
            <div className="flex min-h-11 items-center gap-3 border-b px-4 py-2.5">
              {step > 0 ? (
                <button type="button" onClick={back} className="-ml-1 flex h-8 w-8 items-center justify-center hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Back">
                  <ArrowLeft className="h-4 w-4" />
                </button>
              ) : null}
              <div className="min-w-0">
                <h2 ref={heading} tabIndex={-1} className="font-semibold outline-none">{HEADINGS[step]}</h2>
                {step === 0 ? (
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{branding.bookingIntro || defaultBookingIntro(branding.name)}</p>
                ) : step === 3 && day ? (
                  <p className="font-mono text-xs text-muted-foreground">{formatDay(day.date, "long")}</p>
                ) : null}
              </div>
            </div>
            {body}
          </Card>
          <aside>
            <BookingSummary service={service} staff={member} date={day?.date} time={time} onChange={p.clearFrom} />
          </aside>
        </div>
      </div>
    </PublicLayout>
  );
}
