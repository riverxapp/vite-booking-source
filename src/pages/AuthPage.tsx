import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/common/Field";
import { AuthCard, FormError } from "@/components/site/AuthCard";
import { homeFor, isStaff, type AuthUser } from "@/features/auth/api";
import { useAuth } from "@/features/auth/use-auth";
import { useForm } from "@/hooks/use-form";
import { errorMessage } from "@/lib/format";

type Mode = "login" | "signup" | "agent-signup";
type Values = { name: string; email: string; password: string; code: string };

const copy = {
  login: { eyebrow: "Welcome back", title: "Log in", submit: "Log in" },
  signup: { eyebrow: "Get help", title: "Create your account", submit: "Create account" },
  "agent-signup": { eyebrow: "Support team", title: "Join as an agent", submit: "Create agent account" },
} as const;

/** `next` is honoured only when it points into the signed-in user's own area. */
function destination(user: AuthUser, next: string | null) {
  const area = isStaff(user) ? "/app" : "/portal";
  return next && (next === area || next.startsWith(`${area}/`) || next.startsWith(`${area}?`)) ? next : homeFor(user);
}

export function AuthPage({ mode }: { mode: Mode }) {
  const { user, loading, error: sessionError, signIn, signUp, signUpAgent } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next");
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<Values>({ defaultValues: { name: "", email: "", password: "", code: "" } });
  const text = copy[mode];
  const withNext = (path: string) => (next ? `${path}?next=${encodeURIComponent(next)}` : path);

  if (!loading && user) return <Navigate to={destination(user, next)} replace />;

  const onSubmit = handleSubmit(async ({ name, email, password, code }) => {
    setError(null);
    try {
      const signedIn =
        mode === "login"
          ? await signIn(email, password)
          : mode === "signup"
            ? await signUp({ name, email, password })
            : await signUpAgent({ name, email, password, code: code.trim() || undefined });
      navigate(destination(signedIn, next), { replace: true });
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
              New here?{" "}
              <Link to={withNext("/signup")} className="font-medium text-brand hover:underline">Create an account</Link>
            </p>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to={withNext("/login")} className="font-medium text-brand hover:underline">Log in</Link>
            </p>
          )}
          {mode === "signup" ? (
            <p className="text-center text-xs text-muted-foreground">
              On the support team? <Link to="/agent/signup" className="text-brand hover:underline">Join as an agent</Link>
            </p>
          ) : null}
        </>
      }
    >
      {mode !== "login" ? (
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
      ) : null}
      {mode === "agent-signup" ? (
        <FormField label="Team invite code" htmlFor="auth-code">
          <Input id="auth-code" autoComplete="off" className="font-mono" {...register("code")} />
          <p className="text-xs text-muted-foreground">
            Setting up the helpdesk? Leave this blank: the first agent account becomes the admin.
          </p>
        </FormField>
      ) : null}
    </AuthCard>
  );
}
