import type { FormEvent, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SettingsCardProps = {
  title: string;
  description: ReactNode;
  onSubmit: (e: FormEvent) => void;
  pending: boolean;
  /** Read-only: hides the save band. */
  disabled?: boolean;
  children: ReactNode;
};

/** A settings form as one ruled card: header, fields, save band. */
export function SettingsCard({ title, description, onSubmit, pending, disabled, children }: SettingsCardProps) {
  return (
    <Card>
      <form onSubmit={onSubmit} noValidate>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">{children}</CardContent>
        {disabled ? null : (
          <div className="flex justify-end border-t px-4 py-3">
            <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save changes"}</Button>
          </div>
        )}
      </form>
    </Card>
  );
}
