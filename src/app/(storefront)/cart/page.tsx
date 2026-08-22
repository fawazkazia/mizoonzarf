import type { Metadata } from "next";
import { CartPageClient } from "./CartPageClient";
import { CartRecommendations } from "./CartRecommendations";

export const metadata: Metadata = { title: "Your Bag" };

export default function CartPage() {
  return (
    <>
      <CartPageClient />
      <CartRecommendations />
    </>
  );
}
