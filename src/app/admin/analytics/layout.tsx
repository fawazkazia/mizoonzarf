import { getSectionAccess } from "@/lib/admin-auth";
import { FINANCE_ROLES } from "@/lib/admin-permissions";
import { AccessDenied } from "@/components/admin/AccessDenied";

export default async function AnalyticsSectionLayout({ children }: { children: React.ReactNode }) {
  const session = await getSectionAccess(FINANCE_ROLES);
  if (!session) return <AccessDenied />;
  return <>{children}</>;
}
