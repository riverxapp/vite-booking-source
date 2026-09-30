import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/common/Field";
import { PageHeader } from "@/components/common/PageHeader";
import { createTicket } from "@/features/portal/api";
import { useForm } from "@/hooks/use-form";
import { errorMessage } from "@/lib/format";
import { toast } from "@/lib/toast";

export function PortalNewTicketPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState } = useForm({ defaultValues: { subject: "", message: "" } });
  const { errors } = formState;

  const onSubmit = handleSubmit(async ({ subject, message }) => {
    try {
      const { ticketNumber } = await createTicket({ subject: subject.trim(), message: message.trim() });
      toast.success(`Ticket #${ticketNumber} submitted`, { description: "We’ll reply here and you can follow along." });
      navigate(`/portal/tickets/${ticketNumber}`, { replace: true });
    } catch (e) {
      toast.error("Couldn’t submit your ticket", { description: errorMessage(e) });
    }
  });

  return (
    <>
      <PageHeader
        eyebrow={
          <span>
            <Link to="/portal/tickets" className="hover:text-foreground">Tickets</Link>
            <span className="px-1.5">/</span>New
          </span>
        }
        title="New ticket"
        description="Describe the problem and we’ll get back to you."
      />
      <div className="max-w-3xl p-4 sm:p-6">
        <Card>
          <form onSubmit={onSubmit} noValidate>
            <div className="space-y-4 p-4 sm:p-5">
              <FormField label="Subject" htmlFor="ticket-subject" error={errors.subject?.message}>
                <Input id="ticket-subject" autoFocus maxLength={200} {...register("subject", { validate: (v) => v.trim() !== "" || "Add a subject" })} />
              </FormField>
              <FormField label="Message" htmlFor="ticket-message" error={errors.message?.message}>
                <Textarea
                  id="ticket-message"
                  rows={8}
                  placeholder="What happened, and what did you expect?"
                  {...register("message", { validate: (v) => v.trim() !== "" || "Write a message" })}
                />
              </FormField>
            </div>
            <div className="flex justify-end gap-2 border-t px-4 py-3">
              <Button asChild variant="outline"><Link to="/portal/tickets">Cancel</Link></Button>
              <Button type="submit" disabled={formState.isSubmitting}>{formState.isSubmitting ? "Submitting…" : "Submit"}</Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
