import { MessageCircle } from "lucide-react";
import { getSettings } from "@/lib/settings";

export async function WhatsAppButton() {
  const settings = await getSettings();
  const href = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
    `Hi ${settings.brandName}, I'd like to ask about a product.`
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-[calc(var(--bottom-nav-h)+1rem+env(safe-area-inset-bottom))] right-4 z-[var(--z-fab)] flex h-13 w-13 items-center justify-center rounded-full bg-success text-paper shadow-lg transition-transform duration-[var(--dur-1)] hover:scale-105 lg:bottom-6"
    >
      <MessageCircle size={26} fill="currentColor" className="text-paper" strokeWidth={0} />
    </a>
  );
}
