"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/admin/FormField";
import { updateCustomerNotes } from "./actions";

export function CustomerNotes({ userId, initialNotes, canEdit }: { userId: string; initialNotes: string; canEdit: boolean }) {
  const [notes, setNotes] = useState(initialNotes);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!canEdit) {
    return <p className="text-sm text-ink-soft">{initialNotes || "No notes yet. Super Admin access required to add notes."}</p>;
  }

  async function handleSave() {
    setLoading(true);
    try {
      await updateCustomerNotes(userId, notes);
      toast.success("Notes saved.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save notes.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes about this customer..." />
      <Button size="sm" onClick={handleSave} disabled={loading} className="self-start">
        Save Notes
      </Button>
    </div>
  );
}
