import { db } from "@/lib/db";

export async function getProductBySlug(slug: string) {
  return db.product.findUnique({
    where: { slug },
    include: {
      brand: true,
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { price: "asc" } },
      variantAttributes: { orderBy: { position: "asc" } },
      reviews: { where: { isApproved: true }, orderBy: { createdAt: "desc" }, take: 20 },
      collections: { select: { name: true, slug: true } },
    },
  });
}
