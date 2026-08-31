"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { deleteSupplier } from "./actions";

export function SupplierRowActions({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${name}"?`)) return;
    setLoading(true);
    try {
      await deleteSupplier(id);
      toast.success("Supplier deleted.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete this supplier.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-end gap-3 text-ink-soft">
      <Link href={`/admin/suppliers/${id}`} aria-label="View" className="hover:text-ink">
        <Eye size={15} />
      </Link>
      <Link href={`/admin/suppliers/${id}/edit`} aria-label="Edit" className="hover:text-ink">
        <Pencil size={15} />
      </Link>
      <button onClick={handleDelete} disabled={loading} aria-label="Delete" className="hover:text-sale">
        <Trash2 size={15} />
      </button>
    </div>
  );
}
