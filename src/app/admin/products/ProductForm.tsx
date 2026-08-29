"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea, Checkbox, Fieldset } from "@/components/admin/FormField";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { createProduct, updateProduct } from "./actions";
import { generateBarcode, regenerateBarcode } from "../inventory/barcode-actions";
import { addAttributeLibraryValues } from "./attribute-library-actions";
import { AttributeValueMultiSelect } from "@/components/admin/AttributeValueMultiSelect";
import { comboKey, type VariantAttr } from "@/lib/inventory/variant-attributes";
import type { ProductInput } from "@/lib/validation/admin-product";

interface VariantRow {
  key: string;
  id?: string;
  sku: string;
  barcode: string;
  attributeValues: VariantAttr[];
  price: string;
  salePrice: string;
  stock: string;
  lowStockThreshold: string;
}

interface AttributeDefRow {
  key: string;
  name: string;
  isColor: boolean;
  values: { value: string; hex?: string }[];
}

interface AttributeLibraryEntry {
  name: string;
  isColor: boolean;
  values: { value: string; hex?: string }[];
}

interface CategoryOption {
  id: string;
  name: string;
  indent: boolean;
}

const PREDEFINED_ATTRIBUTES = ["Size", "Colour", "Shoe Size", "Waist", "Length/Inseam", "Fit", "Width", "Material", "Pack Size", "Style", "Sleeve"];

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function emptyVariant(attributeValues: VariantAttr[] = []): VariantRow {
  return {
    key: Math.random().toString(36).slice(2),
    sku: "",
    barcode: "",
    attributeValues,
    price: "",
    salePrice: "",
    stock: "10",
    lowStockThreshold: "5",
  };
}

/** Cartesian product of every attribute's value pool — one combo per possible variant. */
function cartesianCombos(defs: AttributeDefRow[]): VariantAttr[][] {
  return defs.reduce<VariantAttr[][]>((acc, def) => {
    const axisValues: VariantAttr[] = def.values.map((v) => ({ name: def.name, value: v.value, hex: def.isColor ? v.hex : undefined }));
    if (acc.length === 0) return axisValues.map((v) => [v]);
    const next: VariantAttr[][] = [];
    for (const combo of acc) for (const v of axisValues) next.push([...combo, v]);
    return next;
  }, []);
}

function AttributeValueInput({ onAdd }: { onAdd: (raw: string) => void }) {
  const [text, setText] = useState("");
  function commit() {
    if (text.trim()) {
      onAdd(text);
      setText("");
    }
  }
  return (
    <div className="flex gap-2">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
        placeholder="New value, press Enter (comma-separate for several)"
        className="w-full"
      />
      <Button type="button" variant="secondary" size="sm" className="shrink-0" onClick={commit}>
        + Add New Value
      </Button>
    </div>
  );
}

function CustomAttributeAdder({ onAdd }: { onAdd: (name: string) => void }) {
  const [name, setName] = useState("");
  function commit() {
    if (name.trim()) {
      onAdd(name);
      setName("");
    }
  }
  return (
    <div className="flex items-center gap-1">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
        placeholder="Custom attribute"
        className="border border-line bg-paper px-2 py-1.5 text-xs outline-none focus:border-ink"
      />
      <button type="button" onClick={commit} className="border border-line px-2 py-1.5 text-xs hover:border-ink">
        + Add Attribute
      </button>
    </div>
  );
}

function AttributeDefEditor({
  def,
  libraryValues,
  onRemove,
  onAddValues,
  onRemoveValue,
  onToggleLibraryValue,
  onHexChange,
  onToggleColor,
}: {
  def: AttributeDefRow;
  libraryValues: { value: string; hex?: string }[];
  onRemove: () => void;
  onAddValues: (raw: string) => void;
  onRemoveValue: (value: string) => void;
  onToggleLibraryValue: (v: { value: string; hex?: string }) => void;
  onHexChange: (value: string, hex: string) => void;
  onToggleColor: (isColor: boolean) => void;
}) {
  return (
    <div className="border border-line p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{def.name}</span>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-ink-soft">
            <input type="checkbox" checked={def.isColor} onChange={(e) => onToggleColor(e.target.checked)} />
            Colour swatches
          </label>
          <button type="button" onClick={onRemove} className="text-ink-soft hover:text-sale" title={`Remove ${def.name} attribute`}>
            <X size={14} />
          </button>
        </div>
      </div>
      {def.values.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {def.values.map((v) => (
            <span key={v.value} className="inline-flex items-center gap-1.5 border border-line px-2 py-1 text-xs">
              {def.isColor && (
                <input
                  type="color"
                  value={v.hex || "#cccccc"}
                  onChange={(e) => onHexChange(v.value, e.target.value)}
                  className="h-4 w-4 shrink-0 border-0 p-0"
                  title={`${v.value} swatch`}
                />
              )}
              {v.value}
              <button type="button" onClick={() => onRemoveValue(v.value)} className="text-ink-soft hover:text-sale">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-start gap-2">
        <AttributeValueMultiSelect
          libraryValues={libraryValues}
          selectedValues={def.values.map((v) => v.value)}
          isColor={def.isColor}
          onToggle={onToggleLibraryValue}
        />
        <div className="min-w-[16rem] flex-1">
          <AttributeValueInput onAdd={onAddValues} />
        </div>
      </div>
    </div>
  );
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
  variantAttributes: { name: string; isColor: boolean; position: number; values: { value: string; hex?: string }[] }[];
  variants: VariantRow[];
}

export function ProductForm({
  categories,
  brands,
  collections,
  attributeLibrary,
  initial,
}: {
  categories: CategoryOption[];
  brands: { id: string; name: string }[];
  collections: { slug: string; name: string }[];
  attributeLibrary: AttributeLibraryEntry[];
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

  const [attributeDefs, setAttributeDefs] = useState<AttributeDefRow[]>(() =>
    (initial?.variantAttributes ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((a) => ({ key: Math.random().toString(36).slice(2), name: a.name, isColor: a.isColor, values: a.values }))
  );
  const [hasVariants, setHasVariants] = useState(
    (initial?.variantAttributes ?? []).length > 0 || (initial?.variants ?? []).some((v) => v.attributeValues.length > 0)
  );
  const [variants, setVariants] = useState<VariantRow[]>(initial?.variants ?? [emptyVariant()]);
  const [library, setLibrary] = useState<AttributeLibraryEntry[]>(attributeLibrary);
  const [loading, setLoading] = useState(false);
  const [generatingKey, setGeneratingKey] = useState<string | null>(null);

  // Only flag rows as "no longer valid" once every attribute actually has values to generate
  // from — otherwise every existing row would flash as stale the instant an admin starts adding
  // a new attribute, before they've had a chance to fill in its values.
  const validComboKeys = useMemo(() => {
    if (!hasVariants || attributeDefs.length === 0 || attributeDefs.some((d) => d.values.length === 0)) return null;
    return new Set(cartesianCombos(attributeDefs).map((c) => comboKey(c)));
  }, [hasVariants, attributeDefs]);

  function isStale(v: VariantRow) {
    return validComboKeys !== null && !validComboKeys.has(comboKey(v.attributeValues));
  }

  function updateVariant(key: string, patch: Partial<VariantRow>) {
    setVariants((prev) => prev.map((v) => (v.key === key ? { ...v, ...patch } : v)));
  }

  function removeVariantRow(key: string) {
    setVariants((prev) => (prev.length > 1 ? prev.filter((v) => v.key !== key) : prev));
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

  function handleToggleHasVariants(checked: boolean) {
    setHasVariants(checked);
    if (!checked) {
      // Collapse to a single default variant, but keep whatever SKU/price/stock the admin
      // already entered — only the attribute combination is cleared.
      setAttributeDefs([]);
      setVariants((prev) => [{ ...(prev[0] ?? emptyVariant()), attributeValues: [] }]);
    }
  }

  function addAttributeDef(rawName: string) {
    const trimmed = rawName.trim();
    if (!trimmed) return;
    setAttributeDefs((prev) => {
      if (prev.some((d) => d.name.toLowerCase() === trimmed.toLowerCase())) return prev;
      return [...prev, { key: Math.random().toString(36).slice(2), name: trimmed, isColor: /^colou?r$/i.test(trimmed), values: [] }];
    });
  }

  function removeAttributeDef(defKey: string) {
    const def = attributeDefs.find((d) => d.key === defKey);
    setAttributeDefs((prev) => prev.filter((d) => d.key !== defKey));
    if (def) {
      setVariants((prev) => prev.map((v) => ({ ...v, attributeValues: v.attributeValues.filter((a) => a.name !== def.name) })));
    }
  }

  function addAttrValues(defKey: string, raw: string) {
    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    const targetDef = attributeDefs.find((d) => d.key === defKey);
    if (!targetDef) return;
    const existingLower = new Set(targetDef.values.map((v) => v.value.toLowerCase()));
    const additions = parts.filter((p) => !existingLower.has(p.toLowerCase())).map((value) => ({ value, hex: targetDef.isColor ? "#cccccc" : undefined }));
    if (additions.length === 0) return;

    setAttributeDefs((prev) => prev.map((d) => (d.key === defKey ? { ...d, values: [...d.values, ...additions] } : d)));

    // Save these values to the reusable library too, so they're selectable on future products
    // instead of being retyped — optimistic locally, persisted in the background.
    setLibrary((prev) => {
      const idx = prev.findIndex((l) => l.name === targetDef.name);
      if (idx === -1) return [...prev, { name: targetDef.name, isColor: targetDef.isColor, values: additions }];
      const seen = new Set(prev[idx].values.map((v) => v.value.toLowerCase()));
      const merged = [...prev[idx].values, ...additions.filter((a) => !seen.has(a.value.toLowerCase()))];
      return prev.map((l, i) => (i === idx ? { ...l, values: merged } : l));
    });
    addAttributeLibraryValues(targetDef.name, targetDef.isColor, additions).catch(() => {
      toast.error(`Couldn't save ${targetDef.name} value${additions.length > 1 ? "s" : ""} for reuse — it's still on this product.`);
    });
  }

  function toggleAttrLibraryValue(defKey: string, v: { value: string; hex?: string }) {
    setAttributeDefs((prev) =>
      prev.map((d) => {
        if (d.key !== defKey) return d;
        const exists = d.values.some((existing) => existing.value.toLowerCase() === v.value.toLowerCase());
        if (exists) return { ...d, values: d.values.filter((existing) => existing.value.toLowerCase() !== v.value.toLowerCase()) };
        return { ...d, values: [...d.values, { value: v.value, hex: d.isColor ? v.hex ?? "#cccccc" : undefined }] };
      })
    );
  }

  function removeAttrValue(defKey: string, value: string) {
    setAttributeDefs((prev) => prev.map((d) => (d.key === defKey ? { ...d, values: d.values.filter((v) => v.value !== value) } : d)));
  }

  function updateAttrValueHex(defKey: string, value: string, hex: string) {
    setAttributeDefs((prev) => prev.map((d) => (d.key === defKey ? { ...d, values: d.values.map((v) => (v.value === value ? { ...v, hex } : v)) } : d)));
  }

  function toggleAttrIsColor(defKey: string, isColor: boolean) {
    setAttributeDefs((prev) =>
      prev.map((d) => (d.key === defKey ? { ...d, isColor, values: d.values.map((v) => ({ ...v, hex: isColor ? v.hex || "#cccccc" : undefined })) } : d))
    );
  }

  function handleGenerateVariants() {
    if (attributeDefs.length === 0) return;
    const missing = attributeDefs.find((d) => d.values.length === 0);
    if (missing) {
      toast.error(`Add at least one value for "${missing.name}" before generating.`);
      return;
    }
    const combos = cartesianCombos(attributeDefs);
    const comboKeysInProduct = new Set(combos.map((c) => comboKey(c)));

    setVariants((prev) => {
      const byCombo = new Map(prev.map((v) => [comboKey(v.attributeValues), v]));
      const generated = combos.map((combo) => {
        const existing = byCombo.get(comboKey(combo));
        return existing ? { ...existing, attributeValues: combo } : emptyVariant(combo);
      });
      // Never silently delete a row on regenerate — a combo that no longer appears (e.g. a value
      // was removed) is kept and flagged stale so the admin can consciously remove it instead.
      const stale = prev.filter((v) => !comboKeysInProduct.has(comboKey(v.attributeValues)));
      return [...generated, ...stale];
    });
    toast.success(`Generated ${combos.length} variant${combos.length === 1 ? "" : "s"}.`);
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
      variantAttributes: attributeDefs.map((d, i) => ({ name: d.name, isColor: d.isColor, position: i, values: d.values })),
      variants: variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        barcode: v.barcode || undefined,
        attributeValues: v.attributeValues,
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

  // Predefined names plus any custom attribute the admin has used before on another product —
  // so a repeat custom attribute (e.g. "Fabric Wash") becomes a one-click chip too, not just its values.
  const attributeNamePool = [
    ...PREDEFINED_ATTRIBUTES,
    ...library
      .map((l) => l.name)
      .filter((name) => !PREDEFINED_ATTRIBUTES.some((p) => p.toLowerCase() === name.toLowerCase()))
      .sort((a, b) => a.localeCompare(b)),
  ];
  const availableAttributes = attributeNamePool.filter((name) => !attributeDefs.some((d) => d.name.toLowerCase() === name.toLowerCase()));

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
          Choose the attributes this product varies by (Size, Colour, Waist, Shoe Size, or your own custom attribute), enter each
          attribute&apos;s possible values, then generate the resulting combinations below. A variant is flagged low stock once its
          stock falls to or below its Low Stock Alert number. Leave Barcode blank to auto-generate one on save, or type a real
          manufacturer/GS1 code to use that instead. New variants can only be generated/regenerated after the product is first saved.
        </p>

        <div className="mt-3">
          <Checkbox label="This product has variants (size, colour, etc.)" checked={hasVariants} onChange={(e) => handleToggleHasVariants(e.target.checked)} />
        </div>

        {hasVariants && (
          <div className="mt-4 flex flex-col gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.08em] text-ink-soft">Add attribute</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {availableAttributes.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => addAttributeDef(name)}
                    className="border border-line px-3 py-1.5 text-xs hover:border-ink"
                  >
                    + {name}
                  </button>
                ))}
                <CustomAttributeAdder onAdd={addAttributeDef} />
              </div>
            </div>

            {attributeDefs.length > 0 && (
              <div className="flex flex-col gap-3">
                {attributeDefs.map((def) => (
                  <AttributeDefEditor
                    key={def.key}
                    def={def}
                    libraryValues={library.find((l) => l.name === def.name)?.values ?? []}
                    onRemove={() => removeAttributeDef(def.key)}
                    onAddValues={(raw) => addAttrValues(def.key, raw)}
                    onRemoveValue={(value) => removeAttrValue(def.key, value)}
                    onToggleLibraryValue={(v) => toggleAttrLibraryValue(def.key, v)}
                    onHexChange={(value, hex) => updateAttrValueHex(def.key, value, hex)}
                    onToggleColor={(isColor) => toggleAttrIsColor(def.key, isColor)}
                  />
                ))}
                <Button type="button" variant="secondary" size="sm" className="self-start" onClick={handleGenerateVariants}>
                  Generate Variants
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3">
          {variants.map((v) => (
            <div key={v.key} className="border border-line p-3">
              {hasVariants && v.attributeValues.length > 0 && (
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {v.attributeValues.map((a) => (
                    <span key={a.name} className="inline-flex items-center gap-1.5 border border-line px-2 py-1 text-xs">
                      {a.hex && <span className="h-3 w-3 shrink-0 rounded-full border border-line" style={{ backgroundColor: a.hex }} />}
                      {a.name}: {a.value}
                    </span>
                  ))}
                  {isStale(v) && (
                    <span className="border border-sale px-2 py-1 text-xs text-sale">No longer in your attribute list — remove or regenerate</span>
                  )}
                </div>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:items-end">
                <Field label="SKU">
                  <Input
                    placeholder="SKU"
                    required
                    value={v.sku}
                    onChange={(e) => updateVariant(v.key, { sku: e.target.value.toUpperCase() })}
                    className="w-full"
                  />
                </Field>
                <Field label="Barcode (Auto Generate)">
                  <div className="flex gap-1">
                    <Input
                      placeholder={v.id ? "Barcode" : "Barcode (auto on save)"}
                      value={v.barcode}
                      onChange={(e) => updateVariant(v.key, { barcode: e.target.value })}
                      className="w-full min-w-0"
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
                </Field>
                <Field label="Price">
                  <Input
                    placeholder="Price"
                    type="number"
                    step="0.01"
                    required
                    value={v.price}
                    onChange={(e) => updateVariant(v.key, { price: e.target.value })}
                    className="w-full"
                  />
                </Field>
                <Field label="Sale Price">
                  <Input
                    placeholder="Sale Price"
                    type="number"
                    step="0.01"
                    value={v.salePrice}
                    onChange={(e) => updateVariant(v.key, { salePrice: e.target.value })}
                    className="w-full"
                  />
                </Field>
                <Field label="Stock">
                  <Input
                    placeholder="Stock"
                    type="number"
                    required
                    value={v.stock}
                    onChange={(e) => updateVariant(v.key, { stock: e.target.value })}
                    className="w-full"
                  />
                </Field>
                <Field label="Low Stock Alert">
                  <div className="flex gap-2">
                    <Input
                      title="Flag this variant as low stock once its stock falls to or below this number"
                      type="number"
                      min={0}
                      required
                      value={v.lowStockThreshold}
                      onChange={(e) => updateVariant(v.key, { lowStockThreshold: e.target.value })}
                      className="w-full min-w-0"
                    />
                    <button
                      type="button"
                      onClick={() => removeVariantRow(v.key)}
                      disabled={variants.length === 1}
                      className="shrink-0 text-ink-soft hover:text-sale disabled:opacity-30"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </Field>
              </div>
            </div>
          ))}
          {!hasVariants && (
            <Button type="button" variant="secondary" size="sm" className="self-start" onClick={() => setVariants((prev) => [...prev, emptyVariant()])}>
              <Plus size={14} /> Add Variant
            </Button>
          )}
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
