import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { PrintButton } from "./PrintButton";

export const metadata = { title: "Invoice" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoicePage({ params }: PageProps) {
  const { id } = await params;
  const [order, settings] = await Promise.all([
    db.order.findUnique({ where: { id }, include: { items: true, user: { select: { name: true, email: true } } } }),
    getSettings(),
  ]);

  if (!order) notFound();

  const address = order.shippingAddress as { fullName: string; phone: string; line1: string; line2?: string; city: string; country: string };

  return (
    <div className="mx-auto max-w-3xl bg-paper p-8 print:p-0">
      <div className="mb-6 flex justify-end print:hidden">
        <PrintButton />
      </div>

      <div className="flex items-start justify-between border-b border-line pb-6">
        <div>
          <h1 className="font-display text-3xl">{settings.brandName}</h1>
          <p className="mt-1 text-sm text-ink-soft">{settings.footer.contactAddress}</p>
          <p className="text-sm text-ink-soft">{settings.supportEmail}</p>
        </div>
        <div className="text-right">
          <h2 className="font-display text-2xl">Invoice</h2>
          <p className="text-sm text-ink-soft">Order #{order.orderNumber}</p>
          <p className="text-sm text-ink-soft">{order.createdAt.toLocaleDateString()}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-soft">Billed To</p>
          <p className="mt-1">{order.user?.name ?? address.fullName}</p>
          <p className="text-ink-soft">{order.user?.email ?? order.guestEmail}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-soft">Ship To</p>
          <p className="mt-1">
            {address.fullName}
            <br />
            {address.line1}
            {address.line2 && <>, {address.line2}</>}
            <br />
            {address.city}, {address.country}
            <br />
            {address.phone}
          </p>
        </div>
      </div>

      <table className="mt-8 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-soft">
            <th className="py-2">Item</th>
            <th className="py-2">SKU</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 text-right">Price</th>
            <th className="py-2 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id} className="border-b border-line/50">
              <td className="py-2">
                {item.productName} {item.variantLabel && `(${item.variantLabel})`}
              </td>
              <td className="py-2 text-ink-soft">{item.sku}</td>
              <td className="py-2 text-right">{item.quantity}</td>
              <td className="py-2 text-right">
                {settings.currencySymbol} {Number(item.price).toFixed(2)}
              </td>
              <td className="py-2 text-right">
                {settings.currencySymbol} {Number(item.subtotal).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 flex justify-end">
        <div className="flex w-64 flex-col gap-1.5 text-sm">
          <div className="flex justify-between text-ink-soft">
            <span>Subtotal</span>
            <span>
              {settings.currencySymbol} {Number(order.subtotal).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-ink-soft">
            <span>Discount</span>
            <span>
              -{settings.currencySymbol} {Number(order.discountAmount).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-ink-soft">
            <span>Shipping</span>
            <span>
              {settings.currencySymbol} {Number(order.shippingFee).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-ink-soft">
            <span>VAT</span>
            <span>
              {settings.currencySymbol} {Number(order.taxAmount).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-base font-medium">
            <span>Total</span>
            <span>
              {settings.currencySymbol} {Number(order.total).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <p className="mt-10 text-center text-xs text-ink-soft">Payment method: {order.paymentMethod.replace(/_/g, " ")} · Thank you for your order.</p>
    </div>
  );
}
