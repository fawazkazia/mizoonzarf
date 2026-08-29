"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea, Checkbox, Fieldset } from "@/components/admin/FormField";
import { SingleImageUploader } from "@/components/admin/ImageUploader";
import { ObjectPositionSelect } from "@/components/admin/ObjectPositionSelect";
import { dimensionHint } from "@/lib/image-dimensions";
import { createCollection, updateCollection } from "./actions";
import type { CollectionInput } from "@/lib/validation/admin-collection";
import type { ObjectPositionValue } from "@/lib/object-position";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export interface CollectionFormInitial {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  imageObjectPosition: ObjectPositionValue | null;
  isActive: boolean;
  sortOrder: number;
  startDate: string;
  endDate: string;
  productIds: string[];
}

export function CollectionForm({
  allProducts,
  initial,
}: {
  allProducts: { id: string; name: string }[];
  initial?: CollectionFormInitial;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.imageUrl ?? null);
  const [imageObjectPosition, setImageObjectPosition] = useState<ObjectPositionValue | null>(initial?.imageObjectPosition ?? null);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [productIds, setProductIds] = useState<string[]>(initial?.productIds ?? []);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(
    () => allProducts.filter((p) => p.name.toLowerCase().includes(filter.toLowerCase())),
    [allProducts, filter]
  );

  function toggleProduct(id: string) {
    setProductIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: CollectionInput = {
      name,
      slug,
      description: description || undefined,
      imageUrl,
      imageObjectPosition,
      isActive,
      sortOrder,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      productIds,
    };

    setLoading(true);
    try {
      if (initial) {
        await updateCollection(initial.id, payload);
        toast.success("Collection updated.");
      } else {
        await createCollection(payload);
        toast.success("Collection created.");
      }
      router.push("/admin/collections");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Fieldset title="Details">
        <Field label="Name">
          <Input
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
          />
        </Field>
        <Field label="Slug">
          <Input
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
          />
        </Field>
        <Field label="Start Date (optional)">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        <Field label="End Date (optional)">
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </Field>
        <Field label="Sort Order">
          <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
        </Field>
        <div className="flex items-center">
          <Checkbox label="Active" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        </div>
        <div className="sm:col-span-2">
          <Field label="Description">
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </div>
      </Fieldset>

      <Fieldset title="Image">
        <div className="sm:col-span-2">
          <Field label="Collection Image" hint={dimensionHint("featuredCollectionTile")}>
            <SingleImageUploader
              value={imageUrl}
              onChange={setImageUrl}
              expectedDimensions={{ width: 1000, height: 450 }}
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <ObjectPositionSelect value={imageObjectPosition} onChange={setImageObjectPosition} />
        </div>
      </Fieldset>

      <fieldset className="border border-line p-5">
        <legend className="px-2 font-display text-lg">Products ({productIds.length} selected)</legend>
        <Input placeholder="Filter products..." value={filter} onChange={(e) => setFilter(e.target.value)} className="mt-3" />
        <div className="mt-3 max-h-72 overflow-y-auto border border-line">
          {filtered.map((p) => (
            <label key={p.id} className="flex items-center gap-2 border-b border-line px-3 py-2 text-sm last:border-0 hover:bg-paper-dim">
              <input type="checkbox" checked={productIds.includes(p.id)} onChange={() => toggleProduct(p.id)} />
              {p.name}
            </label>
          ))}
        </div>
      </fieldset>

      <Button type="submit" size="lg" disabled={loading} className="self-start">
        {loading ? "Saving..." : initial ? "Save Changes" : "Create Collection"}
      </Button>
    </form>
  );
}
