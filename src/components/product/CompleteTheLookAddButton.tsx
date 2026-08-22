"use client";

import { Plus } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { useQuickViewStore } from "@/stores/quick-view-store";

export function CompleteTheLookAddButton({
  slug,
  defaultVariantId,
  variantCount,
}: {
  slug: string;
  defaultVariantId: string | null;
  variantCount: number;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const openQuickView = useQuickViewStore((s) => s.open);

  function handleClick() {
    if (variantCount <= 1 && defaultVariantId) addItem(defaultVariantId, 1, true);
    else openQuickView(slug);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Add to bag"
      className="flex h-9 w-9 shrink-0 items-center justify-center self-center border border-line hover:border-ink"
    >
      <Plus size={16} />
    </button>
  );
}
