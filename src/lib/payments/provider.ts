export type PaymentMethodId = "COD" | "CARD" | "RAZORPAY" | "APPLE_PAY" | "GOOGLE_PAY" | "PAYPAL" | "TABBY" | "TAMARA";

export interface ChargeRequest {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  /** Where a redirect-based gateway (Stripe Checkout, Tabby, Tamara, ...) sends the shopper back on success/cancel. */
  successUrl?: string;
  cancelUrl?: string;
}

export interface ChargeResult {
  status: "PENDING" | "PAID" | "FAILED";
  transactionRef?: string;
  redirectUrl?: string;
  /** For modal-based gateways (Razorpay Checkout.js) that need the client to open a widget instead of redirecting. */
  clientAction?: {
    type: "razorpay_checkout";
    keyId: string;
    razorpayOrderId: string;
    amount: number;
    currency: string;
    name: string;
    orderNumber: string;
  };
  raw?: unknown;
}

export interface RefundResult {
  status: "REFUNDED";
  raw?: unknown;
}

/**
 * Every payment gateway (Stripe, Telr, Tabby, Tamara, Network International, ...)
 * implements this interface so the checkout flow never depends on a specific
 * provider's SDK. Card details are never touched by our server — real
 * implementations must use the provider's hosted/tokenized checkout.
 */
export interface PaymentProvider {
  id: PaymentMethodId;
  label: string;
  isConfigured(): boolean;
  charge(request: ChargeRequest): Promise<ChargeResult>;
  /** Not every gateway supports refunds through this codebase yet (e.g. COD) — implement only when it does. */
  refund?(transactionRef: string): Promise<RefundResult>;
}

export class NotConfiguredPaymentProvider implements PaymentProvider {
  constructor(
    public id: PaymentMethodId,
    public label: string,
    private envHint: string
  ) {}

  isConfigured(): boolean {
    return false;
  }

  async charge(): Promise<ChargeResult> {
    throw new Error(
      `${this.label} is not configured yet. Set ${this.envHint} in your environment to enable this payment method.`
    );
  }
}
