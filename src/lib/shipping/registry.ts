import { ManualShippingProvider } from "./manual";
import { ShiprocketProvider } from "./shiprocket";
import { NotConfiguredShippingProvider, type ShippingProvider, type ShippingProviderId } from "./provider";
import { getShippingProviderSettings } from "./settings";

const manualProvider = new ManualShippingProvider();
const shiprocketProvider = new ShiprocketProvider();

const providers: Record<ShippingProviderId, ShippingProvider> = {
  MANUAL: manualProvider,
  SHIPROCKET: shiprocketProvider.isConfigured() ? shiprocketProvider : new NotConfiguredShippingProvider("SHIPROCKET", "Shiprocket", "SHIPROCKET_EMAIL"),
};

export function getShippingProvider(id: ShippingProviderId): ShippingProvider {
  return providers[id];
}

export async function getActiveShippingProvider(): Promise<ShippingProvider> {
  const settings = await getShippingProviderSettings();
  return getShippingProvider(settings.activeProvider);
}
