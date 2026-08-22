import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CollectionForm } from "../../CollectionForm";

export const metadata = { title: "Edit Collection" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCollectionPage({ params }: PageProps) {
  const { id } = await params;
  const [collection, allProducts] = await Promise.all([
    db.collection.findUnique({ where: { id }, include: { products: { select: { id: true } } } }),
    db.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!collection) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Edit Collection</h1>
      <CollectionForm
        allProducts={allProducts}
        initial={{
          id: collection.id,
          name: collection.name,
          slug: collection.slug,
          description: collection.description ?? "",
          imageUrl: collection.imageUrl,
          isActive: collection.isActive,
          sortOrder: collection.sortOrder,
          startDate: collection.startDate ? collection.startDate.toISOString().slice(0, 10) : "",
          endDate: collection.endDate ? collection.endDate.toISOString().slice(0, 10) : "",
          productIds: collection.products.map((p) => p.id),
        }}
      />
    </div>
  );
}
