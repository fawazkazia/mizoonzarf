import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getOrCreateCart, getCartWithItems } from "@/lib/server/cart";
import { calculateTotals, generateOrderNumber, type AppliedCoupon } from "@/lib/cart";
import { checkoutSchema } from "@/lib/validation/checkout";
import { getPaymentProvider } from "@/lib/payments/registry";
import { notify, ORDER_EVENT_TEMPLATES } from "@/lib/notifications/registry";
import { markOrderFailed } from "@/lib/orders/payment-events";
import { maybeAutoCreateShipment } from "@/lib/shipping/orchestrator";
import { resolveCheckoutPhoneVerification } from "@/lib/otp/checkout-verification";
import { GUEST_PHONE_TOKEN_COOKIE, COD_CONFIRM_VALIDITY_MINUTES } from "@/lib/otp/constants";
import { computeOrderRisk } from "@/lib/risk/computeOrderRisk";

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

  // Server-side enforcement of mobile verification — the frontend also gates this, but a
  // request straight to this endpoint (bypassing the UI) must be refused here too.
  const phoneVerified = await resolveCheckoutPhoneVerification({
    phone: input.phone,
    userId: session?.user?.id,
    guestPhoneToken: req.cookies.get(GUEST_PHONE_TOKEN_COOKIE)?.value,
  });
  if (!phoneVerified) {
    return NextResponse.json(
      { error: "Please verify your mobile number before placing your order.", code: "PHONE_NOT_VERIFIED" },
      { status: 403 }
    );
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
    gstRate: item.product.gstRate != null ? Number(item.product.gstRate) : settings.taxPercent,
  }));

  const shippingState = input.address.state ?? null;
  const totals = calculateTotals(lines, settings, coupon, input.deliveryMethod, shippingState);
  const orderNumber = generateOrderNumber();

  const risk = await computeOrderRisk({
    userId: session?.user?.id,
    phone: input.phone,
    address: { line1: input.address.line1, postalCode: input.address.postalCode },
    paymentMethod: input.paymentMethod,
    orderTotal: totals.total,
    highValueCodThreshold: settings.codRisk.highValueCodThreshold,
  });

  let codConfirmedAt: Date | null = null;
  if (input.paymentMethod === "COD") {
    if (totals.total > settings.codRisk.maxCodOrderValue) {
      return NextResponse.json(
        { error: `Cash on Delivery isn't available for orders over ${settings.currencySymbol}${settings.codRisk.maxCodOrderValue}. Please choose a different payment method.`, code: "COD_UNAVAILABLE" },
        { status: 400 }
      );
    }

    const identityWhere = session?.user?.id ? { userId: session.user.id } : { guestPhone: input.phone };
    const codOrderCount = await db.order.count({
      where: { ...identityWhere, paymentMethod: "COD", createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
    });
    if (codOrderCount >= settings.codRisk.maxCodOrdersPerCustomer) {
      return NextResponse.json(
        { error: "You've reached the limit for Cash on Delivery orders. Please choose a prepaid payment method.", code: "COD_UNAVAILABLE" },
        { status: 400 }
      );
    }

    if (risk.riskLevel === "HIGH") {
      if (!settings.codRisk.allowHighRiskCod) {
        return NextResponse.json(
          { error: "Cash on Delivery isn't available for this order. Please choose a different payment method.", code: "COD_UNAVAILABLE" },
          { status: 400 }
        );
      }
      if (settings.codRisk.requireConfirmOnHighRiskCod) {
        const recentConfirm = await db.phoneOtp.findFirst({
          where: {
            phone: input.phone,
            purpose: "COD_RISK_CONFIRM",
            consumedAt: { gte: new Date(Date.now() - COD_CONFIRM_VALIDITY_MINUTES * 60 * 1000) },
          },
          orderBy: { consumedAt: "desc" },
        });
        if (!recentConfirm) {
          return NextResponse.json(
            { error: "Please confirm your Cash on Delivery order with the code we texted you.", code: "COD_CONFIRM_REQUIRED" },
            { status: 403 }
          );
        }
        codConfirmedAt = recentConfirm.consumedAt;
      }
    }
  }

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
        cgstAmount: totals.cgstAmount,
        sgstAmount: totals.sgstAmount,
        igstAmount: totals.igstAmount,
        customerGstin: input.gstin || null,
        sellerGstin: settings.gst.sellerGstin || null,
        sellerState: settings.gst.sellerState || null,
        total: totals.total,
        currency: settings.currency,
        couponCode: cart.couponCode,
        paymentMethod: input.paymentMethod,
        paymentStatus: "PENDING",
        deliveryMethod: input.deliveryMethod,
        shippingAddress: input.address,
        notes: input.notes,
        riskLevel: risk.riskLevel,
        riskScore: risk.riskScore,
        riskReasons: risk.riskReasons,
        phoneVerified: true,
        codConfirmedAt,
        items: {
          create: cart.items.map((item, i) => ({
            productId: item.productId,
            variantId: item.variantId,
            productName: item.product.name,
            variantLabel: [item.variant.size, item.variant.color].filter(Boolean).join(" / ") || null,
            sku: item.variant.sku,
            price: item.variant.salePrice ?? item.variant.price,
            quantity: item.quantity,
            subtotal: Number(item.variant.salePrice ?? item.variant.price) * item.quantity,
            gstRate: lines[i].gstRate,
            hsnCode: item.product.hsnCode,
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  let charge;
  try {
    charge = await provider.charge({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: totals.total,
      currency: settings.currency,
      successUrl: `${siteUrl}/checkout/confirmation/${order.orderNumber}?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${siteUrl}/checkout`,
    });
  } catch (err) {
    console.error("[checkout] provider.charge failed", err);
    await markOrderFailed(order.id, "Payment could not be initiated.");
    return NextResponse.json({ error: "We couldn't start your payment. Please try again." }, { status: 502 });
  }

  try {
    await db.payment.create({
      data: {
        orderId: order.id,
        provider: input.paymentMethod,
        status: charge.status,
        amount: totals.total,
        currency: settings.currency,
        transactionRef: charge.transactionRef,
        rawResponse: charge.raw as never,
      },
    });
  } catch (err) {
    console.error("[checkout] failed to record payment row", err);
  }

  const notifyVariables = { customer_name: input.address.fullName, order_number: order.orderNumber, order_total: totals.total };
  for (const notification of [
    { channel: "EMAIL" as const, to: session?.user?.email ?? input.email },
    { channel: "WHATSAPP" as const, to: input.phone },
    { channel: "SMS" as const, to: input.phone },
  ]) {
    try {
      await notify({ channel: notification.channel, to: notification.to, templateKey: ORDER_EVENT_TEMPLATES.ORDER_PLACED, variables: notifyVariables });
    } catch (err) {
      console.error(`[checkout] notify(${notification.channel}) failed`, err);
    }
  }

  // COD orders never pass through markOrderPaid (no gateway confirms them) — they're
  // "confirmed" at placement by design in this codebase, so trigger shipment creation here.
  if (input.paymentMethod === "COD") {
    await maybeAutoCreateShipment(order.id);
  }

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    orderNumber: order.orderNumber,
    redirectUrl: charge.redirectUrl,
    clientAction: charge.clientAction,
  });
}
