"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

interface Chip {
  key: string;
  value: string;
  label: string;
}

function buildChips(searchParams: URLSearchParams): Chip[] {
  const chips: Chip[] = [];
  searchParams.getAll("size").forEach((v) => chips.push({ key: "size", value: v, label: `Size: ${v}` }));
  searchParams.getAll("color").forEach((v) => chips.push({ key: "color", value: v, label: `Colour: ${v}` }));
  searchParams.getAll("brand").forEach((v) => chips.push({ key: "brand", value: v, label: `Brand: ${v}` }));
  const category = searchParams.get("category");
  if (category) chips.push({ key: "category", value: category, label: `Category: ${category}` });
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  if (minPrice || maxPrice) chips.push({ key: "price", value: "", label: `Price: ${minPrice ?? "0"} – ${maxPrice ?? "∞"}` });
  const rating = searchParams.get("rating");
  if (rating) chips.push({ key: "rating", value: rating, label: `${rating}+ stars` });
  if (searchParams.get("inStock")) chips.push({ key: "inStock", value: "1", label: "In Stock" });
  if (searchParams.get("onSale")) chips.push({ key: "onSale", value: "1", label: "On Sale" });
  const discount = searchParams.get("discount");
  if (discount) chips.push({ key: "discount", value: discount, label: `${discount}% Off or More` });
  return chips;
}

/** Removable chip row for active filters — previously there was no way to
 * see or remove individual filters, only a "Clear All" reset. */
export function ActiveFilterChips() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const chips = buildChips(searchParams);

  if (chips.length === 0) return null;

  function removeChip(chip: Chip) {
    const params = new URLSearchParams(searchParams.toString());
    if (chip.key === "price") {
      params.delete("minPrice");
      params.delete("maxPrice");
    } else if (["size", "color", "brand"].includes(chip.key)) {
      const remaining = params.getAll(chip.key).filter((v) => v !== chip.value);
      params.delete(chip.key);
      remaining.forEach((v) => params.append(chip.key, v));
    } else {
      params.delete(chip.key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button
          key={`${chip.key}-${chip.value}`}
          onClick={() => removeChip(chip)}
          className="flex items-center gap-1.5 border border-line px-3 py-1.5 text-xs capitalize hover:border-ink"
        >
          {chip.label} <X size={12} />
        </button>
      ))}
    </div>
  );
}
