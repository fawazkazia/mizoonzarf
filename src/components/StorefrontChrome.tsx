import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { PromoCodeBanner } from "@/components/home/PromoCodeBanner";
import { FavouriteBrandsStrip } from "@/components/home/FavouriteBrandsStrip";
import { ShoppingAssistant } from "@/components/ai/ShoppingAssistant";

export function StorefrontChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom))] lg:pb-0">
      <Header />
      <PromoCodeBanner />
      <div className="h-4 w-full bg-white sm:h-5" aria-hidden="true" />
      <FavouriteBrandsStrip />
      <main>{children}</main>
      <Footer />
      <MobileBottomNav />
      <ShoppingAssistant />
      <WhatsAppButton />
    </div>
  );
}
