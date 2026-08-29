import { db } from "@/lib/db";

export async function getProductFormOptions() {
  const [topCategories, brands, collections, attributeLibraryRows] = await Promise.all([
    db.category.findMany({ where: { parentId: null }, orderBy: { sortOrder: "asc" }, include: { children: { orderBy: { sortOrder: "asc" } } } }),
    db.brand.findMany({ orderBy: { name: "asc" } }),
    db.collection.findMany({ orderBy: { sortOrder: "asc" } }),
    db.attributeValueLibrary.findMany({ orderBy: { name: "asc" } }),
  ]);

  const categories = topCategories.flatMap((top) => [
    { id: top.id, name: top.name, slug: top.slug, indent: false },
    ...top.children.map((c) => ({ id: c.id, name: c.name, slug: c.slug, indent: true })),
  ]);

  const attributeLibrary = attributeLibraryRows.map((r) => ({
    name: r.name,
    isColor: r.isColor,
    values: r.values as { value: string; hex?: string }[],
  }));

  return { categories, brands, collections, attributeLibrary };
}
