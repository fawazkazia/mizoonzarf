"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea, Checkbox, Fieldset } from "@/components/admin/FormField";
import { SingleImageUploader } from "@/components/admin/ImageUploader";
import { ObjectPositionSelect } from "@/components/admin/ObjectPositionSelect";
import { dimensionHint } from "@/lib/image-dimensions";
import { createCategory, updateCategory } from "./actions";
import type { CategoryInput } from "@/lib/validation/admin-category";
import type { ObjectPositionValue } from "@/lib/object-position";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export interface CategoryFormInitial {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  imageObjectPosition: ObjectPositionValue | null;
  gender: string;
  parentId: string;
  sortOrder: number;
  showInMenu: boolean;
  isActive: boolean;
  seoTitle: string;
  seoDescription: string;
}

export function CategoryForm({
  parentOptions,
  initial,
}: {
  parentOptions: { id: string; name: string }[];
  initial?: CategoryFormInitial;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.imageUrl ?? null);
  const [imageObjectPosition, setImageObjectPosition] = useState<ObjectPositionValue | null>(initial?.imageObjectPosition ?? null);
  const [gender, setGender] = useState(initial?.gender ?? "");
  const [parentId, setParentId] = useState(initial?.parentId ?? "");
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [showInMenu, setShowInMenu] = useState(initial?.showInMenu ?? true);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(initial?.seoDescription ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: CategoryInput = {
      name,
      slug,
      description: description || undefined,
      imageUrl,
      imageObjectPosition,
      gender: (gender || "") as CategoryInput["gender"],
      parentId: parentId || null,
      sortOrder,
      showInMenu,
      isActive,
      seoTitle: seoTitle || undefined,
      seoDescription: seoDescription || undefined,
    };

    setLoading(true);
    try {
      if (initial) {
        await updateCategory(initial.id, payload);
        toast.success("Category updated.");
      } else {
        await createCategory(payload);
        toast.success("Category created.");
      }
      router.push("/admin/categories");
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
        <Field label="Parent Category">
          <Select value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">None (top-level)</option>
            {parentOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Gender">
          <Select value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">Not specified</option>
            <option value="MEN">Men</option>
            <option value="WOMEN">Women</option>
            <option value="KIDS">Kids</option>
            <option value="UNISEX">Unisex</option>
          </Select>
        </Field>
        <Field label="Sort Order">
          <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
        </Field>
        <div className="flex items-center gap-6 sm:col-span-2">
          <Checkbox label="Show in menu" checked={showInMenu} onChange={(e) => setShowInMenu(e.target.checked)} />
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
          <Field
            label="Category Image"
            hint={`Used across the homepage (Shop Men/Women/Kids, Shop By Category) and category pages. ${dimensionHint("genderTriptychTile")}`}
          >
            <SingleImageUploader value={imageUrl} onChange={setImageUrl} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <ObjectPositionSelect value={imageObjectPosition} onChange={setImageObjectPosition} />
        </div>
      </Fieldset>

      <Fieldset title="SEO">
        <Field label="SEO Title">
          <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
        </Field>
        <Field label="SEO Description">
          <Input value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} />
        </Field>
      </Fieldset>

      <Button type="submit" size="lg" disabled={loading} className="self-start">
        {loading ? "Saving..." : initial ? "Save Changes" : "Create Category"}
      </Button>
    </form>
  );
}
