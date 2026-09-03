"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { suspendStaff, activateStaff, deactivateStaff, resetStaffPassword } from "../actions";

export function ProfileActions({ userId, name, status }: { userId: string; name: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function run(action: () => Promise<void | { tempPassword: string }>, confirmMessage?: string) {
    if (confirmMessage && !confirm(confirmMessage)) return;
    setLoading(true);
    try {
      const result = await action();
      if (result && "tempPassword" in result) {
        window.alert(`Temporary password for ${name}:\n\n${result.tempPassword}\n\nShare this with them securely — it will not be shown again.`);
      }
      toast.success("Done.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="secondary"
        disabled={loading}
        onClick={() => run(() => resetStaffPassword(userId), `Reset ${name}'s password? Their current session will be signed out.`)}
      >
        Reset Password
      </Button>
      {status === "ACTIVE" && (
        <Button
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() => run(() => suspendStaff(userId), `Suspend ${name}? They will be signed out immediately.`)}
        >
          Suspend
        </Button>
      )}
      {status !== "DEACTIVATED" && (
        <Button
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() => run(() => deactivateStaff(userId), `Deactivate ${name}? This is meant for offboarding — they will be signed out immediately.`)}
        >
          Deactivate
        </Button>
      )}
      {status !== "ACTIVE" && (
        <Button size="sm" variant="secondary" disabled={loading} onClick={() => run(() => activateStaff(userId))}>
          Activate
        </Button>
      )}
    </div>
  );
}
