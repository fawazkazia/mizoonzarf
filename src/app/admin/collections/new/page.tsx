import { db } from "@/lib/db";
import { CollectionForm } from "../CollectionForm";

export const metadata = { title: "Add Collection" };

export default async function NewCollectionPage() {
  const allProducts = await db.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Add Collection</h1>
      <CollectionForm allProducts={allProducts} />
    </div>
  );
}
