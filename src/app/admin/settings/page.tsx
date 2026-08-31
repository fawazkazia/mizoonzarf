import { getSettings } from "@/lib/settings";
import { ButtonLink } from "@/components/ui/Button";
import { SettingsForm } from "./SettingsForm";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Settings</h1>
        <ButtonLink href="/admin/settings/users" variant="secondary">
          Staff &amp; Roles
        </ButtonLink>
      </div>
      <SettingsForm initial={settings} />
    </div>
  );
}
