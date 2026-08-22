import { getSettings } from "@/lib/settings";
import { Container } from "@/components/ui/Container";

export const metadata = { title: "Shipping Information" };

export default async function ShippingPage() {
  const settings = await getSettings();

  return (
    <Container className="mx-auto max-w-2xl py-16">
      <h1 className="font-display text-4xl">Shipping Information</h1>
      <div className="mt-8 flex flex-col gap-6 text-ink-soft">
        <div className="border border-line p-5">
          <p className="font-medium text-ink">Standard Delivery</p>
          <p className="mt-1 text-sm">
            {settings.shipping.standardDays} — {settings.currencySymbol} {settings.shipping.standardFee} (free on orders over{" "}
            {settings.currencySymbol} {settings.shipping.freeShippingThreshold})
          </p>
        </div>
        <div className="border border-line p-5">
          <p className="font-medium text-ink">Express Delivery</p>
          <p className="mt-1 text-sm">
            {settings.shipping.expressDays} — {settings.currencySymbol} {settings.shipping.expressFee}
          </p>
        </div>
        <p className="text-sm">
          Orders are processed within 1 business day. You&apos;ll receive a shipping confirmation with tracking details
          as soon as your order leaves our warehouse. Delivery times may vary for remote areas.
        </p>
      </div>
    </Container>
  );
}
