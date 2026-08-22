"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronUp, ChevronDown, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/admin/FormField";
import { saveHomepageSections } from "./actions";
import type { ResolvedSection } from "@/lib/home-sections";

export function HomepageSectionsForm({ initial }: { initial: ResolvedSection[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [loading, setLoading] = useState(false);

  function move(index: number, dir: -1 | 1) {
    setItems((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function toggleVisible(index: number) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, isVisible: !item.isVisible } : item)));
  }

  function setTitle(index: number, title: string) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, title } : item)));
  }

  async function handleSave() {
    setLoading(true);
    try {
      await saveHomepageSections(
        items.map((item, index) => ({
          key: item.key,
          isVisible: item.isVisible,
          sortOrder: index,
          title: item.title,
        }))
      );
      toast.success("Homepage layout saved.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-line bg-paper">
        {items.map((item, index) => (
          <div
            key={item.key}
            className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3 last:border-0"
          >
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label="Move up"
                className="text-ink-soft hover:text-ink disabled:opacity-20"
              >
                <ChevronUp size={14} />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === items.length - 1}
                aria-label="Move down"
                className="text-ink-soft hover:text-ink disabled:opacity-20"
              >
                <ChevronDown size={14} />
              </button>
            </div>

            <span className="w-6 text-xs text-ink-soft">{index + 1}</span>

            <div className="min-w-40 flex-1 font-medium">{item.label}</div>

            <Input
              placeholder="Custom title (optional)"
              value={item.title ?? ""}
              onChange={(e) => setTitle(index, e.target.value)}
              className="w-56"
            />

            <button
              type="button"
              onClick={() => toggleVisible(index)}
              className="flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
            >
              {item.isVisible ? <Eye size={15} /> : <EyeOff size={15} />}
              {item.isVisible ? "Visible" : "Hidden"}
            </button>
          </div>
        ))}
      </div>

      <Button type="button" size="lg" disabled={loading} onClick={handleSave} className="self-start">
        {loading ? "Saving..." : "Save Layout"}
      </Button>
    </div>
  );
}
