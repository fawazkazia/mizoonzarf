"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea, Checkbox, Fieldset } from "@/components/admin/FormField";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { createProduct, updateProduct } from "./actions";
import { generateBarcode, regenerateBarcode } from "../inventory/barcode-actions";
import type { ProductInput } from "@/lib/validation/admin-product";

interface VariantRow {
  key: string;
  id?: string;
  sku: string;
  barcode: string;
  size: string;
  color: string;
  colorHex: string;
  price: string;
  salePrice: string;
  stock: string;
  lowStockThreshold: string;
}

interface CategoryOption {
  id: string;
  name: string;
  indent: boolean;
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function emptyVariant(): VariantRow {
  return {
    key: Math.random().toString(36).slice(2),
    sku: "",
    barcode: "",
    size: "",
    color: "",
    colorHex: "",
    price: "",
    salePrice: "",
    stock: "10",
    lowStockThreshold: "5",
  };
}

export interface ProductFormInitial {
  id: string;
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  brandId: string;
  description: string;
  shortDescription: string;
  videoUrl: string;
  gender: string;
  material: string;
  fitInfo: string;
  careInstructions: string;
  sizeGuideType: string;
  fragranceFamily: string;
  fragranceTopNotes: string;
  fragranceHeartNotes: string;
  fragranceBaseNotes: string;
  concentration: string;
  tags: string;
  status: string;
  isFeatured: boolean;
  gstRate: string;
  hsnCode: string;
  seoTitle: string;
  seoDescription: string;
  images: string[];
  collectionSlugs: string[];
  variants: VariantRow[];
}

export function ProductForm({
  categories,
  brands,
  collections,
  initial,
}: {
  categories: CategoryOption[];
  brands: { id: string; name: string }[];
  collections: { slug: string; name: string }[];
  initial?: ProductFormInitial;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? "");
  const [brandId, setBrandId] = useState(initial?.brandId ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [shortDescription, setShortDescription] = useState(initial?.shortDescription ?? "");
  const [gender, setGender] = useState(initial?.gender ?? "UNISEX");
  const [material, setMaterial] = useState(initial?.material ?? "");
  const [fitInfo, setFitInfo] = useState(initial?.fitInfo ?? "");
  const [careInstructions, setCareInstructions] = useState(initial?.careInstructions ?? "");
  const [sizeGuideType, setSizeGuideType] = useState(initial?.sizeGuideType ?? "");
  const [fragranceFamily, setFragranceFamily] = useState(initial?.fragranceFamily ?? "");
  const [fragranceTopNotes, setFragranceTopNotes] = useState(initial?.fragranceTopNotes ?? "");
  const [fragranceHeartNotes, setFragranceHeartNotes] = useState(initial?.fragranceHeartNotes ?? "");
  const [fragranceBaseNotes, setFragranceBaseNotes] = useState(initial?.fragranceBaseNotes ?? "");
  const [concentration, setConcentration] = useState(initial?.concentration ?? "");
  const [tags, setTags] = useState(initial?.tags ?? "");
  const [gstRate, setGstRate] = useState(initial?.gstRate ?? "");
  const [hsnCode, setHsnCode] = useState(initial?.hsnCode ?? "");
  const [status, setStatus] = useState(initial?.status ?? "ACTIVE");
  const [isFeatured, setIsFeatured] = useState(initial?.isFeatured ?? false);
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(initial?.seoDescription ?? "");
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [collectionSlugs, setCollectionSlugs] = useState<string[]>(initial?.collectionSlugs ?? []);
  const [variants, setVariants] = useState<VariantRow[]>(initial?.variants ?? [emptyVariant()]);
  const [loading, setLoading] = useState(false);
  const [generatingKey, setGeneratingKey] = useState<string | null>(null);

  function updateVariant(key: string, patch: Partial<VariantRow>) {
    setVariants((prev) => prev.map((v) => (v.key === key ? { ...v, ...patch } : v)));
  }

  async function handleGenerateBarcode(v: VariantRow) {
    if (!v.id) return;
    setGeneratingKey(v.key);
    try {
      const result = v.barcode ? await regenerateBarcode(v.id) : await generateBarcode(v.id);
      updateVariant(v.key, { barcode: result.barcode });
      toast.success(v.barcode ? "Barcode regenerated." : "Barcode generated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't generate barcode.");
    } finally {
      setGeneratingKey(null);
    }
  }

  function toggleCollection(slug: string) {
    setCollectionSlugs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload: ProductInput = {
      name,
      slug,
      sku,
      categoryId,
      brandId: brandId || undefined,
      description,
      shortDescription: shortDescription || undefined,
      videoUrl: undefined,
      gender: gender as ProductInput["gender"],
      material: material || undefined,
      fitInfo: fitInfo || undefined,
      careInstructions: careInstructions || undefined,
      sizeGuideType: sizeGuideType || undefined,
      fragranceFamily: fragranceFamily || undefined,
      fragranceTopNotes: fragranceTopNotes || undefined,
      fragranceHeartNotes: fragranceHeartNotes || undefined,
      fragranceBaseNotes: fragranceBaseNotes || undefined,
      concentration: concentration || undefined,
      tags: tags || undefined,
      gstRate: gstRate ? Number(gstRate) : undefined,
      hsnCode: hsnCode || undefined,
      status: status as ProductInput["status"],
      isFeatured,
      seoTitle: seoTitle || undefined,
      seoDescription: seoDescription || undefined,
      images,
      collectionSlugs,
      variants: variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        barcode: v.barcode || undefined,
        size: v.size || undefined,
        color: v.color || undefined,
        colorHex: v.colorHex || undefined,
        price: Number(v.price),
        salePrice: v.salePrice ? Number(v.salePrice) : undefined,
        stock: Number(v.stock),
        lowStockThreshold: Number(v.lowStockThreshold || 5),
      })),
    };

    setLoading(true);
    try {
      if (initial) {
        await updateProduct(initial.id, payload);
        toast.success("Product updated.");
      } else {
        const { id } = await createProduct(payload);
        toast.success("Product created.");
        router.push(`/admin/products/${id}/edit`);
        return;
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Fieldset title="Basics">
        <Field label="Product Name">
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
        <Field label="SKU">
          <Input required value={sku} onChange={(e) => setSku(e.target.value.toUpperCase())} />
        </Field>
        <Field label="Category">
          <Select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.indent ? "— " : ""}
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Brand">
          <Select value={brandId} onChange={(e) => setBrandId(e.target.value)}>
            <option value="">No brand</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Gender">
          <Select value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="MEN">Men</option>
            <option value="WOMEN">Women</option>
            <option value="KIDS">Kids</option>
            <option value="UNISEX">Unisex</option>
          </Select>
        </Field>
        <Field label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
        </Field>
        <Field label="Tags (comma separated)" hint="e.g. wedding, classic, casual — powers the Style Finder">
          <Input value={tags} onChange={(e) => setTags(e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Checkbox label="Featured product" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
        </div>
      </Fieldset>

      <Fieldset title="GST">
        <Field label="GST Rate (%)" hint="Leave blank to use the store's default GST % from Settings.">
          <Input type="number" step="0.01" min={0} max={100} value={gstRate} onChange={(e) => setGstRate(e.target.value)} />
        </Field>
        <Field label="HSN/SAC Code">
          <Input value={hsnCode} onChange={(e) => setHsnCode(e.target.value)} />
        </Field>
      </Fieldset>

      <Fieldset title="Description">
        <div className="sm:col-span-2">
          <Field label="Short Description">
            <Input value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Full Description">
            <Textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </div>
      </Fieldset>

      <Fieldset title="Images">
        <div className="sm:col-span-2">
          <ImageUploader images={images} onChange={setImages} />
        </div>
      </Fieldset>

      <Fieldset title="Garment Details (optional)">
        <Field label="Material">
          <Input value={material} onChange={(e) => setMaterial(e.target.value)} />
        </Field>
        <Field label="Fit Info">
          <Input value={fitInfo} onChange={(e) => setFitInfo(e.target.value)} />
        </Field>
        <Field label="Care Instructions">
          <Input value={careInstructions} onChange={(e) => setCareInstructions(e.target.value)} />
        </Field>
        <Field label="Size Guide">
          <Select value={sizeGuideType} onChange={(e) => setSizeGuideType(e.target.value)}>
            <option value="">None</option>
            <option value="apparel">Apparel (adult)</option>
            <option value="kids">Kids</option>
          </Select>
        </Field>
      </Fieldset>

      <Fieldset title="Fragrance Details (perfumes only)">
        <Field label="Fragrance Family">
          <Input value={fragranceFamily} onChange={(e) => setFragranceFamily(e.target.value)} />
        </Field>
        <Field label="Concentration">
          <Input value={concentration} onChange={(e) => setConcentration(e.target.value)} placeholder="Eau de Parfum" />
        </Field>
        <Field label="Top Notes (comma separated)">
          <Input value={fragranceTopNotes} onChange={(e) => setFragranceTopNotes(e.target.value)} />
        </Field>
        <Field label="Heart Notes (comma separated)">
          <Input value={fragranceHeartNotes} onChange={(e) => setFragranceHeartNotes(e.target.value)} />
        </Field>
        <Field label="Base Notes (comma separated)">
          <Input value={fragranceBaseNotes} onChange={(e) => setFragranceBaseNotes(e.target.value)} />
        </Field>
      </Fieldset>

      <Fieldset title="Collections">
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          {collections.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => toggleCollection(c.slug)}
              className={`border px-3 py-1.5 text-xs ${collectionSlugs.includes(c.slug) ? "border-ink bg-ink text-paper" : "border-line"}`}
            >
              {c.name}
            </button>
          ))}
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

      <fieldset className="border border-line p-5">
        <legend className="px-2 font-display text-lg">Variants</legend>
        <p className="text-xs text-ink-soft">
          SKU, Barcode, Size, Colour, Colour swatch, Price, Sale Price, Stock, Low Stock Alert — a variant is flagged low stock once its
          stock falls to or below its Low Stock Alert number. Leave Barcode blank to auto-generate one on save, or type a real
          manufacturer/GS1 code to use that instead. New variants can only be generated/regenerated after the product is first saved.
        </p>
        <div className="mt-3 flex flex-col gap-4">
          {variants.map((v) => (
            <div key={v.key} className="grid gap-2 border border-line p-3 sm:grid-cols-9">
              <Input placeholder="SKU" required value={v.sku} onChange={(e) => updateVariant(v.key, { sku: e.target.value.toUpperCase() })} />
              <div className="flex gap-1">
                <Input
                  placeholder={v.id ? "Barcode" : "Barcode (auto on save)"}
                  value={v.barcode}
                  onChange={(e) => updateVariant(v.key, { barcode: e.target.value })}
                />
                {v.id && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="shrink-0"
                    disabled={generatingKey === v.key}
                    onClick={() => handleGenerateBarcode(v)}
                  >
                    {v.barcode ? "Regen" : "Generate"}
                  </Button>
                )}
              </div>
              <Input placeholder="Size" value={v.size} onChange={(e) => updateVariant(v.key, { size: e.target.value })} />
              <Input placeholder="Colour" value={v.color} onChange={(e) => updateVariant(v.key, { color: e.target.value })} />
              <Input type="color" value={v.colorHex || "#cccccc"} onChange={(e) => updateVariant(v.key, { colorHex: e.target.value })} className="p-1" />
              <Input placeholder="Price" type="number" step="0.01" required value={v.price} onChange={(e) => updateVariant(v.key, { price: e.target.value })} />
              <Input placeholder="Sale Price" type="number" step="0.01" value={v.salePrice} onChange={(e) => updateVariant(v.key, { salePrice: e.target.value })} />
              <Input placeholder="Stock" type="number" required value={v.stock} onChange={(e) => updateVariant(v.key, { stock: e.target.value })} />
              <div className="flex gap-2">
                <Input
                  placeholder="Low Stock Alert"
                  title="Flag this variant as low stock once its stock falls to or below this number"
                  type="number"
                  min={0}
                  required
                  value={v.lowStockThreshold}
                  onChange={(e) => updateVariant(v.key, { lowStockThreshold: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setVariants((prev) => prev.filter((row) => row.key !== v.key))}
                  disabled={variants.length === 1}
                  className="shrink-0 text-ink-soft hover:text-sale disabled:opacity-30"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          <Button type="button" variant="secondary" size="sm" className="self-start" onClick={() => setVariants((prev) => [...prev, emptyVariant()])}>
            <Plus size={14} /> Add Variant
          </Button>
        </div>
      </fieldset>

      <div className="flex gap-3">
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? "Saving..." : initial ? "Save Changes" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}
