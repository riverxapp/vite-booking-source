import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Briefcase, Plus } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar } from "@/components/common/Avatar";
import { FormField } from "@/components/common/Field";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, ErrorState, LoadingRows } from "@/components/common/States";
import { bookingConfig } from "@/config/booking";
import { createStaff, listStaff } from "@/features/staff/api";
import { useAsync } from "@/hooks/use-async";
import { useForm } from "@/hooks/use-form";
import { errorMessage, plural } from "@/lib/format";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

/** Seven day letters in week order, lit for working days. */
function WorkingDays({ days }: { days: number[] }) {
  const order = Array.from({ length: 7 }, (_, i) => (bookingConfig.weekStartsOn + i) % 7);
  return (
    <span className="flex gap-1 font-mono text-[0.68rem]" aria-label={days.length ? `Works ${order.filter((d) => days.includes(d)).map((d) => bookingConfig.weekdays[d]).join(", ")}` : "No working hours"}>
      {order.map((d) => (
        <span key={d} aria-hidden="true" className={cn("flex h-5 w-5 items-center justify-center border", days.includes(d) ? "border-brand/40 bg-brand-soft font-semibold text-brand" : "text-muted-foreground/60")}>
          {bookingConfig.weekdays[d][0]}
        </span>
      ))}
    </span>
  );
}

function AddStaffSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { register, handleSubmit, reset, formState } = useForm({ defaultValues: { name: "", email: "" } });
  const { errors } = formState;

  useEffect(() => {
    if (open) reset({ name: "", email: "" });
  }, [open, reset]);

  const onSubmit = handleSubmit(async ({ name, email }) => {
    try {
      const id = await createStaff({ name: name.trim(), email: email.trim().toLowerCase(), active: true });
      toast.success("Staff member added", { description: "They work Monday–Friday, 9–5 to start. Now choose their services." });
      navigate(`/app/staff/${id}`);
    } catch (e) {
      toast.error("Couldn’t add the staff member", { description: errorMessage(e) });
    }
  });

  return (
    <Sheet open={open} onOpenChange={(o) => (o ? null : onClose())}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <form onSubmit={onSubmit} noValidate className="flex h-full flex-col">
          <div className="border-b px-5 py-4 pr-12">
            <SheetTitle className="text-lg font-bold">Add staff</SheetTitle>
            <SheetDescription>Someone customers can book with. Staff don’t need an account.</SheetDescription>
          </div>
          <div className="flex-1 space-y-4 px-5 py-5">
            <FormField label="Name *" htmlFor="staff-name" error={errors.name?.message}>
              <Input id="staff-name" maxLength={120} {...register("name", { validate: (v) => v.trim() !== "" || "Enter a name" })} />
            </FormField>
            <FormField label="Email *" htmlFor="staff-email" error={errors.email?.message}>
              <Input id="staff-email" type="email" className="font-mono" {...register("email", { validate: (v) => /^\S+@\S+\.\S+$/.test(v.trim()) || "Enter a valid email" })} />
            </FormField>
          </div>
          <div className="flex justify-end gap-2 border-t px-5 py-3">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={formState.isSubmitting}>{formState.isSubmitting ? "Adding…" : "Add and continue"}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function StaffPage() {
  const navigate = useNavigate();
  const { data, error, loading, reload } = useAsync(listStaff, []);
  const [adding, setAdding] = useState(false);
  const addButton = <Button onClick={() => setAdding(true)}><Plus />Add staff</Button>;

  return (
    <>
      <PageHeader
        eyebrow="Booking"
        title="Staff"
        description={<span className="font-mono text-xs">{data ? plural(data.length, "person", "people") : " "}</span>}
        actions={addButton}
      />
      <div className="space-y-4 p-4 sm:p-6">
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading && !data ? (
          <LoadingRows rows={4} />
        ) : !data?.length ? (
          <EmptyState icon={Briefcase} title="No staff yet" description="Add the people customers book with, then set their services and working hours." action={addButton} />
        ) : (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="text-right">Services</TableHead>
                  <TableHead className="hidden sm:table-cell">Working days</TableHead>
                  <TableHead className="hidden lg:table-cell">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((m) => (
                  <TableRow key={m.id} className="cursor-pointer" onClick={() => navigate(`/app/staff/${m.id}`)}>
                    <TableCell>
                      <span className="flex items-center gap-3">
                        <Avatar name={m.name} />
                        <span className="min-w-0">
                          <Link to={`/app/staff/${m.id}`} className="block truncate font-medium hover:underline" onClick={(e) => e.stopPropagation()}>{m.name}</Link>
                          <span className="block truncate font-mono text-xs text-muted-foreground md:hidden">{m.email}</span>
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-xs">{m.email}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{m.serviceCount}</TableCell>
                    <TableCell className="hidden sm:table-cell"><WorkingDays days={m.workingDays} /></TableCell>
                    <TableCell className="hidden lg:table-cell"><span className="rx-meta">{m.active ? "Active" : "Inactive"}</span></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
      <AddStaffSheet open={adding} onClose={() => setAdding(false)} />
    </>
  );
}
