import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export function StorefrontChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom))] lg:pb-0">
      <Header />
      <main>{children}</main>
      <Footer />
      <MobileBottomNav />
      <WhatsAppButton />
    </div>
  );
}
