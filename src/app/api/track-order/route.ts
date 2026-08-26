import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const schema = z.object({
  orderNumber: z.string().trim().min(1),
  email: z.string().trim().email(),
});

const NOT_FOUND_MESSAGE = "We couldn't find an order with that order number and email. Double-check both and try again.";

/**
 * Public lookup for guest orders — no session required. Requires an exact
 * match on BOTH the order number and the email used at checkout (guest or
 * signed-in) so an order number alone (a guessable FK-YYYYMMDD-#### string)
 * can't be used to pull up someone else's order.
 */
export async function POST(req: NextRequest) {
  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Enter your order number and the email used at checkout." }, { status: 400 });
  }

  const { orderNumber, email } = body.data;
  const normalizedEmail = email.toLowerCase();

  const order = await db.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
      shipment: { include: { events: { orderBy: { occurredAt: "desc" } } } },
      user: { select: { email: true } },
    },
  });

  const contactEmail = (order?.guestEmail ?? order?.user?.email)?.toLowerCase();
  if (!order || contactEmail !== normalizedEmail) {
    return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
  }

  return NextResponse.json({
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt,
    subtotal: Number(order.subtotal),
    discountAmount: Number(order.discountAmount),
    shippingFee: Number(order.shippingFee),
    cgstAmount: Number(order.cgstAmount),
    sgstAmount: Number(order.sgstAmount),
    igstAmount: Number(order.igstAmount),
    total: Number(order.total),
    paymentMethod: order.paymentMethod,
    shippingAddress: order.shippingAddress,
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      variantLabel: item.variantLabel,
      quantity: item.quantity,
      subtotal: Number(item.subtotal),
    })),
    statusHistory: order.statusHistory.map((h) => ({ status: h.status, note: h.note, createdAt: h.createdAt })),
    shipment: order.shipment
      ? {
          provider: order.shipment.provider,
          carrier: order.shipment.carrier,
          courierName: order.shipment.courierName,
          trackingNumber: order.shipment.trackingNumber,
          awbCode: order.shipment.awbCode,
          estimatedDelivery: order.shipment.estimatedDelivery,
          shippedAt: order.shipment.shippedAt,
          deliveredAt: order.shipment.deliveredAt,
          trackingStatus: order.shipment.trackingStatus,
          deliveryException: order.shipment.deliveryException,
          events: order.shipment.events.map((e) => ({
            status: e.status,
            occurredAt: e.occurredAt,
            location: e.location,
            activity: e.activity,
          })),
        }
      : null,
  });
}
