import { db } from "@/lib/db";

export async function getProductFormOptions() {
  const [topCategories, brands, collections] = await Promise.all([
    db.category.findMany({ where: { parentId: null }, orderBy: { sortOrder: "asc" }, include: { children: { orderBy: { sortOrder: "asc" } } } }),
    db.brand.findMany({ orderBy: { name: "asc" } }),
    db.collection.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const categories = topCategories.flatMap((top) => [
    { id: top.id, name: top.name, indent: false },
    ...top.children.map((c) => ({ id: c.id, name: c.name, indent: true })),
  ]);

  return { categories, brands, collections };
}
