import { getSettings } from "@/lib/settings";
import { SettingsForm } from "./SettingsForm";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Settings</h1>
      <SettingsForm initial={settings} />
    </div>
  );
}
