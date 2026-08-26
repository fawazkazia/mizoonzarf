"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Field, Select, Input, Textarea } from "@/components/admin/FormField";
import { updateReturnStatus } from "./actions";
import type { ReturnStatus } from "@/generated/prisma/client";

const STATUSES: ReturnStatus[] = ["REQUESTED", "APPROVED", "REJECTED", "PICKUP", "RECEIVED", "REFUND_PROCESSING", "REFUNDED"];

export function ReturnStatusUpdater({
  returnId,
  currentStatus,
  currentRefundAmount,
  currentAdminNote,
}: {
  returnId: string;
  currentStatus: ReturnStatus;
  currentRefundAmount: number | null;
  currentAdminNote: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [refundAmount, setRefundAmount] = useState(currentRefundAmount != null ? String(currentRefundAmount) : "");
  const [adminNote, setAdminNote] = useState(currentAdminNote ?? "");
  const [loading, setLoading] = useState(false);

  const isFinal = currentStatus === "REFUNDED";

  async function handleUpdate() {
    setLoading(true);
    try {
      await updateReturnStatus(returnId, status, {
        adminNote: adminNote || undefined,
        refundAmount: refundAmount ? Number(refundAmount) : undefined,
      });
      toast.success("Return updated.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update the return.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-line p-5">
      <h2 className="mb-4 font-display text-lg">Manage Return</h2>
      {isFinal ? (
        <p className="text-sm text-ink-soft">This return has been refunded and is now closed.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value as ReturnStatus)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Refund Amount (optional)">
            <Input type="number" step="0.01" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
          </Field>
          <Field label="Note to customer (optional)" hint="Shown to the customer on their Returns page — e.g. a rejection reason.">
            <Textarea rows={2} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} />
          </Field>
          <Button onClick={handleUpdate} disabled={loading} size="sm" className="self-start">
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      )}
    </div>
  );
}
