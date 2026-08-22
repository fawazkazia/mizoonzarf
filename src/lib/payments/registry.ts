import { CashOnDeliveryProvider } from "./cod";
import { NotConfiguredPaymentProvider, type PaymentProvider, type PaymentMethodId } from "./provider";

/**
 * Central registry for every payment method the checkout can offer. Only COD
 * ships functional in Phase 1. The others are typed, listed in the UI as
 * "coming soon", and will throw a clear error if invoked — connect real keys
 * (STRIPE_SECRET_KEY, TELR_*, TABBY_*, TAMARA_*, ...) in a later phase to
 * swap in a real implementation without touching checkout code.
 */
const providers: Record<PaymentMethodId, PaymentProvider> = {
  COD: new CashOnDeliveryProvider(),
  CARD: new NotConfiguredPaymentProvider("CARD", "Credit/Debit Card", "STRIPE_SECRET_KEY or your gateway's key"),
  APPLE_PAY: new NotConfiguredPaymentProvider("APPLE_PAY", "Apple Pay", "APPLE_PAY_MERCHANT_ID"),
  GOOGLE_PAY: new NotConfiguredPaymentProvider("GOOGLE_PAY", "Google Pay", "GOOGLE_PAY_MERCHANT_ID"),
  PAYPAL: new NotConfiguredPaymentProvider("PAYPAL", "PayPal", "PAYPAL_CLIENT_ID"),
  TABBY: new NotConfiguredPaymentProvider("TABBY", "Tabby (Buy Now, Pay Later)", "TABBY_SECRET_KEY"),
  TAMARA: new NotConfiguredPaymentProvider("TAMARA", "Tamara (Buy Now, Pay Later)", "TAMARA_API_TOKEN"),
};

export function getPaymentProvider(id: PaymentMethodId): PaymentProvider {
  return providers[id];
}

export function listPaymentMethods(): PaymentProvider[] {
  return Object.values(providers);
}
