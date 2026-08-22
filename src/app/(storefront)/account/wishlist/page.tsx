import { auth } from "@/lib/auth";
import { toProductCard, cardInclude } from "@/lib/data/products";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/product/ProductCard";

export const metadata = { title: "My Wishlist" };

export default async function WishlistPage() {
  const session = await auth();
  const items = await db.wishlistItem.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
    include: { product: { include: cardInclude } },
  });

  const products = items.map((i) => toProductCard(i.product));

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl">My Wishlist</h1>
      {products.length === 0 ? (
        <p className="text-ink-soft">Your wishlist is empty. Tap the heart icon on any product to save it here.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
