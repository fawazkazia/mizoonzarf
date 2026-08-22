export type PaymentMethodId = "COD" | "CARD" | "APPLE_PAY" | "GOOGLE_PAY" | "PAYPAL" | "TABBY" | "TAMARA";

export interface ChargeRequest {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
}

export interface ChargeResult {
  status: "PENDING" | "PAID" | "FAILED";
  transactionRef?: string;
  redirectUrl?: string;
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
