import { useEffect, useState } from "react";
import { Trash2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/common/Field";
import { OptionSelect } from "@/components/common/OptionSelect";
import { bookingConfig } from "@/config/booking";
import type { Service } from "@/db/schema";
import { Controller, useForm } from "@/hooks/use-form";
import { errorMessage, formatDuration } from "@/lib/format";
import { toast } from "@/lib/toast";
import { createService, deleteService, updateService } from "./api";

type Values = { name: string; description: string; duration: string; price: string; active: boolean };

const empty: Values = { name: "", description: "", duration: "60", price: "", active: true };

const toValues = (s: Service): Values => ({
  name: s.name,
  description: s.description ?? "",
  duration: String(s.durationMinutes),
  price: s.priceCents ? (s.priceCents / 100).toFixed(2) : "",
  active: s.active,
});

/** "25", "25.5", "25.50" → 2550. Empty means free. */
const toCents = (price: string) => (price.trim() ? Math.round(Number(price.trim()) * 100) : 0);

type ServiceSheetProps = {
  /** null: closed. "new": create. A service: edit it. */
  target: Service | "new" | null;
  onClose: () => void;
  onSaved: () => void;
};

export function ServiceSheet({ target, onClose, onSaved }: ServiceSheetProps) {
  const editing = target && target !== "new" ? target : null;
  const { register, control, handleSubmit, reset, formState } = useForm<Values>({ defaultValues: empty });
  const { errors } = formState;
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (target) reset(editing ? toValues(editing) : empty);
  }, [target, editing, reset]);

  const durationOptions = [...new Set([...bookingConfig.durations, ...(editing ? [editing.durationMinutes] : [])])]
    .sort((a, b) => a - b)
    .map((m) => ({ value: String(m), label: formatDuration(m) }));

  const onSubmit = handleSubmit(async (v) => {
    const input = { name: v.name.trim(), description: v.description.trim() || null, durationMinutes: Number(v.duration), priceCents: toCents(v.price), active: v.active };
    try {
      if (editing) await updateService(editing.id, input);
      else await createService(input);
      toast.success(editing ? "Service saved" : "Service added");
      onSaved();
    } catch (e) {
      toast.error("Couldn’t save the service", { description: errorMessage(e) });
    }
  });

  async function remove() {
    if (!editing || !window.confirm(`Delete “${editing.name}”? This can’t be undone.`)) return;
    setDeleting(true);
    try {
      await deleteService(editing.id);
      toast.success("Service deleted");
      onSaved();
    } catch (e) {
      toast.error("Couldn’t delete the service", { description: errorMessage(e) });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Sheet open={target !== null} onOpenChange={(open) => (open ? null : onClose())}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <form onSubmit={onSubmit} noValidate className="flex h-full flex-col">
          <div className="border-b px-5 py-4 pr-12">
            <SheetTitle className="text-lg font-bold">{editing ? "Edit service" : "New service"}</SheetTitle>
            <SheetDescription>Customers see the name, description, length and price.</SheetDescription>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            <FormField label="Name *" htmlFor="service-name" error={errors.name?.message}>
              <Input id="service-name" maxLength={120} {...register("name", { validate: (v) => v.trim() !== "" || "Enter a name" })} />
            </FormField>
            <FormField label="Description" htmlFor="service-description">
              <Textarea id="service-description" rows={3} maxLength={500} {...register("description")} />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Length" htmlFor="service-duration">
                <Controller control={control} name="duration" render={({ field }) => <OptionSelect id="service-duration" options={durationOptions} value={field.value} onChange={field.onChange} />} />
              </FormField>
              <FormField label={`Price (${bookingConfig.currency})`} htmlFor="service-price" error={errors.price?.message}>
                <Input
                  id="service-price"
                  inputMode="decimal"
                  placeholder="0.00"
                  className="font-mono"
                  {...register("price", { validate: (v) => !v.trim() || (/^\d+(\.\d{1,2})?$/.test(v.trim()) && Number(v) < 1_000_000) || "Use a price like 25 or 25.50" })}
                />
              </FormField>
            </div>
            <Controller
              control={control}
              name="active"
              render={({ field }) => (
                <label className="flex items-start gap-3 border bg-muted p-3 text-sm">
                  <Checkbox className="mt-0.5" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                  <span>
                    <span className="block font-medium">Bookable</span>
                    <span className="text-muted-foreground">Shown on the booking page. Hide it to stop new bookings; existing ones stay.</span>
                  </span>
                </label>
              )}
            />
          </div>
          <div className="flex items-center justify-between gap-2 border-t px-5 py-3">
            {editing ? (
              <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => void remove()} disabled={deleting}>
                <Trash2 />
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            ) : <span />}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={formState.isSubmitting}>{formState.isSubmitting ? "Saving…" : "Save"}</Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
