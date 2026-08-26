import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminThemeProvider, type AdminTheme } from "@/components/admin/AdminThemeProvider";
import { ButtonLink } from "@/components/ui/Button";

export const metadata = { title: { template: "%s | Admin", default: "Admin Dashboard" } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const cookieStore = await cookies();
  const initialTheme: AdminTheme = cookieStore.get("admin-theme")?.value === "dark" ? "dark" : "light";

  if (!session?.user) redirect("/login?callbackUrl=/admin");

  if (session.user.role === "CUSTOMER") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper-dim px-6 text-center">
        <h1 className="font-display text-3xl">Access Denied</h1>
        <p className="max-w-sm text-ink-soft">
          Your account doesn&apos;t have permission to view the admin dashboard. Contact a store administrator if you
          believe this is a mistake.
        </p>
        <ButtonLink href="/">Back to Store</ButtonLink>
      </div>
    );
  }

  return (
    <AdminThemeProvider initialTheme={initialTheme} className="flex min-h-screen bg-paper-dim print:bg-paper">
      <AdminSidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <AdminTopbar name={session.user.name ?? "Admin"} role={session.user.role} />
        <main className="min-w-0 flex-1 p-4 print:p-0 lg:p-8">{children}</main>
      </div>
    </AdminThemeProvider>
  );
}
