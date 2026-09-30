import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/common/Avatar";
import { FormField } from "@/components/common/Field";
import { SettingsCard } from "@/components/common/SettingsCard";
import { useAuth } from "@/features/auth/use-auth";
import { useForm } from "@/hooks/use-form";
import { errorMessage } from "@/lib/format";
import { toast } from "@/lib/toast";
import { validUrl } from "./validation";

/** Name, email and avatar of the signed-in admin. */
export function ProfileSettings({ description }: { description: string }) {
  const { user, updateProfile } = useAuth();
  const { register, handleSubmit, watch, formState } = useForm({
    defaultValues: { name: user?.name ?? "", email: user?.email ?? "", avatar: user?.avatar ?? "" },
  });
  const { errors } = formState;

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateProfile({ name: values.name.trim(), email: values.email.trim(), avatar: values.avatar.trim() });
      toast.success("Profile saved");
    } catch (e) {
      toast.error("Couldn’t save your profile", { description: errorMessage(e) });
    }
  });

  return (
    <SettingsCard title="Profile" description={description} onSubmit={onSubmit} pending={formState.isSubmitting}>
      <div className="flex items-center gap-3">
        <Avatar name={watch("name") || "?"} src={watch("avatar").trim() || null} className="h-12 w-12 text-sm" />
        <p className="text-sm text-muted-foreground">Your avatar appears in the sidebar and to your teammates.</p>
      </div>
      <FormField label="Name *" htmlFor="profile-name" error={errors.name?.message}>
        <Input id="profile-name" autoComplete="name" {...register("name", { validate: (v) => v.trim() !== "" || "Enter your name" })} />
      </FormField>
      <FormField label="Email *" htmlFor="profile-email" error={errors.email?.message}>
        <Input id="profile-email" type="email" autoComplete="email" className="font-mono" {...register("email", { validate: (v) => /^\S+@\S+\.\S+$/.test(v.trim()) || "Enter a valid email" })} />
      </FormField>
      <FormField label="Avatar URL" htmlFor="profile-avatar" error={errors.avatar?.message}>
        <Input id="profile-avatar" type="url" placeholder="https://…" className="font-mono" {...register("avatar", { validate: validUrl })} />
      </FormField>
    </SettingsCard>
  );
}
