import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminThemeProvider, type AdminTheme } from "@/components/admin/AdminThemeProvider";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { CUSTOMER_CARE_ROLES } from "@/lib/admin-permissions";
import { getUnseenTicketCount } from "@/lib/data/customer-care-dashboard";

export const metadata = { title: { template: "%s | Admin", default: "Admin Dashboard" } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const cookieStore = await cookies();
  const initialTheme: AdminTheme = cookieStore.get("admin-theme")?.value === "dark" ? "dark" : "light";

  if (!session?.user) redirect("/login?callbackUrl=/admin");

  if (session.user.role === "CUSTOMER") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper-dim">
        <AccessDenied
          message="Your account doesn't have permission to view the admin dashboard. Contact a store administrator if you believe this is a mistake."
          backHref="/"
          backLabel="Back to Store"
        />
      </div>
    );
  }

  const unseenTicketCount = CUSTOMER_CARE_ROLES.includes(session.user.role as never)
    ? await getUnseenTicketCount()
    : 0;

  return (
    <AdminThemeProvider initialTheme={initialTheme} className="flex min-h-screen bg-paper-dim print:bg-paper">
      <AdminSidebar role={session.user.role} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <AdminTopbar name={session.user.name ?? "Admin"} role={session.user.role} unseenTicketCount={unseenTicketCount} />
        <main className="min-w-0 flex-1 p-4 print:p-0 lg:p-8">{children}</main>
      </div>
    </AdminThemeProvider>
  );
}
