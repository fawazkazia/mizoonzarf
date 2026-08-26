export type ShippingProviderId = "MANUAL" | "SHIPROCKET";

export interface ShippingContact {
  name: string;
  phone: string;
  email?: string;
}

export interface ShippingAddressInput {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  country: string;
  pincode: string;
}

export interface ShipmentItemInput {
  name: string;
  sku: string;
  quantity: number;
  price: number;
  discount?: number;
  tax?: number;
  /** Per-unit weight in grams. */
  weightGrams: number;
}

export interface PickupLocationInput {
  /** Nickname registered with the courier provider (Shiprocket's `pickup_location`). Falls back to warehouse name/code when unset. */
  label: string;
  contact: ShippingContact;
  address: ShippingAddressInput;
}

export interface CreateShipmentRequest {
  orderId: string;
  orderNumber: string;
  customer: ShippingContact;
  billingAddress: ShippingAddressInput;
  shippingAddress: ShippingAddressInput;
  items: ShipmentItemInput[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  paymentMethod: "COD" | "PREPAID";
  /** Amount to collect on delivery — 0 for prepaid orders. */
  codAmount: number;
  pickupLocation: PickupLocationInput;
  packageWeightGrams: number;
  dimensionsCm: { length: number; width: number; height: number };
}

export interface CreateShipmentResult {
  providerOrderId: string;
  providerShipmentId: string;
  raw?: unknown;
}

export interface AwbResult {
  awbCode: string;
  courierId?: string;
  courierName?: string;
  raw?: unknown;
}

export interface LabelResult {
  labelUrl: string;
  raw?: unknown;
}

export interface PickupResult {
  pickupDate?: string;
  status: string;
  raw?: unknown;
}

export interface CancelResult {
  status: string;
  raw?: unknown;
}

export interface TrackingEvent {
  status: string;
  location?: string;
  activity?: string;
  occurredAt: Date;
}

export interface TrackingResult {
  currentStatus: string;
  currentLocation?: string;
  estimatedDelivery?: Date;
  events: TrackingEvent[];
  raw?: unknown;
}

export interface RateRequest {
  pickupPincode: string;
  deliveryPincode: string;
  weightGrams: number;
  paymentMethod: "COD" | "PREPAID";
  orderValue: number;
}

export interface RateOption {
  courierId: string;
  courierName: string;
  rate: number;
  etaDays?: number;
  codAvailable: boolean;
}

export interface RateResult {
  options: RateOption[];
  raw?: unknown;
}

export interface ConnectionTestResult {
  ok: boolean;
  message: string;
}

/**
 * Every courier (Shiprocket, Delhivery, Aramex, DHL, ...) implements this
 * interface so order/admin code never depends on a specific provider's API
 * shape. Mirrors the PaymentProvider pattern in src/lib/payments/provider.ts.
 */
export interface ShippingProvider {
  id: ShippingProviderId;
  label: string;
  isConfigured(): boolean;
  testConnection(): Promise<ConnectionTestResult>;
  createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResult>;
  assignAwb(providerShipmentId: string, courierId?: string): Promise<AwbResult>;
  generateLabel(providerShipmentId: string): Promise<LabelResult>;
  schedulePickup(providerShipmentId: string): Promise<PickupResult>;
  track(awbCode: string): Promise<TrackingResult>;
  cancel(providerShipmentId: string): Promise<CancelResult>;
  getRates?(request: RateRequest): Promise<RateResult>;
  registerPickupLocation?(location: PickupLocationInput): Promise<{ pickupLocationName: string; raw?: unknown }>;
}

export class NotConfiguredShippingProvider implements ShippingProvider {
  constructor(
    public id: ShippingProviderId,
    public label: string,
    private envHint: string
  ) {}

  isConfigured(): boolean {
    return false;
  }

  private fail(): never {
    throw new Error(`${this.label} is not configured yet. Set ${this.envHint} in your environment to enable this courier.`);
  }

  async testConnection(): Promise<ConnectionTestResult> {
    return { ok: false, message: `${this.label} is not configured. Set ${this.envHint} in your environment.` };
  }
  async createShipment(): Promise<CreateShipmentResult> {
    this.fail();
  }
  async assignAwb(): Promise<AwbResult> {
    this.fail();
  }
  async generateLabel(): Promise<LabelResult> {
    this.fail();
  }
  async schedulePickup(): Promise<PickupResult> {
    this.fail();
  }
  async track(): Promise<TrackingResult> {
    this.fail();
  }
  async cancel(): Promise<CancelResult> {
    this.fail();
  }
}
