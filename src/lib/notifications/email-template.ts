import type { SiteSettings } from "@/lib/settings";

/** Brand tokens mirrored from src/app/globals.css — CSS variables don't exist in email clients. */
const COLOR_INK = "#14130f";
const COLOR_INK_SOFT = "#5c584e";
const COLOR_GOLD = "#a9803f";
const COLOR_GOLD_SOFT = "#d8c39a";
const COLOR_PAPER = "#faf7f2";
const COLOR_PAPER_RAISE = "#ffffff";
const COLOR_LINE = "#e7e1d4";
const COLOR_SALE = "#a3372f";
const COLOR_SUCCESS = "#3f6b4c";
const FONT_STACK = "'Manrope', 'Segoe UI', Helvetica, Arial, sans-serif";

export function escapeHtml(input: string): string {
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Renders plain admin-authored copy as HTML — escaped first, so the template editor can never inject markup, then line breaks become <br>. */
export function textToHtml(text: string): string {
  return escapeHtml(text).replace(/\n/g, "<br>");
}

export function absoluteUrl(pathOrUrl: string | null | undefined, siteUrl: string): string | null {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${siteUrl.replace(/\/$/, "")}/${pathOrUrl.replace(/^\//, "")}`;
}

export function formatDateTime(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export function formatDateOnly(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", { dateStyle: "medium" });
}

function money(amount: number, currency: string): string {
  const hasFraction = Math.round(amount * 100) % 100 !== 0;
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      minimumFractionDigits: hasFraction ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export interface EmailOrderItem {
  productName: string;
  variantLabel: string | null;
  quantity: number;
  price: number;
  subtotal: number;
  imageUrl: string | null;
}

export interface EmailAddress {
  fullName: string;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  country: string;
  postalCode?: string | null;
  phone: string;
}

export interface EmailShipment {
  carrier: string | null;
  courierName: string | null;
  trackingNumber: string | null;
  awbCode: string | null;
  shippedAt: Date | null;
  estimatedDelivery: Date | null;
  trackingStatus: string | null;
}

export interface EmailOrder {
  orderNumber: string;
  createdAt: Date;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  currency: string;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  taxAmount: number;
  total: number;
  couponCode: string | null;
  shippingAddress: EmailAddress;
  billingAddress: EmailAddress | null;
  items: EmailOrderItem[];
  shipment: EmailShipment | null;
}

interface BrandContext {
  settings: SiteSettings;
  siteUrl: string;
  senderName: string;
  footerNote: string;
}

/** Full HTML document: logo/brand header, a content slot, and a footer with support info. Table-based + inline styles for client compatibility; single ~600px column keeps it mobile-responsive without extra media queries. */
export function renderBrandShell(ctx: BrandContext & { preheader: string; contentHtml: string }): string {
  const { settings, siteUrl, senderName, footerNote, preheader, contentHtml } = ctx;
  const logoUrl = absoluteUrl(settings.branding.logoUrl, siteUrl);
  const homeUrl = siteUrl.replace(/\/$/, "");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(senderName)}</title>
<style>
  body, table, td { font-family: ${FONT_STACK}; }
  @media only screen and (max-width: 620px) {
    .email-container { width: 100% !important; }
    .email-pad { padding-left: 20px !important; padding-right: 20px !important; }
    .item-thumb { width: 56px !important; height: 56px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${COLOR_PAPER};color:${COLOR_INK};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLOR_PAPER};padding:24px 0;">
  <tr>
    <td align="center">
      <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background-color:${COLOR_PAPER_RAISE};border-radius:16px;overflow:hidden;border:1px solid ${COLOR_LINE};">
        <tr>
          <td align="center" style="background-color:${COLOR_INK};padding:28px 24px;">
            <a href="${escapeHtml(homeUrl)}" style="text-decoration:none;">
              ${
                logoUrl
                  ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(senderName)}" height="36" style="height:36px;max-height:36px;display:inline-block;border:0;">`
                  : `<span style="font-family:${FONT_STACK};font-size:22px;font-weight:700;letter-spacing:0.08em;color:#ffffff;">${escapeHtml(senderName.toUpperCase())}</span>`
              }
            </a>
          </td>
        </tr>
        <tr>
          <td class="email-pad" style="padding:32px 40px;">
            ${contentHtml}
          </td>
        </tr>
        <tr>
          <td class="email-pad" style="padding:24px 40px 32px;border-top:1px solid ${COLOR_LINE};">
            <p style="margin:0 0 6px;font-size:13px;line-height:1.6;color:${COLOR_INK_SOFT};">
              Need help? Contact us at
              <a href="mailto:${escapeHtml(settings.supportEmail)}" style="color:${COLOR_GOLD};text-decoration:none;">${escapeHtml(settings.supportEmail)}</a>
              ${settings.header.supportPhone ? ` or ${escapeHtml(settings.header.supportPhone)}` : ""}.
            </p>
            ${settings.footer.contactAddress ? `<p style="margin:0 0 6px;font-size:12px;line-height:1.6;color:${COLOR_INK_SOFT};">${escapeHtml(settings.footer.contactAddress)}</p>` : ""}
            ${footerNote ? `<p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:${COLOR_INK_SOFT};">${textToHtml(footerNote)}</p>` : ""}
            <p style="margin:16px 0 0;font-size:11px;color:${COLOR_GOLD_SOFT};">&copy; ${new Date().getFullYear()} ${escapeHtml(senderName)}. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export function renderButton(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;">
  <tr>
    <td style="border-radius:999px;background-color:${COLOR_GOLD};">
      <a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 28px;font-family:${FONT_STACK};font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.02em;border-radius:999px;">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>`;
}

function statusPill(text: string, tone: "gold" | "success" | "sale" = "gold"): string {
  const bg = tone === "success" ? "#e7f0ea" : tone === "sale" ? "#f6e6e4" : "#f4ede1";
  const fg = tone === "success" ? COLOR_SUCCESS : tone === "sale" ? COLOR_SALE : COLOR_GOLD;
  return `<span style="display:inline-block;padding:3px 10px;border-radius:999px;background-color:${bg};color:${fg};font-size:11px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;">${escapeHtml(text)}</span>`;
}

function addressBlock(label: string, addr: EmailAddress): string {
  const lines = [addr.fullName, addr.line1, addr.line2, [addr.city, addr.state].filter(Boolean).join(", "), addr.postalCode, addr.country, addr.phone].filter(Boolean);
  return `<td valign="top" style="padding:0 12px 0 0;width:50%;">
    <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${COLOR_INK_SOFT};">${escapeHtml(label)}</p>
    ${lines.map((l) => `<p style="margin:0;font-size:13px;line-height:1.6;color:${COLOR_INK};">${escapeHtml(String(l))}</p>`).join("")}
  </td>`;
}

/** Item table, totals, payment status, and shipping/billing address — always built from real order data, never admin-editable. */
export function renderOrderSummaryHtml(order: EmailOrder): string {
  const itemRows = order.items
    .map(
      (item) => `<tr>
        <td style="padding:14px 0;border-bottom:1px solid ${COLOR_LINE};" width="64">
          ${
            item.imageUrl
              ? `<img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.productName)}" class="item-thumb" width="64" height="64" style="width:64px;height:64px;object-fit:cover;border-radius:10px;border:1px solid ${COLOR_LINE};display:block;">`
              : `<div class="item-thumb" style="width:64px;height:64px;border-radius:10px;background-color:${COLOR_PAPER};border:1px solid ${COLOR_LINE};"></div>`
          }
        </td>
        <td style="padding:14px 12px;border-bottom:1px solid ${COLOR_LINE};" valign="top">
          <p style="margin:0 0 2px;font-size:13px;font-weight:600;color:${COLOR_INK};">${escapeHtml(item.productName)}</p>
          ${item.variantLabel ? `<p style="margin:0 0 2px;font-size:12px;color:${COLOR_INK_SOFT};">${escapeHtml(item.variantLabel)}</p>` : ""}
          <p style="margin:0;font-size:12px;color:${COLOR_INK_SOFT};">Qty ${item.quantity} &times; ${escapeHtml(money(item.price, order.currency))}</p>
        </td>
        <td style="padding:14px 0;border-bottom:1px solid ${COLOR_LINE};text-align:right;white-space:nowrap;" valign="top">
          <p style="margin:0;font-size:13px;font-weight:700;color:${COLOR_INK};">${escapeHtml(money(item.subtotal, order.currency))}</p>
        </td>
      </tr>`
    )
    .join("");

  const totalsRow = (label: string, value: string, bold = false) => `<tr>
    <td style="padding:4px 0;font-size:${bold ? "14px" : "12px"};color:${bold ? COLOR_INK : COLOR_INK_SOFT};font-weight:${bold ? 700 : 400};">${escapeHtml(label)}</td>
    <td style="padding:4px 0;text-align:right;font-size:${bold ? "14px" : "12px"};color:${bold ? COLOR_INK : COLOR_INK_SOFT};font-weight:${bold ? 700 : 400};">${escapeHtml(value)}</td>
  </tr>`;

  const paymentTone = order.paymentStatus === "PAID" ? "success" : order.paymentStatus === "FAILED" ? "sale" : "gold";

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    ${itemRows}
  </table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">
    ${totalsRow("Subtotal", money(order.subtotal, order.currency))}
    ${order.discountAmount > 0 ? totalsRow(order.couponCode ? `Discount (${order.couponCode})` : "Discount", `-${money(order.discountAmount, order.currency)}`) : ""}
    ${totalsRow("Shipping", order.shippingFee > 0 ? money(order.shippingFee, order.currency) : "Free")}
    ${order.taxAmount > 0 ? totalsRow("Tax", money(order.taxAmount, order.currency)) : ""}
    <tr><td colspan="2" style="border-top:1px solid ${COLOR_LINE};padding-top:8px;"></td></tr>
    ${totalsRow("Grand Total", money(order.total, order.currency), true)}
  </table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;">
    <tr>
      <td style="font-size:13px;color:${COLOR_INK_SOFT};">Payment method: <strong style="color:${COLOR_INK};">${escapeHtml(order.paymentMethod.replace(/_/g, " "))}</strong></td>
      <td style="text-align:right;">${statusPill(order.paymentStatus.replace(/_/g, " "), paymentTone)}</td>
    </tr>
  </table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
    <tr>
      ${addressBlock("Shipping Address", order.shippingAddress)}
      ${order.billingAddress ? addressBlock("Billing Address", order.billingAddress) : ""}
    </tr>
  </table>`;
}

/** Courier, tracking number, dates, and a "Track Shipment" CTA to the existing public /track-order page. */
export function renderTrackingBlockHtml(order: EmailOrder, shipment: EmailShipment, siteUrl: string): string {
  const trackUrl = `${siteUrl.replace(/\/$/, "")}/track-order?order=${encodeURIComponent(order.orderNumber)}`;
  const courier = shipment.courierName || shipment.carrier;
  const trackingNumber = shipment.awbCode || shipment.trackingNumber;
  const rows = [
    courier ? ["Courier", courier] : null,
    trackingNumber ? ["Tracking / AWB Number", trackingNumber] : null,
    shipment.shippedAt ? ["Shipped On", formatDateTime(shipment.shippedAt)] : null,
    shipment.estimatedDelivery ? ["Expected Delivery", formatDateOnly(shipment.estimatedDelivery)] : null,
  ].filter((r): r is [string, string] => r !== null);

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;background-color:${COLOR_PAPER};border-radius:12px;">
    <tr><td style="padding:16px 18px;">
      ${rows
        .map(
          ([label, value]) =>
            `<p style="margin:0 0 6px;font-size:12px;color:${COLOR_INK_SOFT};">${escapeHtml(label)}: <strong style="color:${COLOR_INK};">${escapeHtml(value)}</strong></p>`
        )
        .join("")}
    </td></tr>
  </table>
  ${renderButton("Track Shipment", trackUrl)}`;
}

export function buildOrderEmailHtml(params: {
  settings: SiteSettings;
  siteUrl: string;
  senderName: string;
  footerNote: string;
  title: string;
  introHtml: string;
  order: EmailOrder | null;
  includeTracking: boolean;
}): string {
  const { settings, siteUrl, senderName, footerNote, title, introHtml, order, includeTracking } = params;
  const trackOrderUrl = order ? `${siteUrl.replace(/\/$/, "")}/track-order?order=${encodeURIComponent(order.orderNumber)}` : null;

  const contentHtml = `
    <h1 style="margin:0 0 4px;font-size:20px;font-weight:700;color:${COLOR_INK};">${escapeHtml(title)}</h1>
    ${order ? `<p style="margin:0 0 18px;font-size:13px;color:${COLOR_INK_SOFT};">Order <strong style="color:${COLOR_INK};">${escapeHtml(order.orderNumber)}</strong> &middot; Placed ${escapeHtml(formatDateTime(order.createdAt) ?? "")}</p>` : ""}
    <div style="font-size:14px;line-height:1.7;color:${COLOR_INK};">${introHtml}</div>
    ${order && includeTracking && order.shipment ? renderTrackingBlockHtml(order, order.shipment, siteUrl) : ""}
    ${order ? renderOrderSummaryHtml(order) : ""}
    ${order && !includeTracking && trackOrderUrl ? renderButton("Track Your Order", trackOrderUrl) : ""}
  `;

  return renderBrandShell({
    settings,
    siteUrl,
    senderName,
    footerNote,
    preheader: title,
    contentHtml,
  });
}
