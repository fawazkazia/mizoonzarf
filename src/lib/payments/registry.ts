import { CashOnDeliveryProvider } from "./cod";
import { StripePaymentProvider } from "./stripe";
import { RazorpayPaymentProvider } from "./razorpay";
import { NotConfiguredPaymentProvider, type PaymentProvider, type PaymentMethodId } from "./provider";

/**
 * Central registry for every payment method the checkout can offer. COD and
 * Razorpay (once RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET are set) are the primary
 * India methods. Stripe (CARD) stays available for non-India use. The rest are
 * typed, listed in the UI as "coming soon", and will throw a clear error if
 * invoked — connect real keys in a later phase to swap in a real
 * implementation without touching checkout code.
 */
const stripeProvider = new StripePaymentProvider();
const razorpayProvider = new RazorpayPaymentProvider();

const providers: Record<PaymentMethodId, PaymentProvider> = {
  COD: new CashOnDeliveryProvider(),
  RAZORPAY: razorpayProvider.isConfigured()
    ? razorpayProvider
    : new NotConfiguredPaymentProvider("RAZORPAY", "UPI / Cards / Netbanking / Wallets", "RAZORPAY_KEY_ID"),
  CARD: stripeProvider.isConfigured() ? stripeProvider : new NotConfiguredPaymentProvider("CARD", "Credit/Debit Card", "STRIPE_SECRET_KEY"),
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
