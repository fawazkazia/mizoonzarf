import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatINR } from "@/lib/currency";
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
  const isProvisional = !order.invoiceNumber;
  const hasCgstSgst = Number(order.cgstAmount) > 0;
  const hasIgst = Number(order.igstAmount) > 0;

  return (
    <div className="mx-auto max-w-3xl bg-paper p-8 print:p-0">
      <div className="mb-6 flex justify-end print:hidden">
        <PrintButton />
      </div>

      <div className="flex items-start justify-between border-b border-line pb-6">
        <div>
          <h1 className="font-display text-3xl">{settings.brandName}</h1>
          <p className="mt-1 text-sm text-ink-soft">Sold by: {settings.gst.sellerLegalName || settings.brandName}</p>
          <p className="text-sm text-ink-soft">{settings.gst.sellerAddress || settings.footer.contactAddress}</p>
          {settings.gst.sellerGstin && <p className="text-sm text-ink-soft">GSTIN: {settings.gst.sellerGstin}</p>}
          <p className="text-sm text-ink-soft">{settings.supportEmail}</p>
        </div>
        <div className="text-right">
          <h2 className="font-display text-2xl">Tax Invoice</h2>
          {isProvisional ? (
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-sale">Provisional — not a tax invoice</p>
          ) : (
            <>
              <p className="text-sm text-ink-soft">Invoice #{order.invoiceNumber}</p>
              <p className="text-sm text-ink-soft">{order.invoiceDate?.toLocaleDateString()}</p>
            </>
          )}
          <p className="text-sm text-ink-soft">Order #{order.orderNumber}</p>
          <p className="text-sm text-ink-soft">{order.createdAt.toLocaleDateString()}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-soft">Billed To</p>
          <p className="mt-1">{order.user?.name ?? address.fullName}</p>
          <p className="text-ink-soft">{order.user?.email ?? order.guestEmail}</p>
          {order.customerGstin && <p className="text-ink-soft">Buyer GSTIN: {order.customerGstin}</p>}
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
            <th className="py-2">HSN/SAC</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 text-right">Price</th>
            <th className="py-2 text-right">GST%</th>
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
              <td className="py-2 text-ink-soft">{item.hsnCode ?? "—"}</td>
              <td className="py-2 text-right">{item.quantity}</td>
              <td className="py-2 text-right">{formatINR(Number(item.price))}</td>
              <td className="py-2 text-right">{Number(item.gstRate)}%</td>
              <td className="py-2 text-right">{formatINR(Number(item.subtotal))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 flex justify-end">
        <div className="flex w-64 flex-col gap-1.5 text-sm">
          <div className="flex justify-between text-ink-soft">
            <span>Subtotal</span>
            <span>{formatINR(Number(order.subtotal))}</span>
          </div>
          <div className="flex justify-between text-ink-soft">
            <span>Discount</span>
            <span>-{formatINR(Number(order.discountAmount))}</span>
          </div>
          <div className="flex justify-between text-ink-soft">
            <span>Shipping</span>
            <span>{formatINR(Number(order.shippingFee))}</span>
          </div>
          {hasCgstSgst && (
            <>
              <div className="flex justify-between text-ink-soft">
                <span>CGST</span>
                <span>{formatINR(Number(order.cgstAmount))}</span>
              </div>
              <div className="flex justify-between text-ink-soft">
                <span>SGST</span>
                <span>{formatINR(Number(order.sgstAmount))}</span>
              </div>
            </>
          )}
          {hasIgst && (
            <div className="flex justify-between text-ink-soft">
              <span>IGST</span>
              <span>{formatINR(Number(order.igstAmount))}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-line pt-2 text-base font-medium">
            <span>Total</span>
            <span>{formatINR(Number(order.total))}</span>
          </div>
        </div>
      </div>

      <p className="mt-10 text-center text-xs text-ink-soft">Payment method: {order.paymentMethod.replace(/_/g, " ")} · Thank you for your order.</p>
    </div>
  );
}
