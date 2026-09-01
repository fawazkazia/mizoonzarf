"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { updateCustomerTags } from "../actions";

const SUGGESTED_TAGS = ["VIP", "Frequent Customer", "High Value", "Return Customer", "Payment Issue", "Delivery Issue", "Requires Follow-up"];

export function CustomerTags({ userId, initialTags }: { userId: string; initialTags: string[] }) {
  const router = useRouter();
  const [tags, setTags] = useState(initialTags);
  const [loading, setLoading] = useState(false);

  async function save(next: string[]) {
    setTags(next);
    setLoading(true);
    try {
      await updateCustomerTags(userId, next);
      router.refresh();
    } catch (err) {
      setTags(tags);
      toast.error(err instanceof Error ? err.message : "Couldn't update tags.");
    } finally {
      setLoading(false);
    }
  }

  const available = SUGGESTED_TAGS.filter((t) => !tags.includes(t));

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag) => (
        <Badge key={tag} tone="gold" className="flex items-center gap-1.5">
          {tag}
          <button
            type="button"
            disabled={loading}
            onClick={() => save(tags.filter((t) => t !== tag))}
            aria-label={`Remove tag ${tag}`}
            className="hover:opacity-70"
          >
            <X size={10} />
          </button>
        </Badge>
      ))}
      {available.length > 0 && (
        <div className="relative inline-block">
          <select
            disabled={loading}
            value=""
            onChange={(e) => e.target.value && save([...tags, e.target.value])}
            className="border border-dashed border-line bg-paper px-2 py-1 text-xs text-ink-soft outline-none"
          >
            <option value="">
              + Add tag
            </option>
            {available.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
