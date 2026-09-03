/** Fixed permission catalog for the Staff & Roles module. Roles pick from this list — Super
 * Admin can create unlimited custom *roles*, but permission *keys* themselves are a closed set
 * so every checkbox in the Roles & Permissions UI maps to a real, enforced backend check. */

export type PermissionCategory = {
  key: string;
  label: string;
  permissions: { key: string; label: string }[];
};

export const PERMISSION_CATALOG: PermissionCategory[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    permissions: [
      { key: "dashboard.view", label: "View dashboard" },
      { key: "dashboard.analytics", label: "View analytics" },
      { key: "dashboard.revenue", label: "View revenue" },
    ],
  },
  {
    key: "customers",
    label: "Customers",
    permissions: [
      { key: "customers.view", label: "View customers" },
      { key: "customers.viewProfile", label: "View customer profile" },
      { key: "customers.edit", label: "Edit customer" },
      { key: "customers.delete", label: "Delete customer" },
      { key: "customers.viewOrders", label: "View customer orders" },
      { key: "customers.viewContact", label: "View customer contact information" },
      { key: "customers.add", label: "Add customer" },
      { key: "customers.export", label: "Export customers" },
    ],
  },
  {
    key: "orders",
    label: "Orders",
    permissions: [
      { key: "orders.view", label: "View orders" },
      { key: "orders.viewDetails", label: "View order details" },
      { key: "orders.edit", label: "Edit orders" },
      { key: "orders.changeStatus", label: "Change order status" },
      { key: "orders.cancel", label: "Cancel order" },
      { key: "orders.refund", label: "Process refund" },
      { key: "orders.viewPayment", label: "View payment information" },
      { key: "orders.viewShipping", label: "View shipping information" },
    ],
  },
  {
    key: "products",
    label: "Products",
    permissions: [
      { key: "products.view", label: "View products" },
      { key: "products.add", label: "Add product" },
      { key: "products.edit", label: "Edit product" },
      { key: "products.delete", label: "Delete product" },
      { key: "products.managePricing", label: "Manage pricing" },
      { key: "products.manageInventory", label: "Manage inventory" },
      { key: "products.manageCategories", label: "Manage categories" },
    ],
  },
  {
    key: "inventory",
    label: "Inventory",
    permissions: [
      { key: "inventory.view", label: "View inventory" },
      { key: "inventory.edit", label: "Edit inventory" },
      { key: "inventory.stockAdjustment", label: "Stock adjustment" },
      { key: "inventory.viewHistory", label: "View stock history" },
    ],
  },
  {
    key: "support",
    label: "Customer Support",
    permissions: [
      { key: "support.viewTickets", label: "View tickets" },
      { key: "support.createTickets", label: "Create tickets" },
      { key: "support.reply", label: "Reply to customers" },
      { key: "support.assign", label: "Assign tickets" },
      { key: "support.close", label: "Close tickets" },
      { key: "support.viewHistory", label: "View customer history" },
    ],
  },
  {
    key: "accounting",
    label: "Accounting",
    permissions: [
      { key: "accounting.view", label: "View accounting" },
      { key: "accounting.viewTransactions", label: "View transactions" },
      { key: "accounting.createTransactions", label: "Create transactions" },
      { key: "accounting.editTransactions", label: "Edit transactions" },
      { key: "accounting.refundManagement", label: "Refund management" },
      { key: "accounting.financialReports", label: "Financial reports" },
    ],
  },
  {
    key: "marketing",
    label: "Marketing",
    permissions: [
      { key: "marketing.viewCampaigns", label: "View campaigns" },
      { key: "marketing.createCampaigns", label: "Create campaigns" },
      { key: "marketing.editCampaigns", label: "Edit campaigns" },
      { key: "marketing.manageCoupons", label: "Manage coupons" },
      { key: "marketing.manageBanners", label: "Manage banners" },
    ],
  },
  {
    key: "staff",
    label: "Staff",
    permissions: [
      { key: "staff.view", label: "View staff" },
      { key: "staff.add", label: "Add staff" },
      { key: "staff.edit", label: "Edit staff" },
      { key: "staff.disable", label: "Disable staff" },
      { key: "staff.manageRoles", label: "Manage roles" },
      { key: "staff.managePermissions", label: "Manage permissions" },
      { key: "staff.viewActivity", label: "View staff activity" },
    ],
  },
  {
    key: "settings",
    label: "Settings",
    permissions: [
      { key: "settings.view", label: "View settings" },
      { key: "settings.edit", label: "Edit settings" },
      { key: "settings.manageWebsite", label: "Manage website settings" },
    ],
  },
];

export const ALL_PERMISSION_KEYS: string[] = PERMISSION_CATALOG.flatMap((c) => c.permissions.map((p) => p.key));

const PERMISSION_LABELS: Record<string, string> = Object.fromEntries(
  PERMISSION_CATALOG.flatMap((c) => c.permissions.map((p) => [p.key, p.label]))
);

export function permissionLabel(key: string): string {
  return PERMISSION_LABELS[key] ?? key;
}

export function isValidPermissionKey(key: string): boolean {
  return key in PERMISSION_LABELS;
}
