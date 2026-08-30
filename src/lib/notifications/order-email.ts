import { Resend } from "resend";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { renderTemplate } from "./templates";
import { logEmail, wasRecentlySent } from "./email-log";
import { buildOrderEmailHtml, formatDateTime, formatDateOnly, textToHtml, type EmailOrder } from "./email-template";

export const TRACKING_AWARE_KEYS = new Set(["tracking_updated", "order_shipped", "order_out_for_delivery", "order_delivered"]);

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

async function loadOrderForEmail(orderId: string): Promise<EmailOrder | null> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: { select: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
          variant: { select: { imageUrl: true } },
        },
      },
      shipment: true,
    },
  });
  if (!order) return null;

  const url = siteUrl();
  return {
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    currency: order.currency,
    subtotal: Number(order.subtotal),
    discountAmount: Number(order.discountAmount),
    shippingFee: Number(order.shippingFee),
    taxAmount: Number(order.taxAmount),
    total: Number(order.total),
    couponCode: order.couponCode,
    shippingAddress: order.shippingAddress as unknown as EmailOrder["shippingAddress"],
    billingAddress: (order.billingAddress as unknown as EmailOrder["billingAddress"]) ?? null,
    items: order.items.map((item) => ({
      productName: item.productName,
      variantLabel: item.variantLabel,
      quantity: item.quantity,
      price: Number(item.price),
      subtotal: Number(item.subtotal),
      imageUrl: resolveItemImage(item, url),
    })),
    shipment: order.shipment
      ? {
          carrier: order.shipment.carrier,
          courierName: order.shipment.courierName,
          trackingNumber: order.shipment.trackingNumber,
          awbCode: order.shipment.awbCode,
          shippedAt: order.shipment.shippedAt,
          estimatedDelivery: order.shipment.estimatedDelivery,
          trackingStatus: order.shipment.trackingStatus,
        }
      : null,
  };
}

function resolveItemImage(
  item: { variant: { imageUrl: string | null } | null; product: { images: { url: string }[] } | null },
  url: string
): string | null {
  const raw = item.variant?.imageUrl || item.product?.images?.[0]?.url || null;
  if (!raw) return null;
  return /^https?:\/\//i.test(raw) ? raw : `${url.replace(/\/$/, "")}/${raw.replace(/^\//, "")}`;
}

function deriveVariables(order: EmailOrder): Record<string, string | number> {
  const trackUrl = `${siteUrl().replace(/\/$/, "")}/track-order?order=${encodeURIComponent(order.orderNumber)}`;
  return {
    customer_name: order.shippingAddress?.fullName ?? "Customer",
    order_number: order.orderNumber,
    order_date: formatDateTime(order.createdAt) ?? "",
    order_total: order.total,
    payment_method: order.paymentMethod.replace(/_/g, " "),
    payment_status: order.paymentStatus.replace(/_/g, " "),
    shipping_address: [order.shippingAddress?.line1, order.shippingAddress?.line2, order.shippingAddress?.city, order.shippingAddress?.state, order.shippingAddress?.country]
      .filter(Boolean)
      .join(", "),
    order_status: order.status.replace(/_/g, " "),
    tracking_number: order.shipment?.awbCode || order.shipment?.trackingNumber || "",
    courier_name: order.shipment?.courierName || order.shipment?.carrier || "",
    tracking_url: trackUrl,
    expected_delivery_date: formatDateOnly(order.shipment?.estimatedDelivery) ?? "",
  };
}

/**
 * Single orchestration point for every branded transactional email: checks the
 * admin enable/disable toggle, loads real order data, renders the branded HTML,
 * sends it, and logs the attempt. Never throws — callers keep their existing
 * try/catch (or lack thereof) working exactly as before.
 */
export async function sendOrderEmail(params: {
  orderId?: string | null;
  userId?: string | null;
  to: string | null | undefined;
  templateKey: string;
  variables?: Record<string, string | number>;
}): Promise<void> {
  const { orderId, userId, to, templateKey, variables = {} } = params;
  if (!to) return;

  try {
    const templateRow = await db.notificationTemplate.findUnique({ where: { key_channel: { key: templateKey, channel: "EMAIL" } } });
    if (templateRow && !templateRow.isActive) return;

    if (await wasRecentlySent(orderId, templateKey)) return;

    const order = orderId ? await loadOrderForEmail(orderId) : null;
    const mergedVariables = { ...(order ? deriveVariables(order) : {}), ...variables };

    const settings = await getSettings();
    const { subject, body } = await renderTemplate(templateKey, "EMAIL", mergedVariables);
    const finalSubject = subject ?? `Update on your order`;
    const senderName = settings.email.senderName || settings.brandName;
    const html = buildOrderEmailHtml({
      settings,
      siteUrl: siteUrl(),
      senderName,
      footerNote: settings.email.footerNote,
      title: finalSubject,
      introHtml: textToHtml(body),
      order,
      includeTracking: TRACKING_AWARE_KEYS.has(templateKey),
    });

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = settings.email.fromEmailOverride || process.env.RESEND_FROM_EMAIL;
    const replyTo = settings.email.replyToEmail || settings.supportEmail;

    if (apiKey && fromEmail) {
      const resend = new Resend(apiKey);
      const { data, error } = await resend.emails.send({ from: `${senderName} <${fromEmail}>`, to, subject: finalSubject, html, replyTo });
      if (error) throw new Error(error.message);
      await logEmail({ orderId, userId, toEmail: to, notificationType: templateKey, subject: finalSubject, htmlBody: html, status: "SENT", providerMessageId: data?.id ?? null });
    } else {
      console.log(`[order-email:${templateKey}] -> ${to} | RESEND not configured, logging only | subject="${finalSubject}"`);
      await logEmail({ orderId, userId, toEmail: to, notificationType: templateKey, subject: finalSubject, htmlBody: html, status: "SENT" });
    }
  } catch (err) {
    console.error(`[order-email] sendOrderEmail(${templateKey}) failed`, err);
    await logEmail({
      orderId,
      userId,
      toEmail: to,
      notificationType: templateKey,
      subject: `Update on your order`,
      htmlBody: "",
      status: "FAILED",
      errorMessage: err instanceof Error ? err.message : String(err),
    });
  }
}
