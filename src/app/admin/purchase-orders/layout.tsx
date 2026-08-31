import { getSectionAccess } from "@/lib/admin-auth";
import { ADMIN_NAV_ACCESS } from "@/lib/admin-permissions";
import { AccessDenied } from "@/components/admin/AccessDenied";

export default async function PurchaseOrdersSectionLayout({ children }: { children: React.ReactNode }) {
  const session = await getSectionAccess(ADMIN_NAV_ACCESS["/admin/purchase-orders"]);
  if (!session) return <AccessDenied />;
  return <>{children}</>;
}
