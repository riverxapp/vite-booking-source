import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Trash2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/common/Avatar";
import { FormField } from "@/components/common/Field";
import { PageHeader } from "@/components/common/PageHeader";
import { RecordNotFound } from "@/components/common/RecordNotFound";
import { SettingsCard } from "@/components/common/SettingsCard";
import { ErrorState, LoadingRows } from "@/components/common/States";
import { listBookings } from "@/features/bookings/api";
import { BookingList } from "@/features/bookings/BookingList";
import { useBranding } from "@/features/branding/use-branding";
import { listServices } from "@/features/services/api";
import { deleteStaff, getStaff, setStaffServices, updateStaff } from "@/features/staff/api";
import { WeeklyHoursCard } from "@/features/staff/WeeklyHoursCard";
import { useAsync } from "@/hooks/use-async";
import { Controller, useForm } from "@/hooks/use-form";
import { nowIn } from "@/lib/dates";
import { errorMessage, formatDuration } from "@/lib/format";
import { toast } from "@/lib/toast";

type Member = NonNullable<Awaited<ReturnType<typeof getStaff>>>;

function ProfileCard({ member, onSaved }: { member: Member; onSaved: () => void }) {
  const { register, control, handleSubmit, reset, formState } = useForm({ defaultValues: { name: member.name, email: member.email, active: member.active } });
  const { errors } = formState;
  useEffect(() => reset({ name: member.name, email: member.email, active: member.active }), [member, reset]);

  const onSubmit = handleSubmit(async (v) => {
    try {
      await updateStaff(member.id, { name: v.name.trim(), email: v.email.trim().toLowerCase(), active: v.active });
      toast.success("Profile saved");
      onSaved();
    } catch (e) {
      toast.error("Couldn’t save", { description: errorMessage(e) });
    }
  });

  return (
    <SettingsCard title="Profile" description="Customers see the name when they choose who to book with." onSubmit={onSubmit} pending={formState.isSubmitting}>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Name *" htmlFor="member-name" error={errors.name?.message}>
          <Input id="member-name" maxLength={120} {...register("name", { validate: (v) => v.trim() !== "" || "Enter a name" })} />
        </FormField>
        <FormField label="Email *" htmlFor="member-email" error={errors.email?.message}>
          <Input id="member-email" type="email" className="font-mono" {...register("email", { validate: (v) => /^\S+@\S+\.\S+$/.test(v.trim()) || "Enter a valid email" })} />
        </FormField>
      </div>
      <Controller
        control={control}
        name="active"
        render={({ field }) => (
          <label className="flex items-start gap-3 border bg-muted p-3 text-sm">
            <Checkbox className="mt-0.5" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
            <span>
              <span className="block font-medium">Taking bookings</span>
              <span className="text-muted-foreground">Turn off to hide them from the booking page. Existing bookings stay.</span>
            </span>
          </label>
        )}
      />
    </SettingsCard>
  );
}

function ServicesCard({ member, onSaved }: { member: Member; onSaved: () => void }) {
  const services = useAsync(listServices, []);
  const [selected, setSelected] = useState<number[]>(member.serviceIds);
  const [pending, setPending] = useState(false);
  useEffect(() => setSelected(member.serviceIds), [member.serviceIds]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      await setStaffServices(member.id, selected);
      toast.success("Services saved");
      onSaved();
    } catch (err) {
      toast.error("Couldn’t save services", { description: errorMessage(err) });
    } finally {
      setPending(false);
    }
  }

  return (
    <SettingsCard title="Services" description="What customers can book with them." onSubmit={onSubmit} pending={pending} disabled={!services.data?.length}>
      {services.error ? (
        <ErrorState error={services.error} onRetry={services.reload} />
      ) : !services.data ? (
        <LoadingRows rows={3} />
      ) : !services.data.length ? (
        <p className="text-sm text-muted-foreground">No services yet. <Link to="/app/services" className="text-brand hover:underline">Add one first.</Link></p>
      ) : (
        <ul className="-my-2 divide-y">
          {services.data.map((s) => (
            <li key={s.id}>
              <label className="flex items-center gap-3 py-2.5 text-sm">
                <Checkbox
                  checked={selected.includes(s.id)}
                  onChange={(e) => setSelected((cur) => (e.target.checked ? [...cur, s.id] : cur.filter((x) => x !== s.id)))}
                />
                <span className="min-w-0 flex-1 truncate font-medium">{s.name}</span>
                <span className="font-mono text-xs text-muted-foreground">{formatDuration(s.durationMinutes)}{s.active ? "" : " · hidden"}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </SettingsCard>
  );
}

export function StaffDetailPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const branding = useBranding();
  const member = useAsync(() => getStaff(id), [id]);
  const m = member.data;
  const today = nowIn(branding.timezone).date;
  const upcoming = useAsync(() => listBookings({ when: "upcoming", today, staffId: id, status: "confirmed", pageSize: 10 }), [id, today], branding.loaded);
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    if (!m || !window.confirm(`Delete ${m.name}? This can’t be undone.`)) return;
    setDeleting(true);
    try {
      await deleteStaff(m.id);
      toast.success("Staff member deleted");
      navigate("/app/staff", { replace: true });
    } catch (e) {
      toast.error("Couldn’t delete", { description: errorMessage(e) });
      setDeleting(false);
    }
  }

  if (member.error) return <div className="p-6"><ErrorState error={member.error} onRetry={member.reload} /></div>;
  if (member.loading && !m) return <div className="space-y-4 p-6"><Skeleton className="h-10 w-64 rounded-none" /><Skeleton className="h-64 w-full rounded-none" /></div>;
  if (!m) return <RecordNotFound label="Staff member" backTo="/app/staff" backLabel="Back to staff" />;

  return (
    <>
      <PageHeader
        eyebrow={
          <span>
            <Link to="/app/staff" className="hover:text-foreground">Staff</Link>
            <span className="px-1.5">/</span>#{m.id}
          </span>
        }
        title={
          <span className="flex items-center gap-3">
            <Avatar name={m.name} className="h-10 w-10 text-[0.8rem]" />
            <span className="truncate">{m.name}</span>
          </span>
        }
        description={<span className="font-mono text-xs">{m.email} · {m.active ? "taking bookings" : "not taking bookings"}</span>}
        actions={
          <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => void remove()} disabled={deleting}>
            <Trash2 />{deleting ? "Deleting…" : "Delete"}
          </Button>
        }
      />
      <div className="grid gap-6 p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <ProfileCard member={m} onSaved={member.reload} />
          <ServicesCard member={m} onSaved={member.reload} />
          <WeeklyHoursCard staffId={m.id} hours={m.hours} timezone={branding.timezone} onSaved={member.reload} />
        </div>
        <aside>
          <Card>
            <CardHeader><CardTitle>Upcoming bookings</CardTitle></CardHeader>
            <CardContent className="p-0">
              {upcoming.error ? (
                <div className="p-4"><ErrorState error={upcoming.error} onRetry={upcoming.reload} /></div>
              ) : !upcoming.data ? (
                <LoadingRows rows={3} />
              ) : (
                <>
                  <BookingList bookings={upcoming.data.rows} show="customer" empty="Nothing booked yet." />
                  {upcoming.data.total > upcoming.data.rows.length ? (
                    <div className="border-t px-4 py-2.5">
                      <Button asChild variant="bracket"><Link to={`/app/bookings?staff=${m.id}`}>All {upcoming.data.total}</Link></Button>
                    </div>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}
