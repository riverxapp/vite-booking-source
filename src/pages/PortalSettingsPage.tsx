import { PageHeader } from "@/components/common/PageHeader";
import { ProfileSettings } from "@/features/settings/ProfileSettings";

export function PortalSettingsPage() {
  return (
    <>
      <PageHeader eyebrow="Account" title="Settings" description="How our support team sees you." />
      <div className="grid max-w-3xl gap-6 p-4 sm:p-6">
        <ProfileSettings description="Your name and avatar appear on every message you send us." />
      </div>
    </>
  );
}
