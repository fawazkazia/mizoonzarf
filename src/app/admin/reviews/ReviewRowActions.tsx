"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { setReviewApproval, deleteReview } from "./actions";

export function ReviewRowActions({ id, isApproved }: { id: string; isApproved: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      await setReviewApproval(id, !isApproved);
      toast.success(isApproved ? "Review hidden." : "Review approved.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this review?")) return;
    setLoading(true);
    try {
      await deleteReview(id);
      toast.success("Review deleted.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-end gap-3 text-ink-soft">
      <button onClick={toggle} disabled={loading} aria-label={isApproved ? "Hide" : "Approve"} className="hover:text-ink">
        {isApproved ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
      <button onClick={handleDelete} disabled={loading} aria-label="Delete" className="hover:text-sale">
        <Trash2 size={15} />
      </button>
    </div>
  );
}
