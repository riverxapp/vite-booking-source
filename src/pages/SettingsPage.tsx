import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/common/Field";
import { PageHeader } from "@/components/common/PageHeader";
import { SettingsCard } from "@/components/common/SettingsCard";
import { useAuth } from "@/features/auth/use-auth";
import { saveBranding } from "@/features/branding/api";
import { useBranding } from "@/features/branding/use-branding";
import { ProfileSettings } from "@/features/settings/ProfileSettings";
import { validUrl } from "@/features/settings/validation";
import { defaultPortalIntro } from "@/features/portal/intro";
import { useForm } from "@/hooks/use-form";
import { errorMessage } from "@/lib/format";
import { toast } from "@/lib/toast";

const MAX_INTRO = 2000;

function HelpdeskSettings() {
  const { user } = useAuth();
  const branding = useBranding();
  const isAdmin = user?.role === "admin";
  const { register, handleSubmit, reset, watch, formState } = useForm({ defaultValues: { companyName: "", logoUrl: "", portalIntro: "" } });
  const { errors } = formState;

  // Branding loads after the page mounts; fill the form once it arrives.
  useEffect(() => {
    reset({ companyName: branding.companyName ?? "", logoUrl: branding.logoUrl ?? "", portalIntro: branding.portalIntro ?? "" });
  }, [branding.companyName, branding.logoUrl, branding.portalIntro, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await saveBranding({
        companyName: values.companyName.trim() || null,
        logoUrl: values.logoUrl.trim() || null,
        portalIntro: values.portalIntro.trim() || null,
      });
      branding.reload();
      toast.success("Helpdesk settings saved");
    } catch (e) {
      toast.error("Couldn’t save helpdesk settings", { description: errorMessage(e) });
    }
  });

  const logo = watch("logoUrl").trim();
  const intro = watch("portalIntro");
  return (
    <SettingsCard
      title="Helpdesk"
      description={isAdmin ? "Your brand and welcome message on the customer portal, login pages and sidebar." : "Only admins can change the helpdesk settings."}
      onSubmit={onSubmit}
      pending={formState.isSubmitting}
      disabled={!isAdmin}
    >
      <FormField label="Company name" htmlFor="helpdesk-name">
        <Input id="helpdesk-name" placeholder={branding.name} disabled={!isAdmin} {...register("companyName")} />
      </FormField>
      <FormField label="Company logo URL" htmlFor="helpdesk-logo" error={errors.logoUrl?.message}>
        <Input id="helpdesk-logo" type="url" placeholder="https://…/logo.png" className="font-mono" disabled={!isAdmin} {...register("logoUrl", { validate: validUrl })} />
      </FormField>
      {logo && validUrl(logo) === true ? (
        <div className="flex items-center gap-3 border bg-muted p-3">
          <img src={logo} alt="Logo preview" className="h-10 w-10 object-contain" />
          <span className="text-sm font-semibold">{watch("companyName").trim() || branding.name}</span>
        </div>
      ) : null}
      <FormField label="Portal introduction" htmlFor="helpdesk-intro" error={errors.portalIntro?.message}>
        <Textarea
          id="helpdesk-intro"
          rows={5}
          placeholder={defaultPortalIntro(watch("companyName").trim() || branding.name)}
          disabled={!isAdmin}
          {...register("portalIntro", { validate: (v) => v.length <= MAX_INTRO || `Keep it under ${MAX_INTRO.toLocaleString()} characters` })}
        />
        <p className="flex justify-between gap-2 text-xs text-muted-foreground">
          <span>Shown at the top of every customer’s dashboard. Plain text; line breaks are kept. Leave empty for the default.</span>
          <span className="shrink-0 font-mono tabular-nums">{intro.length}/{MAX_INTRO}</span>
        </p>
      </FormField>
    </SettingsCard>
  );
}

export function SettingsPage() {
  return (
    <>
      <PageHeader eyebrow="Helpdesk" title="Settings" description="Your profile and your helpdesk’s branding." />
      <div className="grid max-w-3xl gap-6 p-4 sm:p-6">
        <ProfileSettings description="How customers and teammates see you." />
        <HelpdeskSettings />
      </div>
    </>
  );
}
