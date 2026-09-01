import { getSettings } from "@/lib/settings";
import { formatINR } from "@/lib/currency";
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
            {settings.shipping.standardDays} — {formatINR(settings.shipping.standardFee)} (free on orders over{" "}
            {formatINR(settings.shipping.freeShippingThreshold)})
          </p>
        </div>
        <div className="border border-line p-5">
          <p className="font-medium text-ink">Express Delivery</p>
          <p className="mt-1 text-sm">
            {settings.shipping.expressDays} — {formatINR(settings.shipping.expressFee)}
          </p>
        </div>
        {settings.legal.shippingPolicy
          .split("\n\n")
          .filter(Boolean)
          .map((p, i) => (
            <p key={i} className="text-sm">
              {p}
            </p>
          ))}
      </div>
    </Container>
  );
}
