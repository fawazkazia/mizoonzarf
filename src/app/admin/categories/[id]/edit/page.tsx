import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CategoryForm } from "../../CategoryForm";

export const metadata = { title: "Edit Category" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({ params }: PageProps) {
  const { id } = await params;
  const [category, parentOptions] = await Promise.all([
    db.category.findUnique({ where: { id } }),
    db.category.findMany({ where: { parentId: null, id: { not: id } }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!category) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Edit Category</h1>
      <CategoryForm
        parentOptions={parentOptions}
        initial={{
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description ?? "",
          imageUrl: category.imageUrl,
          gender: category.gender ?? "",
          parentId: category.parentId ?? "",
          sortOrder: category.sortOrder,
          showInMenu: category.showInMenu,
          isActive: category.isActive,
          seoTitle: category.seoTitle ?? "",
          seoDescription: category.seoDescription ?? "",
        }}
      />
    </div>
  );
}
