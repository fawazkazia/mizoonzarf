import type {
  AwbResult,
  CancelResult,
  ConnectionTestResult,
  CreateShipmentResult,
  LabelResult,
  PickupResult,
  ShippingProvider,
  ShippingProviderId,
  TrackingResult,
} from "./provider";

/**
 * The default courier "provider" — admins fill in carrier/tracking number by
 * hand via OrderStatusUpdater's existing Shipment Tracking section. No API
 * calls happen here; this only exists so the registry always has something
 * to return for ShippingProviderSettings.activeProvider === "MANUAL".
 */
export class ManualShippingProvider implements ShippingProvider {
  id: ShippingProviderId = "MANUAL";
  label = "Manual (hand-entered tracking)";

  isConfigured(): boolean {
    return true;
  }

  async testConnection(): Promise<ConnectionTestResult> {
    return { ok: true, message: "Manual mode doesn't call an external API — nothing to test." };
  }

  private unsupported(): never {
    throw new Error("Switch Active Provider to Shiprocket in Admin → Shipping to use automated courier actions.");
  }

  async createShipment(): Promise<CreateShipmentResult> {
    this.unsupported();
  }
  async assignAwb(): Promise<AwbResult> {
    this.unsupported();
  }
  async generateLabel(): Promise<LabelResult> {
    this.unsupported();
  }
  async schedulePickup(): Promise<PickupResult> {
    this.unsupported();
  }
  async track(): Promise<TrackingResult> {
    this.unsupported();
  }
  async cancel(): Promise<CancelResult> {
    this.unsupported();
  }
}
