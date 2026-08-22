import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getOrCreateCart, getCartWithItems } from "@/lib/server/cart";
import { calculateTotals, generateOrderNumber, type AppliedCoupon } from "@/lib/cart";
import { checkoutSchema } from "@/lib/validation/checkout";
import { getPaymentProvider } from "@/lib/payments/registry";
import { notify, ORDER_EVENT_TEMPLATES } from "@/lib/notifications/registry";

export async function POST(req: NextRequest) {
  const body = checkoutSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.issues[0].message }, { status: 400 });
  }
  const input = body.data;

  const session = await auth();
  const cartHeader = await getOrCreateCart();
  const cart = await getCartWithItems(cartHeader.id);

  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  const insufficient = cart.items.filter((i) => i.quantity > i.variant.stock);
  if (insufficient.length > 0) {
    return NextResponse.json(
      { error: `${insufficient[0].product.name} only has ${insufficient[0].variant.stock} left in stock.` },
      { status: 400 }
    );
  }

  const provider = getPaymentProvider(input.paymentMethod);
  if (!provider.isConfigured()) {
    return NextResponse.json(
      { error: `${provider.label} isn't connected yet. Please choose Cash on Delivery.` },
      { status: 400 }
    );
  }

  const settings = await getSettings();

  let coupon: AppliedCoupon | null = null;
  const couponRecord = cart.couponCode ? await db.coupon.findUnique({ where: { code: cart.couponCode } }) : null;
  if (couponRecord) {
    coupon = {
      discountType: couponRecord.discountType,
      discountValue: Number(couponRecord.discountValue),
      minOrderValue: couponRecord.minOrderValue ? Number(couponRecord.minOrderValue) : null,
      maxDiscountAmount: couponRecord.maxDiscountAmount ? Number(couponRecord.maxDiscountAmount) : null,
    };
  }

  const lines = cart.items.map((item) => ({
    price: Number(item.variant.price),
    salePrice: item.variant.salePrice ? Number(item.variant.salePrice) : null,
    quantity: item.quantity,
  }));

  const totals = calculateTotals(lines, settings, coupon, input.deliveryMethod);
  const orderNumber = generateOrderNumber();

  const order = await db.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        userId: session?.user?.id,
        guestEmail: session?.user ? undefined : input.email,
        guestPhone: session?.user ? undefined : input.phone,
        status: "ORDER_PLACED",
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        shippingFee: totals.shippingFee,
        taxAmount: totals.taxAmount,
        total: totals.total,
        currency: settings.currency,
        couponCode: cart.couponCode,
        paymentMethod: input.paymentMethod,
        paymentStatus: "PENDING",
        deliveryMethod: input.deliveryMethod,
        shippingAddress: input.address,
        notes: input.notes,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            productName: item.product.name,
            variantLabel: [item.variant.size, item.variant.color].filter(Boolean).join(" / ") || null,
            sku: item.variant.sku,
            price: item.variant.salePrice ?? item.variant.price,
            quantity: item.quantity,
            subtotal: Number(item.variant.salePrice ?? item.variant.price) * item.quantity,
          })),
        },
        statusHistory: { create: { status: "ORDER_PLACED", note: "Order placed by customer." } },
      },
    });

    for (const item of cart.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { decrement: item.quantity } },
      });
      await tx.product.update({
        where: { id: item.productId },
        data: { purchaseCount: { increment: item.quantity } },
      });
    }

    if (session?.user && input.saveAddress) {
      const existingCount = await tx.address.count({ where: { userId: session.user.id } });
      await tx.address.create({
        data: { ...input.address, userId: session.user.id, isDefault: existingCount === 0 },
      });
    }

    if (cart.couponCode) {
      await tx.coupon.update({ where: { code: cart.couponCode }, data: { usageCount: { increment: 1 } } });
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    await tx.cart.update({ where: { id: cart.id }, data: { couponCode: null } });

    return created;
  });

  const charge = await provider.charge({ orderId: order.id, orderNumber: order.orderNumber, amount: totals.total, currency: settings.currency });

  await db.payment.create({
    data: {
      orderId: order.id,
      provider: input.paymentMethod,
      status: charge.status,
      amount: totals.total,
      currency: settings.currency,
      transactionRef: charge.transactionRef,
    },
  });

  await notify({
    channel: "EMAIL",
    to: session?.user?.email ?? input.email,
    templateKey: ORDER_EVENT_TEMPLATES.ORDER_PLACED,
    variables: { customer_name: input.address.fullName, order_number: order.orderNumber, order_total: totals.total },
  });
  await notify({
    channel: "WHATSAPP",
    to: input.phone,
    templateKey: ORDER_EVENT_TEMPLATES.ORDER_PLACED,
    variables: { customer_name: input.address.fullName, order_number: order.orderNumber, order_total: totals.total },
  });

  return NextResponse.json({ ok: true, orderNumber: order.orderNumber });
}
