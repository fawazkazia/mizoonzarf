"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Trash2, Pencil } from "lucide-react";
import { deleteProduct, duplicateProduct } from "./actions";

export function ProductRowActions({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${name}"? This can't be undone.`)) return;
    setLoading(true);
    try {
      await deleteProduct(id);
      toast.success("Product deleted.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete this product.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDuplicate() {
    setLoading(true);
    try {
      const { id: newId } = await duplicateProduct(id);
      toast.success("Product duplicated as a draft.");
      router.push(`/admin/products/${newId}/edit`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't duplicate this product.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-end gap-3 text-ink-soft">
      <Link href={`/admin/products/${id}/edit`} aria-label="Edit" className="hover:text-ink">
        <Pencil size={15} />
      </Link>
      <button onClick={handleDuplicate} disabled={loading} aria-label="Duplicate" className="hover:text-ink">
        <Copy size={15} />
      </button>
      <button onClick={handleDelete} disabled={loading} aria-label="Delete" className="hover:text-sale">
        <Trash2 size={15} />
      </button>
    </div>
  );
}
