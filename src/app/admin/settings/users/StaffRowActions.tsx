"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, Ban, UserCheck, KeyRound } from "lucide-react";
import { suspendStaff, activateStaff, resetStaffPassword } from "./actions";

export function StaffRowActions({ userId, name, status }: { userId: string; name: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSuspend() {
    if (!confirm(`Suspend ${name}? They will be signed out immediately and unable to log in until reactivated.`)) return;
    setLoading(true);
    try {
      await suspendStaff(userId);
      toast.success("Staff account suspended.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't suspend this account.");
    } finally {
      setLoading(false);
    }
  }

  async function handleActivate() {
    setLoading(true);
    try {
      await activateStaff(userId);
      toast.success("Staff account activated.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't activate this account.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    if (!confirm(`Reset ${name}'s password? Their current session will be signed out.`)) return;
    setLoading(true);
    try {
      const { tempPassword } = await resetStaffPassword(userId);
      window.alert(`Temporary password for ${name}:\n\n${tempPassword}\n\nShare this with them securely — it will not be shown again.`);
      toast.success("Password reset.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't reset this password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-end gap-3 text-ink-soft">
      <Link href={`/admin/settings/users/${userId}`} aria-label="View profile" title="View profile" className="hover:text-ink">
        <Eye size={15} />
      </Link>
      <button onClick={handleResetPassword} disabled={loading} aria-label="Reset password" title="Reset password" className="hover:text-ink">
        <KeyRound size={15} />
      </button>
      {status === "ACTIVE" ? (
        <button onClick={handleSuspend} disabled={loading} aria-label="Suspend" title="Suspend" className="hover:text-sale">
          <Ban size={15} />
        </button>
      ) : (
        <button onClick={handleActivate} disabled={loading} aria-label="Activate" title="Activate" className="hover:text-success">
          <UserCheck size={15} />
        </button>
      )}
    </div>
  );
}
