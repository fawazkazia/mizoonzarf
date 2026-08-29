"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/admin-auth";
import { categoryInputSchema, type CategoryInput } from "@/lib/validation/admin-category";

function normalize(input: CategoryInput) {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description || null,
    imageUrl: input.imageUrl || null,
    imageObjectPosition: input.imageObjectPosition || null,
    gender: input.gender || null,
    parentId: input.parentId || null,
    sortOrder: input.sortOrder,
    showInMenu: input.showInMenu,
    isActive: input.isActive,
    seoTitle: input.seoTitle || null,
    seoDescription: input.seoDescription || null,
  };
}

function revalidateCategoryPaths() {
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function createCategory(raw: CategoryInput) {
  await requireStaff();
  const input = categoryInputSchema.parse(raw);

  const conflict = await db.category.findUnique({ where: { slug: input.slug } });
  if (conflict) throw new Error(`Slug "${input.slug}" is already in use.`);

  const category = await db.category.create({ data: normalize(input) });
  revalidateCategoryPaths();
  return { id: category.id };
}

export async function updateCategory(id: string, raw: CategoryInput) {
  await requireStaff();
  const input = categoryInputSchema.parse(raw);

  const conflict = await db.category.findFirst({ where: { slug: input.slug, id: { not: id } } });
  if (conflict) throw new Error(`Slug "${input.slug}" is already in use.`);
  if (input.parentId === id) throw new Error("A category can't be its own parent.");

  await db.category.update({ where: { id }, data: normalize(input) });
  revalidateCategoryPaths();
  return { id };
}

export async function deleteCategory(id: string) {
  await requireStaff();
  const [productCount, childCount] = await Promise.all([
    db.product.count({ where: { categoryId: id } }),
    db.category.count({ where: { parentId: id } }),
  ]);
  if (productCount > 0) throw new Error("This category has products in it. Move or delete them first.");
  if (childCount > 0) throw new Error("This category has subcategories. Delete or reassign them first.");

  await db.category.delete({ where: { id } });
  revalidateCategoryPaths();
}
