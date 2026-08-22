import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { OrderTimeline } from "@/components/account/OrderTimeline";

interface PageProps {
  params: Promise<{ orderNumber: string }>;
}

export default async function ConfirmationPage({ params }: PageProps) {
  const { orderNumber } = await params;
  const [order, settings] = await Promise.all([
    db.order.findUnique({ where: { orderNumber }, include: { items: true } }),
    getSettings(),
  ]);

  if (!order) notFound();

  return (
    <Container className="mx-auto max-w-2xl py-20 text-center">
      <CheckCircle2 size={48} className="mx-auto text-success" strokeWidth={1.2} />
      <h1 className="mt-6 font-display text-4xl">Thank You!</h1>
      <p className="mt-3 text-ink-soft">
        Your order <strong>{order.orderNumber}</strong> has been placed. We&apos;ve sent a confirmation to your email.
      </p>

      <div className="mt-10 text-left">
        <OrderTimeline status={order.status} />
      </div>

      <div className="mt-10 border border-line p-6 text-left">
        <h2 className="mb-4 font-display text-xl">Order Details</h2>
        <ul className="flex flex-col gap-3">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between text-sm">
              <span>
                {item.productName} {item.variantLabel && `(${item.variantLabel})`} × {item.quantity}
              </span>
              <span>{settings.currencySymbol} {Number(item.subtotal).toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-line pt-4 font-medium">
          <span>Total</span>
          <span>{settings.currencySymbol} {Number(order.total).toFixed(2)}</span>
        </div>
        <p className="mt-2 text-xs text-ink-soft">Payment method: {order.paymentMethod.replace("_", " ")}</p>
      </div>

      <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
        <ButtonLink href="/account/orders">Track Your Order</ButtonLink>
        <ButtonLink href="/men" variant="secondary">
          Continue Shopping
        </ButtonLink>
      </div>
    </Container>
  );
}
