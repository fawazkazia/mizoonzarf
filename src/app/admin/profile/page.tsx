import { auth } from "@/lib/auth";
import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";

export const metadata = { title: "My Profile" };

export default async function AdminProfilePage() {
  const session = await auth();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="font-display text-3xl">My Profile</h1>

      <div className="grid gap-4 border border-line p-5 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.08em] text-ink-soft">Name</p>
          <p className="mt-1 text-lg">{session!.user.name ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.08em] text-ink-soft">Email</p>
          <p className="mt-1 text-lg">{session!.user.email}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.08em] text-ink-soft">Role</p>
          <p className="mt-1 text-lg">{session!.user.role.replace(/_/g, " ")}</p>
        </div>
      </div>

      <ChangePasswordForm />
    </div>
  );
}
