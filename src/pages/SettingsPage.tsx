import { useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/common/Field";
import { PageHeader } from "@/components/common/PageHeader";
import { SettingsCard } from "@/components/common/SettingsCard";
import { saveBranding } from "@/features/branding/api";
import { defaultBookingIntro } from "@/features/branding/intro";
import { useBranding } from "@/features/branding/use-branding";
import { ProfileSettings } from "@/features/settings/ProfileSettings";
import { validUrl } from "@/features/settings/validation";
import { useForm } from "@/hooks/use-form";
import { isValidTimeZone } from "@/lib/dates";
import { errorMessage } from "@/lib/format";
import { toast } from "@/lib/toast";

const MAX_INTRO = 2000;
const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

/** Every IANA zone the browser knows, for the time zone suggestions. */
function zoneList(): string[] {
  const intl = Intl as unknown as { supportedValuesOf?: (key: string) => string[] };
  return intl.supportedValuesOf?.("timeZone") ?? [];
}

function BusinessSettings() {
  const branding = useBranding();
  const { register, handleSubmit, reset, watch, formState } = useForm({ defaultValues: { companyName: "", logoUrl: "", bookingIntro: "", timezone: "" } });
  const { errors } = formState;
  const zones = useMemo(zoneList, []);

  // Branding loads after the page mounts; fill the form once it arrives. Until a
  // zone is saved, suggest the admin's own.
  useEffect(() => {
    if (!branding.loaded) return;
    reset({
      companyName: branding.companyName ?? "",
      logoUrl: branding.logoUrl ?? "",
      bookingIntro: branding.bookingIntro ?? "",
      timezone: branding.timezone === "UTC" ? browserZone : branding.timezone,
    });
  }, [branding.loaded, branding.companyName, branding.logoUrl, branding.bookingIntro, branding.timezone, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await saveBranding({
        companyName: values.companyName.trim() || null,
        logoUrl: values.logoUrl.trim() || null,
        bookingIntro: values.bookingIntro.trim() || null,
        timezone: values.timezone.trim(),
      });
      branding.reload();
      toast.success("Business settings saved");
    } catch (e) {
      toast.error("Couldn’t save business settings", { description: errorMessage(e) });
    }
  });

  const logo = watch("logoUrl").trim();
  const intro = watch("bookingIntro");
  const unsavedZone = branding.loaded && branding.timezone === "UTC" && browserZone !== "UTC";
  return (
    <SettingsCard title="Business" description="Your brand, the welcome text on the booking page, and the time zone your hours are in." onSubmit={onSubmit} pending={formState.isSubmitting}>
      <FormField label="Company name" htmlFor="business-name">
        <Input id="business-name" placeholder={branding.name} {...register("companyName")} />
      </FormField>
      <FormField label="Company logo URL" htmlFor="business-logo" error={errors.logoUrl?.message}>
        <Input id="business-logo" type="url" placeholder="https://…/logo.png" className="font-mono" {...register("logoUrl", { validate: validUrl })} />
      </FormField>
      {logo && validUrl(logo) === true ? (
        <div className="flex items-center gap-3 border bg-muted p-3">
          <img src={logo} alt="Logo preview" className="h-10 w-10 object-contain" />
          <span className="text-sm font-semibold">{watch("companyName").trim() || branding.name}</span>
        </div>
      ) : null}
      <FormField label="Time zone" htmlFor="business-timezone" error={errors.timezone?.message}>
        <Input
          id="business-timezone"
          list="business-timezones"
          className="font-mono"
          placeholder="Europe/London"
          {...register("timezone", { validate: (v) => (v.trim() !== "" && isValidTimeZone(v.trim())) || "Use an IANA time zone, like America/New_York" })}
        />
        <datalist id="business-timezones">
          {zones.map((z) => <option key={z} value={z} />)}
        </datalist>
        <p className="text-xs text-muted-foreground">
          Working hours and booking times are in this zone, and customers see times in it.
          {unsavedZone ? <span className="text-foreground"> Not saved yet: bookings use UTC until you save.</span> : null}
        </p>
      </FormField>
      <FormField label="Booking page introduction" htmlFor="business-intro" error={errors.bookingIntro?.message}>
        <Textarea
          id="business-intro"
          rows={4}
          placeholder={defaultBookingIntro(watch("companyName").trim() || branding.name)}
          {...register("bookingIntro", { validate: (v) => v.length <= MAX_INTRO || `Keep it under ${MAX_INTRO.toLocaleString()} characters` })}
        />
        <p className="flex justify-between gap-2 text-xs text-muted-foreground">
          <span>Shown on the home page and the first booking step. Plain text; line breaks are kept. Leave empty for the default.</span>
          <span className="shrink-0 font-mono tabular-nums">{intro.length}/{MAX_INTRO}</span>
        </p>
      </FormField>
    </SettingsCard>
  );
}

export function SettingsPage() {
  return (
    <>
      <PageHeader eyebrow="Booking" title="Settings" description="Your profile and your business." />
      <div className="grid max-w-3xl gap-6 p-4 sm:p-6">
        <ProfileSettings description="How your teammates see you." />
        <BusinessSettings />
      </div>
    </>
  );
}
