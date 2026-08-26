"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Select, Textarea } from "@/components/admin/FormField";
import { updateReliabilityOverride } from "./actions";
import type { ReliabilityStatus } from "@/generated/prisma/client";

export function ReliabilityOverride({
  userId,
  computedStatus,
  currentOverride,
  currentNote,
}: {
  userId: string;
  computedStatus: ReliabilityStatus;
  currentOverride: ReliabilityStatus | null;
  currentNote: string | null;
}) {
  const [override, setOverride] = useState<ReliabilityStatus | "">(currentOverride ?? "");
  const [note, setNote] = useState(currentNote ?? "");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSave() {
    setLoading(true);
    try {
      await updateReliabilityOverride(userId, override || null, note);
      toast.success("Reliability status updated.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-ink-soft">
        Computed from order history: <strong>{computedStatus.replace(/_/g, " ")}</strong>. Set an override to take precedence.
      </p>
      <Select value={override} onChange={(e) => setOverride(e.target.value as ReliabilityStatus | "")}>
        <option value="">Use computed status ({computedStatus.replace(/_/g, " ")})</option>
        <option value="TRUSTED">Trusted Customer</option>
        <option value="NORMAL">Normal Customer</option>
        <option value="HIGH_RISK">High Risk Customer</option>
      </Select>
      <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason for override (optional)..." />
      <Button size="sm" onClick={handleSave} disabled={loading} className="self-start">
        Save Reliability Status
      </Button>
    </div>
  );
}
