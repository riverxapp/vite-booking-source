import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/common/Field";
import type { useForm } from "@/hooks/use-form";

export type DetailsValues = { name: string; email: string; phone: string; notes: string };

type DetailsStepProps = {
  register: ReturnType<typeof useForm<DetailsValues>>["register"];
  errors: Partial<Record<keyof DetailsValues, { message: string }>>;
  onSubmit: (e?: FormEvent) => void;
  pending: boolean;
};

const MAX_NOTES = 1000;

/** Enter Details: the last step before the booking is made. The form state lives in the page. */
export function DetailsStep({ register, errors, onSubmit, pending }: DetailsStepProps) {
  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="space-y-4 p-4 sm:p-5">
        <FormField label="Full name" htmlFor="book-name" error={errors.name?.message}>
          <Input id="book-name" autoComplete="name" maxLength={120} {...register("name", { validate: (v) => v.trim() !== "" || "Enter your name" })} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Email" htmlFor="book-email" error={errors.email?.message}>
            <Input
              id="book-email"
              type="email"
              autoComplete="email"
              className="font-mono"
              {...register("email", { validate: (v) => /^\S+@\S+\.\S+$/.test(v.trim()) || "Enter a valid email" })}
            />
          </FormField>
          <FormField label="Phone" htmlFor="book-phone" error={errors.phone?.message}>
            <Input
              id="book-phone"
              type="tel"
              autoComplete="tel"
              className="font-mono"
              {...register("phone", { validate: (v) => (/^[\d\s()+.-]+$/.test(v.trim()) && v.replace(/\D/g, "").length >= 7) || "Enter a valid phone number" })}
            />
          </FormField>
        </div>
        <FormField label="Notes (optional)" htmlFor="book-notes" error={errors.notes?.message}>
          <Textarea
            id="book-notes"
            rows={3}
            placeholder="Anything we should know before your appointment?"
            {...register("notes", { validate: (v) => v.length <= MAX_NOTES || `Keep it under ${MAX_NOTES.toLocaleString()} characters` })}
          />
        </FormField>
      </div>
      <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t px-4 py-3 sm:flex-row sm:items-center">
        <p className="rx-meta">We’ll email your confirmation.</p>
        <Button type="submit" disabled={pending}>{pending ? "Booking…" : "Confirm booking"}</Button>
      </div>
    </form>
  );
}
