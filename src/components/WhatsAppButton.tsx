import { getSettings } from "@/lib/settings";
import { WhatsAppButtonClient } from "./WhatsAppButtonClient";

export async function WhatsAppButton() {
  const settings = await getSettings();
  const href = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
    `Hi ${settings.brandName}, I'd like to ask about a product.`
  )}`;

  return <WhatsAppButtonClient href={href} />;
}
