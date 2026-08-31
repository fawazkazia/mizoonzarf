import { getSectionAccess } from "@/lib/admin-auth";
import { SETTINGS_ROLES } from "@/lib/admin-permissions";
import { AccessDenied } from "@/components/admin/AccessDenied";

export default async function SettingsSectionLayout({ children }: { children: React.ReactNode }) {
  const session = await getSectionAccess(SETTINGS_ROLES);
  if (!session) return <AccessDenied />;
  return <>{children}</>;
}
