"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { syncSystemStaffRoles } from "./actions";

/** Re-runs the system-role seed in place — mainly useful right after a fresh deploy/migration,
 * or if a system role's default permissions were updated in code and need pushing to the DB. */
export function SyncSystemRolesButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await syncSystemStaffRoles();
      toast.success("System roles synced.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't sync system roles.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="secondary" size="sm" disabled={loading} onClick={handleClick}>
      {loading ? "Syncing..." : "Sync System Roles"}
    </Button>
  );
}
