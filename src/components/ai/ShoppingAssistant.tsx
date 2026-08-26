import { getAIProvider } from "@/lib/ai/provider";
import { ShoppingAssistantClient } from "./ShoppingAssistantClient";

export function ShoppingAssistant() {
  const configured = getAIProvider().isConfigured();
  return <ShoppingAssistantClient configured={configured} />;
}
