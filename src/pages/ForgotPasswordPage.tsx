import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/common/Field";
import { AuthCard, FormError } from "@/components/site/AuthCard";
import { requestPasswordReset } from "@/features/auth/api";
import { useForm } from "@/hooks/use-form";
import { errorMessage } from "@/lib/format";

export function ForgotPasswordPage() {
  const [sent, setSent] = useState<{ devResetUrl?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm({ defaultValues: { email: "" } });

  const onSubmit = handleSubmit(async ({ email }) => {
    setError(null);
    try {
      setSent(await requestPasswordReset(email.trim()));
    } catch (e) {
      setError(errorMessage(e));
    }
  });

  return (
    <AuthCard
      eyebrow="Account"
      title="Reset your password"
      subtitle="We’ll send a reset link to your email."
      onSubmit={onSubmit}
      footer={
        <>
          <FormError message={error} />
          {sent ? null : (
            <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
              {formState.isSubmitting ? "Sending…" : "Send reset link"}
            </Button>
          )}
          <p className="text-center text-sm text-muted-foreground">
            Remembered it? <Link to="/login" className="font-medium text-brand hover:underline">Log in</Link>
          </p>
        </>
      }
    >
      {sent ? (
        <div role="status" className="space-y-3 text-sm">
          <p>If an account exists for that email, a reset link is on its way. It works for 60 minutes.</p>
          {sent.devResetUrl ? (
            <p className="border border-dashed bg-muted p-3 font-mono text-xs">
              Dev mode, no email provider configured:{" "}
              <a href={sent.devResetUrl} className="break-all text-brand underline">open the reset link</a>
            </p>
          ) : null}
        </div>
      ) : (
        <FormField label="Email" htmlFor="forgot-email" error={formState.errors.email?.message}>
          <Input
            id="forgot-email"
            type="email"
            autoComplete="email"
            autoFocus
            className="font-mono"
            {...register("email", { validate: (v) => /^\S+@\S+\.\S+$/.test(v.trim()) || "Enter a valid email" })}
          />
        </FormField>
      )}
    </AuthCard>
  );
}
