import { db } from "@/lib/db";
import { CategoryForm } from "../CategoryForm";

export const metadata = { title: "Add Category" };

export default async function NewCategoryPage() {
  const parentOptions = await db.category.findMany({ where: { parentId: null }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Add Category</h1>
      <CategoryForm parentOptions={parentOptions} />
    </div>
  );
}
