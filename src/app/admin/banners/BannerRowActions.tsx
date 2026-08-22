"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { deleteBanner } from "./actions";

export function BannerRowActions({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${title}"?`)) return;
    setLoading(true);
    try {
      await deleteBanner(id);
      toast.success("Banner deleted.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete this banner.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-end gap-3 text-ink-soft">
      <Link href={`/admin/banners/${id}/edit`} aria-label="Edit" className="hover:text-ink">
        <Pencil size={15} />
      </Link>
      <button onClick={handleDelete} disabled={loading} aria-label="Delete" className="hover:text-sale">
        <Trash2 size={15} />
      </button>
    </div>
  );
}
