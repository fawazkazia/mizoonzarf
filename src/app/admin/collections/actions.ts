"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/admin-auth";
import { collectionInputSchema, type CollectionInput } from "@/lib/validation/admin-collection";

function normalize(input: CollectionInput) {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description || null,
    imageUrl: input.imageUrl || null,
    isActive: input.isActive,
    sortOrder: input.sortOrder,
    startDate: input.startDate ? new Date(input.startDate) : null,
    endDate: input.endDate ? new Date(input.endDate) : null,
  };
}

function revalidateCollectionPaths(slug?: string) {
  revalidatePath("/admin/collections");
  revalidatePath("/");
  if (slug) revalidatePath(`/collections/${slug}`);
}

export async function createCollection(raw: CollectionInput) {
  await requireStaff();
  const input = collectionInputSchema.parse(raw);

  const conflict = await db.collection.findUnique({ where: { slug: input.slug } });
  if (conflict) throw new Error(`Slug "${input.slug}" is already in use.`);

  const collection = await db.collection.create({
    data: { ...normalize(input), products: { connect: input.productIds.map((id) => ({ id })) } },
  });
  revalidateCollectionPaths(collection.slug);
  return { id: collection.id };
}

export async function updateCollection(id: string, raw: CollectionInput) {
  await requireStaff();
  const input = collectionInputSchema.parse(raw);

  const conflict = await db.collection.findFirst({ where: { slug: input.slug, id: { not: id } } });
  if (conflict) throw new Error(`Slug "${input.slug}" is already in use.`);

  await db.collection.update({
    where: { id },
    data: { ...normalize(input), products: { set: input.productIds.map((pid) => ({ id: pid })) } },
  });
  revalidateCollectionPaths(input.slug);
  return { id };
}

export async function deleteCollection(id: string) {
  await requireStaff();
  await db.collection.delete({ where: { id } });
  revalidateCollectionPaths();
}
