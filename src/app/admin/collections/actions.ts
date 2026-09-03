"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/permissions/require-permission";
import { logStaffActivity } from "@/lib/permissions/log-activity";
import { collectionInputSchema, type CollectionInput } from "@/lib/validation/admin-collection";
import { notifyAllCustomers } from "@/lib/notifications/inapp";

function normalize(input: CollectionInput) {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description || null,
    imageUrl: input.imageUrl || null,
    imageObjectPosition: input.imageObjectPosition || null,
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
  const session = await requirePermission("products.manageCategories");
  const input = collectionInputSchema.parse(raw);

  const conflict = await db.collection.findUnique({ where: { slug: input.slug } });
  if (conflict) throw new Error(`Slug "${input.slug}" is already in use.`);

  const collection = await db.collection.create({
    data: { ...normalize(input), products: { connect: input.productIds.map((id) => ({ id })) } },
  });

  if (collection.isActive) {
    await notifyAllCustomers({
      type: "PROMOTION",
      title: "New Collection",
      body: `${collection.name} just launched.`,
      link: `/collections/${collection.slug}`,
    });
  }

  await logStaffActivity({ actorId: session.user.id, action: "COLLECTION_CREATED", module: "products", entityType: "Collection", entityId: collection.id, after: { name: collection.name } });
  revalidateCollectionPaths(collection.slug);
  return { id: collection.id };
}

export async function updateCollection(id: string, raw: CollectionInput) {
  const session = await requirePermission("products.manageCategories");
  const input = collectionInputSchema.parse(raw);

  const conflict = await db.collection.findFirst({ where: { slug: input.slug, id: { not: id } } });
  if (conflict) throw new Error(`Slug "${input.slug}" is already in use.`);

  await db.collection.update({
    where: { id },
    data: { ...normalize(input), products: { set: input.productIds.map((pid) => ({ id: pid })) } },
  });
  await logStaffActivity({ actorId: session.user.id, action: "COLLECTION_UPDATED", module: "products", entityType: "Collection", entityId: id, after: { name: input.name } });
  revalidateCollectionPaths(input.slug);
  return { id };
}

export async function deleteCollection(id: string) {
  const session = await requirePermission("products.manageCategories");
  const collection = await db.collection.delete({ where: { id } });
  await logStaffActivity({ actorId: session.user.id, action: "COLLECTION_DELETED", module: "products", entityType: "Collection", entityId: id, before: { name: collection.name } });
  revalidateCollectionPaths();
}
