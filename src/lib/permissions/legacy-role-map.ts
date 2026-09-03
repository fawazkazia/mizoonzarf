import type { Role } from "@/generated/prisma/client";
import { ALL_PERMISSION_KEYS } from "./catalog";

/** Default granular permission set per legacy `Role` enum value — used as a fallback when a
 * user has no `staffRoleId` assigned yet, and to seed each enum value's mirrored `StaffRole`
 * row (see prisma/seed.ts). Super Admin always gets every permission; everyone else gets a
 * reasonable scoped default that Super Admin can refine later in Roles & Permissions. */
export const LEGACY_ROLE_PERMISSIONS: Record<Role, string[]> = {
  CUSTOMER: [],
  SUPER_ADMIN: ALL_PERMISSION_KEYS,
  BUSINESS_OWNER: ALL_PERMISSION_KEYS.filter((k) => !k.startsWith("staff.") || k === "staff.view"),
  FINANCE: [
    "dashboard.view",
    "dashboard.analytics",
    "dashboard.revenue",
    "customers.view",
    "orders.view",
    "orders.viewDetails",
    "orders.viewPayment",
    "accounting.view",
    "accounting.viewTransactions",
    "accounting.createTransactions",
    "accounting.editTransactions",
    "accounting.refundManagement",
    "accounting.financialReports",
  ],
  PRODUCT_MANAGER: [
    "dashboard.view",
    "products.view",
    "products.add",
    "products.edit",
    "products.delete",
    "products.managePricing",
    "products.manageInventory",
    "products.manageCategories",
    "inventory.view",
  ],
  ORDER_MANAGER: [
    "dashboard.view",
    "orders.view",
    "orders.viewDetails",
    "orders.edit",
    "orders.changeStatus",
    "orders.cancel",
    "orders.refund",
    "orders.viewPayment",
    "orders.viewShipping",
    "customers.view",
    "customers.viewOrders",
    "inventory.view",
  ],
  MARKETING_MANAGER: [
    "dashboard.view",
    "marketing.viewCampaigns",
    "marketing.createCampaigns",
    "marketing.editCampaigns",
    "marketing.manageCoupons",
    "marketing.manageBanners",
    "products.view",
    "customers.view",
    "customers.export",
  ],
  CUSTOMER_SUPPORT: [
    "dashboard.view",
    "support.viewTickets",
    "support.createTickets",
    "support.reply",
    "support.viewHistory",
    "customers.view",
    "customers.viewProfile",
    "customers.viewOrders",
    "customers.viewContact",
    // Adding a customer note and tagging a customer are both documented as base Customer Care
    // Employee capabilities (see addCustomerNote/updateCustomerTags in customers/actions.ts) —
    // kept here so the Phase 2 requirePermission() retrofit doesn't take that away.
    "customers.edit",
    "orders.view",
    "orders.viewDetails",
  ],
  CUSTOMER_SUPPORT_MANAGER: [
    "dashboard.view",
    "support.viewTickets",
    "support.createTickets",
    "support.reply",
    "support.assign",
    "support.close",
    "support.viewHistory",
    "customers.view",
    "customers.viewProfile",
    "customers.edit",
    "customers.viewOrders",
    "customers.viewContact",
    "orders.view",
    "orders.viewDetails",
    // Resolving a support ticket routinely means changing an order's status or refunding it
    // (this app's own Customer Care > Refunds tab already assumes this role can) — kept here so
    // the Phase 1 requirePermission() retrofit in orders/actions.ts doesn't take away anything
    // this role could already do via the old blanket requireStaff() check.
    "orders.changeStatus",
    "orders.cancel",
    "orders.refund",
  ],
  INVENTORY_MANAGER: [
    "dashboard.view",
    "inventory.view",
    "inventory.edit",
    "inventory.stockAdjustment",
    "inventory.viewHistory",
    "products.view",
    "products.manageInventory",
    "orders.viewShipping",
  ],
};

/** Legacy `role` enum value given to a staff account assigned a brand-new *custom* StaffRole
 * (one with no corresponding legacy enum value). Not in FINANCE_ROLES, CUSTOMER_CARE_ROLES,
 * SETTINGS_ROLES, or the suppliers/PO operations list (src/lib/admin-permissions.ts), so it
 * grants exactly the same baseline as any other staff account: every admin section with no
 * dedicated ADMIN_NAV_ACCESS entry, and nothing more. Real access for a custom role comes from
 * its granular permissions once a module is migrated to requirePermission() (Customers/Orders in
 * Phase 1; the rest in Phase 2) — this is only a bridge shell for the sections that aren't yet. */
export const NEUTRAL_LEGACY_ROLE_SHELL: Role = "PRODUCT_MANAGER";

/** Human label per legacy role, for seeding StaffRole.description and any UI that still needs it. */
export const LEGACY_ROLE_LABELS: Record<Role, string> = {
  CUSTOMER: "Customer",
  SUPER_ADMIN: "Super Admin",
  BUSINESS_OWNER: "Business Owner",
  FINANCE: "Finance",
  PRODUCT_MANAGER: "Product Manager",
  ORDER_MANAGER: "Order Manager",
  MARKETING_MANAGER: "Marketing Manager",
  CUSTOMER_SUPPORT: "Customer Support",
  CUSTOMER_SUPPORT_MANAGER: "Customer Support Manager",
  INVENTORY_MANAGER: "Inventory Manager",
};
