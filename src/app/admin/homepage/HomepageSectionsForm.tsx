"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronUp, ChevronDown, Eye, EyeOff, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/admin/FormField";
import { SectionConfigEditor } from "./SectionConfigEditor";
import { saveHomepageSections } from "./actions";
import type { ResolvedSection } from "@/lib/home-sections";
import { isConfigurableSection } from "@/lib/validation/homepage-section-config";

/** Sections whose content is already owned by a dedicated admin page —
 * cross-linked instead of duplicating a second edit surface for them.
 * (Brand strip content has no admin CRUD page in this app yet — seeded
 * data only — so it's intentionally left off this list rather than
 * pointing at a page that can't actually edit it.) */
const CONTENT_ELSEWHERE: Record<string, { label: string; href: string }> = {
  hero: { label: "Banners", href: "/admin/banners" },
  promoBanner: { label: "Banners", href: "/admin/banners" },
  flashSale: { label: "Promotions", href: "/admin/promotions" },
};

export function HomepageSectionsForm({ initial }: { initial: ResolvedSection[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

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

  function setConfig(index: number, config: Record<string, unknown>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, config } : item)));
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
          config: item.config,
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
        {items.map((item, index) => {
          const configurable = isConfigurableSection(item.key);
          const elsewhere = CONTENT_ELSEWHERE[item.key];
          const expanded = expandedKey === item.key;
          return (
            <div key={item.key} className="border-b border-line last:border-0">
              <div className="flex flex-wrap items-center gap-3 px-4 py-3">
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

                {configurable && (
                  <button
                    type="button"
                    onClick={() => setExpandedKey(expanded ? null : item.key)}
                    className="flex items-center gap-1 text-sm text-ink-soft hover:text-ink"
                  >
                    <ChevronRight size={14} className={expanded ? "rotate-90 transition-transform" : "transition-transform"} />
                    Edit content
                  </button>
                )}
                {!configurable && elsewhere && (
                  <Link href={elsewhere.href} className="text-xs uppercase tracking-[0.08em] text-ink-soft hover:text-ink">
                    Edit content in {elsewhere.label} →
                  </Link>
                )}
              </div>

              {configurable && expanded && isConfigurableSection(item.key) && (
                <div className="border-t border-line bg-paper-dim px-4 py-4">
                  <SectionConfigEditor sectionKey={item.key} config={item.config} onChange={(config) => setConfig(index, config)} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Button type="button" size="lg" disabled={loading} onClick={handleSave} className="self-start">
        {loading ? "Saving..." : "Save Layout"}
      </Button>
    </div>
  );
}
