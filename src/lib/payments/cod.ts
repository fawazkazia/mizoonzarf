import type { ChargeRequest, ChargeResult, PaymentProvider } from "./provider";

/** Cash on Delivery — the only payment method that requires no external gateway. */
export class CashOnDeliveryProvider implements PaymentProvider {
  id = "COD" as const;
  label = "Cash on Delivery";

  isConfigured(): boolean {
    return true;
  }

  async charge(request: ChargeRequest): Promise<ChargeResult> {
    return {
      status: "PENDING",
      transactionRef: `COD-${request.orderNumber}`,
    };
  }
}
