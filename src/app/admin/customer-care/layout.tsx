import { getSectionAccess } from "@/lib/admin-auth";
import { CUSTOMER_CARE_ROLES } from "@/lib/admin-permissions";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { CustomerCareTabs } from "./CustomerCareTabs";

export default async function CustomerCareSectionLayout({ children }: { children: React.ReactNode }) {
  const session = await getSectionAccess(CUSTOMER_CARE_ROLES);
  if (!session) return <AccessDenied />;
  return (
    <div>
      <CustomerCareTabs />
      {children}
    </div>
  );
}
