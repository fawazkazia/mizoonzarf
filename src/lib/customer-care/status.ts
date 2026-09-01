import type { TicketCategory, TicketPriority, TicketStatus } from "@/generated/prisma/client";

type BadgeTone = "ink" | "sale" | "success" | "gold" | "outline" | "warning";

export const ALL_TICKET_CATEGORIES: TicketCategory[] = [
  "ORDER_ISSUE",
  "ORDER_CANCELLATION",
  "RETURN_REQUEST",
  "REFUND_ISSUE",
  "EXCHANGE_REQUEST",
  "DAMAGED_PRODUCT",
  "WRONG_PRODUCT_RECEIVED",
  "MISSING_PRODUCT",
  "DELIVERY_ISSUE",
  "DELAYED_DELIVERY",
  "PAYMENT_ISSUE",
  "COD_ISSUE",
  "PRODUCT_ENQUIRY",
  "PRODUCT_AVAILABILITY",
  "SIZE_COLOUR_ENQUIRY",
  "ACCOUNT_LOGIN_ISSUE",
  "PASSWORD_RESET",
  "WEBSITE_ISSUE",
  "COMPLAINT",
  "GENERAL_ENQUIRY",
  "OTHER",
];

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  NEW: "New",
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  WAITING_FOR_CUSTOMER: "Waiting for Customer",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  ESCALATED: "Escalated",
};

export const TICKET_STATUS_TONE: Record<TicketStatus, BadgeTone> = {
  NEW: "outline",
  OPEN: "ink",
  IN_PROGRESS: "gold",
  WAITING_FOR_CUSTOMER: "warning",
  RESOLVED: "success",
  CLOSED: "outline",
  ESCALATED: "sale",
};

export const TICKET_PRIORITY_LABEL: Record<TicketPriority, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
};

export const TICKET_PRIORITY_TONE: Record<TicketPriority, BadgeTone> = {
  LOW: "outline",
  NORMAL: "ink",
  HIGH: "gold",
  URGENT: "sale",
};

/** New -> Open -> In Progress -> Waiting for Customer -> Resolved -> Closed, with Escalated
 * reachable from any non-terminal state and re-enterable back into the normal flow. */
export const TICKET_STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  NEW: ["OPEN", "IN_PROGRESS", "ESCALATED"],
  OPEN: ["IN_PROGRESS", "WAITING_FOR_CUSTOMER", "RESOLVED", "ESCALATED"],
  IN_PROGRESS: ["WAITING_FOR_CUSTOMER", "RESOLVED", "ESCALATED"],
  WAITING_FOR_CUSTOMER: ["IN_PROGRESS", "RESOLVED", "ESCALATED"],
  RESOLVED: ["CLOSED", "IN_PROGRESS"],
  CLOSED: [],
  ESCALATED: ["IN_PROGRESS", "RESOLVED"],
};

export const ALL_TICKET_STATUSES: TicketStatus[] = ["NEW", "OPEN", "IN_PROGRESS", "WAITING_FOR_CUSTOMER", "RESOLVED", "CLOSED", "ESCALATED"];
export const ALL_TICKET_PRIORITIES: TicketPriority[] = ["LOW", "NORMAL", "HIGH", "URGENT"];
