import { db } from "@/lib/db";
import type {
  AwbResult,
  CancelResult,
  ConnectionTestResult,
  CreateShipmentRequest,
  CreateShipmentResult,
  LabelResult,
  PickupLocationInput,
  PickupResult,
  RateRequest,
  RateResult,
  ShippingProvider,
  ShippingProviderId,
  TrackingResult,
} from "./provider";

const TOKEN_SINGLETON_ID = "singleton";
const TOKEN_LIFETIME_DAYS = 10;
const TOKEN_REFRESH_BUFFER_MS = 24 * 60 * 60 * 1000; // refresh a day before expiry

function baseUrl(): string {
  return (process.env.SHIPROCKET_BASE_URL || "https://apiv2.shiprocket.in/v1/external").replace(/\/$/, "");
}

/** Defaults to test mode (dry-run mutations) unless explicitly set to "production" — prevents accidental live shipments. */
function isTestMode(): boolean {
  return process.env.SHIPROCKET_MODE !== "production";
}

function isConfigured(): boolean {
  return Boolean(process.env.SHIPROCKET_API_TOKEN || (process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD));
}

/** Strips anything credential-shaped before a response is persisted to Shipment.lastApiResponse. */
function redact(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const clone: Record<string, unknown> = { ...(value as Record<string, unknown>) };
  for (const key of Object.keys(clone)) {
    if (/token|password|secret|authorization/i.test(key)) delete clone[key];
  }
  return clone;
}

async function loginAndCacheToken(): Promise<string> {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  if (!email || !password) {
    throw new Error("Shiprocket is not configured. Set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD (or SHIPROCKET_API_TOKEN).");
  }

  const res = await fetch(`${baseUrl()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error(`Shiprocket login failed (HTTP ${res.status}). Check SHIPROCKET_EMAIL/SHIPROCKET_PASSWORD.`);
  }

  const data = (await res.json()) as { token?: string };
  if (!data.token) throw new Error("Shiprocket login succeeded but returned no token.");

  const expiresAt = new Date(Date.now() + TOKEN_LIFETIME_DAYS * 24 * 60 * 60 * 1000);
  await db.shiprocketToken.upsert({
    where: { id: TOKEN_SINGLETON_ID },
    create: { id: TOKEN_SINGLETON_ID, token: data.token, expiresAt },
    update: { token: data.token, expiresAt },
  });

  return data.token;
}

async function getToken(forceRefresh = false): Promise<string> {
  if (process.env.SHIPROCKET_API_TOKEN) return process.env.SHIPROCKET_API_TOKEN;

  if (!forceRefresh) {
    const cached = await db.shiprocketToken.findUnique({ where: { id: TOKEN_SINGLETON_ID } });
    if (cached && cached.expiresAt.getTime() - Date.now() > TOKEN_REFRESH_BUFFER_MS) {
      return cached.token;
    }
  }

  return loginAndCacheToken();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface RequestOptions {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
  /** Mutation calls are dry-run in test mode; reads (GET) always hit the real API. */
  mutation?: boolean;
  /** Returned instead of a real call when running in test mode for a mutation endpoint. */
  dryRunResult?: unknown;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (options.mutation && isTestMode()) {
    return (options.dryRunResult ?? { dryRun: true }) as T;
  }

  const method = options.method ?? "GET";
  let token = await getToken();
  let attempt = 0;
  const maxAttempts = 4;

  while (true) {
    attempt += 1;
    let res: Response;
    try {
      res = await fetch(`${baseUrl()}${path}`, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: AbortSignal.timeout(20_000),
      });
    } catch (err) {
      if (attempt >= maxAttempts) throw new Error(`Shiprocket request to ${path} failed: ${err instanceof Error ? err.message : "network error"}`);
      await sleep(2 ** attempt * 250);
      continue;
    }

    if (res.status === 401 && attempt === 1) {
      token = await getToken(true);
      continue;
    }

    if ((res.status === 429 || res.status >= 500) && attempt < maxAttempts) {
      await sleep(2 ** attempt * 250);
      continue;
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Shiprocket API error on ${path} (HTTP ${res.status}): ${text.slice(0, 300)}`);
    }

    return (await res.json()) as T;
  }
}

function toShiprocketAddress(name: string, contact: { phone: string; email?: string }, address: CreateShipmentRequest["billingAddress"], suffix: "billing" | "shipping") {
  return {
    [`${suffix}_customer_name`]: name,
    [`${suffix}_address`]: address.line1,
    [`${suffix}_address_2`]: address.line2 || "",
    [`${suffix}_city`]: address.city,
    [`${suffix}_pincode`]: address.pincode,
    [`${suffix}_state`]: address.state || "",
    [`${suffix}_country`]: address.country === "IN" ? "India" : address.country,
    [`${suffix}_email`]: contact.email || "",
    [`${suffix}_phone`]: contact.phone,
  };
}

/** Real Shiprocket API integration. See https://apidocs.shiprocket.in for the endpoints wrapped here. */
export class ShiprocketProvider implements ShippingProvider {
  id: ShippingProviderId = "SHIPROCKET";
  label = "Shiprocket";

  isConfigured(): boolean {
    return isConfigured();
  }

  async testConnection(): Promise<ConnectionTestResult> {
    if (!isConfigured()) {
      return { ok: false, message: "Set SHIPROCKET_EMAIL/SHIPROCKET_PASSWORD (or SHIPROCKET_API_TOKEN) in your environment first." };
    }
    try {
      // A GET, not just a token fetch — with SHIPROCKET_API_TOKEN set, getToken() never
      // touches the network at all, so only a real request actually proves the token works.
      await request("/settings/company/pickup");
      return { ok: true, message: `Connected to Shiprocket successfully (${isTestMode() ? "Test" : "Live"} mode).` };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Connection failed." };
    }
  }

  async createShipment(req: CreateShipmentRequest): Promise<CreateShipmentResult> {
    const payload = {
      order_id: req.orderNumber,
      order_date: new Date().toISOString().slice(0, 19).replace("T", " "),
      pickup_location: req.pickupLocation.label,
      billing_customer_name: req.customer.name,
      ...toShiprocketAddress(req.customer.name, req.customer, req.billingAddress, "billing"),
      billing_last_name: "",
      shipping_is_billing: false,
      shipping_customer_name: req.customer.name,
      shipping_address: req.shippingAddress.line1,
      shipping_address_2: req.shippingAddress.line2 || "",
      shipping_city: req.shippingAddress.city,
      shipping_pincode: req.shippingAddress.pincode,
      shipping_state: req.shippingAddress.state || "",
      shipping_country: req.shippingAddress.country === "IN" ? "India" : req.shippingAddress.country,
      shipping_email: req.customer.email || "",
      shipping_phone: req.customer.phone,
      order_items: req.items.map((item) => ({
        name: item.name,
        sku: item.sku,
        units: item.quantity,
        selling_price: item.price,
        discount: item.discount ?? 0,
        tax: item.tax ?? 0,
      })),
      payment_method: req.paymentMethod === "COD" ? "COD" : "Prepaid",
      sub_total: req.subtotal,
      length: req.dimensionsCm.length,
      breadth: req.dimensionsCm.width,
      height: req.dimensionsCm.height,
      weight: req.packageWeightGrams / 1000,
    };

    const result = await request<{ order_id: number; shipment_id: number; status?: string; status_code?: number }>("/orders/create/adhoc", {
      method: "POST",
      body: payload,
      mutation: true,
      dryRunResult: { order_id: `TEST-${req.orderNumber}`, shipment_id: `TEST-SHIP-${req.orderNumber}`, status: "DRY_RUN" },
    });

    return {
      providerOrderId: String(result.order_id),
      providerShipmentId: String(result.shipment_id),
      raw: redact(result),
    };
  }

  async assignAwb(providerShipmentId: string, courierId?: string): Promise<AwbResult> {
    const result = await request<{ response?: { data?: { awb_code?: string; courier_name?: string; courier_company_id?: number } } }>(
      "/courier/assign/awb",
      {
        method: "POST",
        body: courierId ? { shipment_id: providerShipmentId, courier_id: courierId } : { shipment_id: providerShipmentId },
        mutation: true,
        dryRunResult: { response: { data: { awb_code: `TESTAWB${providerShipmentId}`, courier_name: "Test Courier" } } },
      }
    );

    const data = result.response?.data;
    if (!data?.awb_code) throw new Error("Shiprocket did not return an AWB code — the courier may be unavailable for this shipment.");

    return {
      awbCode: data.awb_code,
      courierName: data.courier_name,
      courierId: data.courier_company_id ? String(data.courier_company_id) : courierId,
      raw: redact(result),
    };
  }

  async generateLabel(providerShipmentId: string): Promise<LabelResult> {
    const result = await request<{ label_url?: string; label_created?: number }>("/courier/generate/label", {
      method: "POST",
      body: { shipment_id: [providerShipmentId] },
      mutation: true,
      dryRunResult: { label_url: `https://example.invalid/test-label-${providerShipmentId}.pdf`, label_created: 1 },
    });

    if (!result.label_url) throw new Error("Shiprocket did not return a label URL. AWB may not be assigned yet.");
    return { labelUrl: result.label_url, raw: redact(result) };
  }

  async schedulePickup(providerShipmentId: string): Promise<PickupResult> {
    const result = await request<{ response?: { pickup_scheduled_date?: string; status?: string } }>("/courier/generate/pickup", {
      method: "POST",
      body: { shipment_id: [providerShipmentId] },
      mutation: true,
      dryRunResult: { response: { pickup_scheduled_date: new Date().toISOString(), status: "Test Pickup Scheduled" } },
    });

    return {
      pickupDate: result.response?.pickup_scheduled_date,
      status: result.response?.status ?? "Requested",
      raw: redact(result),
    };
  }

  async track(awbCode: string): Promise<TrackingResult> {
    const result = await request<{
      tracking_data?: {
        track_status?: number;
        shipment_track?: { current_status?: string }[];
        shipment_track_activities?: { date: string; status: string; activity: string; location: string }[];
        etd?: string;
      };
    }>(`/courier/track/awb/${encodeURIComponent(awbCode)}`);

    const data = result.tracking_data;
    const activities = data?.shipment_track_activities ?? [];

    return {
      currentStatus: data?.shipment_track?.[0]?.current_status ?? "Unknown",
      currentLocation: activities[0]?.location,
      estimatedDelivery: data?.etd ? new Date(data.etd) : undefined,
      events: activities.map((a) => ({ status: a.status, location: a.location, activity: a.activity, occurredAt: new Date(a.date) })),
      raw: redact(result),
    };
  }

  async cancel(providerShipmentId: string): Promise<CancelResult> {
    const result = await request<{ message?: string }>("/orders/cancel/shipment/awb", {
      method: "POST",
      body: { ids: [providerShipmentId] },
      mutation: true,
      dryRunResult: { message: "Test cancellation" },
    });

    return { status: result.message ?? "Cancelled", raw: redact(result) };
  }

  async getRates(req: RateRequest): Promise<RateResult> {
    const params = new URLSearchParams({
      pickup_postcode: req.pickupPincode,
      delivery_postcode: req.deliveryPincode,
      weight: String(req.weightGrams / 1000),
      cod: req.paymentMethod === "COD" ? "1" : "0",
      declared_value: String(req.orderValue),
    });

    const result = await request<{
      data?: { available_courier_companies?: { courier_company_id: number; courier_name: string; rate: number; etd?: string; cod: number }[] };
    }>(`/courier/serviceability/?${params.toString()}`);

    const options = (result.data?.available_courier_companies ?? []).map((c) => ({
      courierId: String(c.courier_company_id),
      courierName: c.courier_name,
      rate: c.rate,
      codAvailable: c.cod === 1,
    }));

    return { options, raw: redact(result) };
  }

  async registerPickupLocation(location: PickupLocationInput): Promise<{ pickupLocationName: string; raw?: unknown }> {
    const result = await request<{ pickup_id?: number; address?: { pickup_location?: string } }>("/settings/company/addpickup", {
      method: "POST",
      body: {
        pickup_location: location.label,
        name: location.contact.name,
        email: location.contact.email || "no-reply@example.com",
        phone: location.contact.phone,
        address: location.address.line1,
        address_2: location.address.line2 || "",
        city: location.address.city,
        state: location.address.state || "",
        country: location.address.country === "IN" ? "India" : location.address.country,
        pin_code: location.address.pincode,
      },
      mutation: true,
      dryRunResult: { pickup_id: 0, address: { pickup_location: location.label } },
    });

    return { pickupLocationName: result.address?.pickup_location ?? location.label, raw: redact(result) };
  }
}
