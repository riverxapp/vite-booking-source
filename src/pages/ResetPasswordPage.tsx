import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/common/Field";
import { AuthCard, FormError } from "@/components/site/AuthCard";
import { HOME } from "@/features/auth/api";
import { useAuth } from "@/features/auth/use-auth";
import { useForm } from "@/hooks/use-form";
import { errorMessage } from "@/lib/format";

export function ResetPasswordPage() {
  const token = useSearchParams()[0].get("token") ?? "";
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(token ? null : "This reset link is incomplete. Request a new one.");
  const { register, handleSubmit, formState } = useForm({ defaultValues: { password: "", confirm: "" } });
  const { errors } = formState;

  const onSubmit = handleSubmit(async ({ password, confirm }) => {
    if (password !== confirm) return setError("The two passwords don’t match.");
    setError(null);
    try {
      await resetPassword(token, password);
      navigate(HOME, { replace: true });
    } catch (e) {
      setError(errorMessage(e));
    }
  });

  return (
    <AuthCard
      eyebrow="Account"
      title="Choose a new password"
      subtitle="You’ll be signed in, and signed out everywhere else."
      onSubmit={onSubmit}
      footer={
        <>
          <FormError message={error} />
          <Button type="submit" className="w-full" disabled={!token || formState.isSubmitting}>
            {formState.isSubmitting ? "Saving…" : "Set new password"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Link expired? <Link to="/forgot-password" className="font-medium text-brand hover:underline">Request a new one</Link>
          </p>
        </>
      }
    >
      <FormField label="New password" htmlFor="reset-password" error={errors.password?.message}>
        <Input id="reset-password" type="password" autoComplete="new-password" autoFocus {...register("password", { validate: (v) => v.length >= 8 || "Use at least 8 characters" })} />
      </FormField>
      <FormField label="Confirm password" htmlFor="reset-confirm" error={errors.confirm?.message}>
        <Input id="reset-confirm" type="password" autoComplete="new-password" {...register("confirm", { validate: (v) => v.length > 0 || "Repeat the password" })} />
      </FormField>
    </AuthCard>
  );
}
