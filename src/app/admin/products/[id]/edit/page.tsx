import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProductForm } from "../../ProductForm";
import { getProductFormOptions } from "../../form-options";
import { variantAttrs } from "@/lib/inventory/variant-attributes";

export const metadata = { title: "Edit Product" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const [product, options] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { orderBy: { createdAt: "asc" } },
        collections: true,
        variantAttributes: { orderBy: { position: "asc" } },
      },
    }),
    getProductFormOptions(),
  ]);

  if (!product) notFound();

  const notes = product.fragranceNotes as { top?: string[]; heart?: string[]; base?: string[] } | null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Edit Product</h1>
      <ProductForm
        {...options}
        initial={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          categoryId: product.categoryId,
          brandId: product.brandId ?? "",
          description: product.description,
          shortDescription: product.shortDescription ?? "",
          videoUrl: product.videoUrl ?? "",
          gender: product.gender,
          material: product.material ?? "",
          fitInfo: product.fitInfo ?? "",
          careInstructions: product.careInstructions ?? "",
          sizeGuideType: product.sizeGuideType ?? "",
          fragranceFamily: product.fragranceFamily ?? "",
          fragranceTopNotes: notes?.top?.join(", ") ?? "",
          fragranceHeartNotes: notes?.heart?.join(", ") ?? "",
          fragranceBaseNotes: notes?.base?.join(", ") ?? "",
          concentration: product.concentration ?? "",
          tags: product.tags.join(", "),
          gstRate: product.gstRate != null ? String(product.gstRate) : "",
          hsnCode: product.hsnCode ?? "",
          status: product.status,
          isFeatured: product.isFeatured,
          seoTitle: product.seoTitle ?? "",
          seoDescription: product.seoDescription ?? "",
          images: product.images.map((i) => i.url),
          collectionSlugs: product.collections.map((c) => c.slug),
          variantAttributes: product.variantAttributes.map((a) => ({
            name: a.name,
            isColor: a.isColor,
            position: a.position,
            values: a.values as { value: string; hex?: string }[],
          })),
          variants: product.variants.map((v) => ({
            key: v.id,
            id: v.id,
            sku: v.sku,
            barcode: v.barcode ?? "",
            attributeValues: variantAttrs(v),
            price: String(v.price),
            salePrice: v.salePrice ? String(v.salePrice) : "",
            costPrice: v.costPrice ? String(v.costPrice) : "",
            stock: String(v.stock),
            lowStockThreshold: String(v.lowStockThreshold),
          })),
        }}
      />
    </div>
  );
}
