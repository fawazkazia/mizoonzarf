import type { EmailOrder } from "./email-template";

/**
 * Canonical registry of every EMAIL notification type the system can send.
 * Drives the admin "Email Notifications" UI (template editor, preview, test
 * send) and the default-template fallbacks in templates.ts. `key` must match
 * NotificationTemplate.key and EmailLog.notificationType exactly.
 */
export interface EmailNotificationDef {
  key: string;
  label: string;
  description: string;
  group: "order" | "return" | "tracking";
  /** Sample values used to render a Preview / test send without a real order. */
  sampleVariables: Record<string, string | number>;
}

const SAMPLE_ORDER_VARS = {
  customer_name: "Aisha Khan",
  order_number: "MZ-20260830-0001",
  order_date: "30 Aug 2026, 4:12 PM",
  order_total: 4298,
  payment_method: "Razorpay",
  payment_status: "Paid",
  shipping_address: "12 Marine Drive, Mumbai, Maharashtra 400002",
};

export const EMAIL_NOTIFICATION_CATALOG: EmailNotificationDef[] = [
  {
    key: "order_placed",
    label: "Order Confirmed",
    description: "Sent immediately after a customer places an order.",
    group: "order",
    sampleVariables: { ...SAMPLE_ORDER_VARS },
  },
  {
    key: "payment_confirmed",
    label: "Payment Successful",
    description: "Sent when a prepaid order's payment is confirmed.",
    group: "order",
    sampleVariables: { ...SAMPLE_ORDER_VARS },
  },
  {
    key: "payment_failed",
    label: "Payment Failed",
    description: "Sent when a payment attempt fails and the order is cancelled.",
    group: "order",
    sampleVariables: { ...SAMPLE_ORDER_VARS },
  },
  {
    key: "order_processing",
    label: "Order Processing",
    description: "Sent when an order moves into processing.",
    group: "order",
    sampleVariables: { ...SAMPLE_ORDER_VARS },
  },
  {
    key: "order_packed",
    label: "Order Packed",
    description: "Sent when an order has been packed and is ready to ship.",
    group: "order",
    sampleVariables: { ...SAMPLE_ORDER_VARS },
  },
  {
    key: "order_shipped",
    label: "Order Shipped",
    description: "Sent when an order ships.",
    group: "order",
    sampleVariables: { ...SAMPLE_ORDER_VARS },
  },
  {
    key: "order_out_for_delivery",
    label: "Out for Delivery",
    description: "Sent when an order is out for delivery.",
    group: "order",
    sampleVariables: { ...SAMPLE_ORDER_VARS },
  },
  {
    key: "order_delivered",
    label: "Order Delivered",
    description: "Sent when an order has been delivered.",
    group: "order",
    sampleVariables: { ...SAMPLE_ORDER_VARS },
  },
  {
    key: "order_cancelled",
    label: "Order Cancelled",
    description: "Sent when an order is cancelled by an admin or customer.",
    group: "order",
    sampleVariables: { ...SAMPLE_ORDER_VARS },
  },
  {
    key: "order_refunded",
    label: "Refund Completed",
    description: "Sent when a refund has been completed for an order.",
    group: "order",
    sampleVariables: { ...SAMPLE_ORDER_VARS },
  },
  {
    key: "return_requested",
    label: "Return Requested",
    description: "Sent when a customer submits a return request.",
    group: "return",
    sampleVariables: { ...SAMPLE_ORDER_VARS },
  },
  {
    key: "return_approved",
    label: "Return Approved",
    description: "Sent when a return request is approved.",
    group: "return",
    sampleVariables: { ...SAMPLE_ORDER_VARS },
  },
  {
    key: "return_rejected",
    label: "Return Rejected",
    description: "Sent when a return request is rejected.",
    group: "return",
    sampleVariables: { ...SAMPLE_ORDER_VARS },
  },
  {
    key: "return_pickup",
    label: "Return Picked Up",
    description: "Sent when a returned item has been picked up from the customer.",
    group: "return",
    sampleVariables: { ...SAMPLE_ORDER_VARS },
  },
  {
    key: "return_received",
    label: "Return Received",
    description: "Sent when a returned item has been received at the warehouse.",
    group: "return",
    sampleVariables: { ...SAMPLE_ORDER_VARS },
  },
  {
    key: "refund_initiated",
    label: "Refund Initiated",
    description: "Sent when a refund has been initiated for a return.",
    group: "return",
    sampleVariables: { ...SAMPLE_ORDER_VARS },
  },
  {
    key: "tracking_updated",
    label: "Tracking Details Added/Updated",
    description: "Sent when shipment tracking information is added or changed.",
    group: "tracking",
    sampleVariables: {
      ...SAMPLE_ORDER_VARS,
      courier_name: "Bluedart",
      tracking_number: "BD1234567890",
      expected_delivery_date: "3 Sep 2026",
    },
  },
];

export function getEmailNotificationDef(key: string): EmailNotificationDef | undefined {
  return EMAIL_NOTIFICATION_CATALOG.find((d) => d.key === key);
}

/** Fixture order used for admin Preview / Send Test Email — never touches real customer or order data. */
export function buildSampleOrder(): EmailOrder {
  return {
    orderNumber: "MZ-20260830-0001",
    createdAt: new Date(),
    status: "SHIPPED",
    paymentMethod: "RAZORPAY",
    paymentStatus: "PAID",
    currency: "INR",
    subtotal: 4598,
    discountAmount: 300,
    shippingFee: 0,
    taxAmount: 210,
    total: 4298,
    couponCode: "WEB15",
    shippingAddress: {
      fullName: "Aisha Khan",
      line1: "12 Marine Drive",
      line2: "Apt 4B",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      postalCode: "400002",
      phone: "+91 98765 43210",
    },
    billingAddress: null,
    items: [
      { productName: "Embroidered Silk Saree", variantLabel: "Maroon / Free Size", quantity: 1, price: 3299, subtotal: 3299, imageUrl: null },
      { productName: "Pearl Drop Earrings", variantLabel: "Gold", quantity: 1, price: 1299, subtotal: 1299, imageUrl: null },
    ],
    shipment: {
      carrier: "Bluedart",
      courierName: "Bluedart",
      trackingNumber: "BD1234567890",
      awbCode: "BD1234567890",
      shippedAt: new Date(),
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      trackingStatus: "In Transit",
    },
  };
}
