import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/common/Field";
import { AuthCard, FormError } from "@/components/site/AuthCard";
import { HOME } from "@/features/auth/api";
import { useAuth } from "@/features/auth/use-auth";
import { useForm } from "@/hooks/use-form";
import { errorMessage } from "@/lib/format";

type Mode = "login" | "signup";
type Values = { name: string; email: string; password: string; code: string };

const copy = {
  login: { eyebrow: "Team", title: "Log in", submit: "Log in" },
  signup: { eyebrow: "Team", title: "Create an admin account", submit: "Create account" },
} as const;

/** `next` is honoured only when it points into the admin dashboard. */
function destination(next: string | null) {
  return next && (next === HOME || next.startsWith(`${HOME}/`) || next.startsWith(`${HOME}?`)) ? next : HOME;
}

/** Only the team logs in: customers book as guests on /book. */
export function AuthPage({ mode }: { mode: Mode }) {
  const { user, loading, error: sessionError, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next");
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<Values>({ defaultValues: { name: "", email: "", password: "", code: "" } });
  const text = copy[mode];
  const withNext = (path: string) => (next ? `${path}?next=${encodeURIComponent(next)}` : path);

  if (!loading && user) return <Navigate to={destination(next)} replace />;

  const onSubmit = handleSubmit(async ({ name, email, password, code }) => {
    setError(null);
    try {
      if (mode === "login") await signIn(email, password);
      else await signUp({ name, email, password, code: code.trim() || undefined });
      navigate(destination(next), { replace: true });
    } catch (e) {
      setError(errorMessage(e));
    }
  });

  const { errors } = formState;

  return (
    <AuthCard
      eyebrow={text.eyebrow}
      title={text.title}
      onSubmit={onSubmit}
      footer={
        <>
          <FormError message={error ?? sessionError} />
          <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? "Please wait…" : text.submit}
          </Button>
          {mode === "login" ? (
            <p className="text-center text-sm text-muted-foreground">
              Joining the team?{" "}
              <Link to={withNext("/signup")} className="font-medium text-brand hover:underline">Create an account</Link>
            </p>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to={withNext("/login")} className="font-medium text-brand hover:underline">Log in</Link>
            </p>
          )}
          <p className="text-center text-xs text-muted-foreground">
            Here to book? <Link to="/book" className="text-brand hover:underline">No account needed</Link>
          </p>
        </>
      }
    >
      {mode === "signup" ? (
        <FormField label="Full name" htmlFor="auth-name" error={errors.name?.message}>
          <Input id="auth-name" autoComplete="name" autoFocus {...register("name", { validate: (v) => v.trim() !== "" || "Enter your name" })} />
        </FormField>
      ) : null}
      <FormField label="Email" htmlFor="auth-email" error={errors.email?.message}>
        <Input
          id="auth-email"
          type="email"
          autoComplete="email"
          autoFocus={mode === "login"}
          className="font-mono"
          {...register("email", { validate: (v) => /^\S+@\S+\.\S+$/.test(v) || "Enter a valid email" })}
        />
      </FormField>
      <FormField label="Password" htmlFor="auth-password" error={errors.password?.message}>
        <Input
          id="auth-password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          {...register("password", {
            validate: (v) => (mode === "login" ? v.length > 0 || "Enter your password" : v.length >= 8 || "Use at least 8 characters"),
          })}
        />
      </FormField>
      {mode === "login" ? (
        <Link to="/forgot-password" className="inline-block text-sm text-brand hover:underline">Forgot your password?</Link>
      ) : (
        <FormField label="Team invite code" htmlFor="auth-code">
          <Input id="auth-code" autoComplete="off" className="font-mono" {...register("code")} />
          <p className="text-xs text-muted-foreground">
            Setting up for the first time? Leave this blank: the first account needs no code.
          </p>
        </FormField>
      )}
    </AuthCard>
  );
}
