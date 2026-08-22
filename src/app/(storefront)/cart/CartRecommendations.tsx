import { getTrending } from "@/lib/data/products";
import { ProductRail } from "@/components/home/ProductRail";

export async function CartRecommendations() {
  const products = await getTrending(4);
  return <ProductRail title="You May Also Like" products={products} />;
}
