import type { Role } from "@/generated/prisma/client";

// Pure data/constants only — no server-only imports (auth()/Prisma) — so this module can be
// safely imported from both server components (section layouts) and client components
// (AdminSidebar/AdminMobileNav, to filter nav items by role). getSectionAccess, which does need
// auth(), lives in src/lib/admin-auth.ts instead, alongside requireStaff/requireRole.

/** Full financial visibility: Suppliers/POs (financial side)/Expenses/Finance Dashboard/all
 * reports/Chart of Accounts/Analytics. Consolidates what used to be an implicit "any staff
 * role" gate on every one of those modules. */
export const FINANCE_ROLES: Role[] = ["SUPER_ADMIN", "BUSINESS_OWNER", "FINANCE"];

/** Stock/warehouse/receiving/returns-resolution — consolidates the `INVENTORY_ROLES` constant
 * that used to be copy-pasted in stock-actions.ts, warehouse-actions.ts, barcode-actions.ts,
 * returns/actions.ts, and purchase-orders/receive-actions.ts. */
export const OPERATIONS_ROLES: Role[] = ["SUPER_ADMIN", "INVENTORY_MANAGER"];

/** Site-wide configuration (tax/GST/shipping/brand) — previously open to any staff role via a
 * bare requireStaff(), which meant e.g. a Sales Staff account could change the GST rate. */
export const SETTINGS_ROLES: Role[] = ["SUPER_ADMIN"];

/** Customer Care staff — view/reply/work tickets, add internal notes, upload attachments,
 * update their own assigned tickets. Cannot assign/escalate-on-others'-behalf/close/manage
 * templates/view reports — see CUSTOMER_CARE_MANAGER_ROLES for that tier. */
export const CUSTOMER_CARE_ROLES: Role[] = ["SUPER_ADMIN", "CUSTOMER_SUPPORT_MANAGER", "CUSTOMER_SUPPORT"];

/** Customer Care managers — assignment/reassignment, closing tickets, reply-template
 * management, reports/CSV export, per-employee performance view. */
export const CUSTOMER_CARE_MANAGER_ROLES: Role[] = ["SUPER_ADMIN", "CUSTOMER_SUPPORT_MANAGER"];

/** Route-prefix -> roles allowed to view that admin section, used to gate both the section
 * layouts and the sidebar/mobile nav. A section with no entry here stays open to any staff
 * role, matching this app's pre-existing default (nothing was restricted before this module). */
export const ADMIN_NAV_ACCESS: Record<string, Role[]> = {
  "/admin/finance": FINANCE_ROLES,
  "/admin/expenses": FINANCE_ROLES,
  "/admin/analytics": FINANCE_ROLES,
  "/admin/settings": SETTINGS_ROLES,
  // Suppliers/Purchase Orders stay open to Operations too — receiving stock against a PO is an
  // operations task, not a purely financial one (the existing INVENTORY_MANAGER role already
  // does receiving elsewhere in Inventory).
  "/admin/suppliers": [...FINANCE_ROLES, "INVENTORY_MANAGER"],
  "/admin/purchase-orders": [...FINANCE_ROLES, "INVENTORY_MANAGER"],
  // Customer Care handles customer PII (contact details, order/payment context) end to end —
  // unlike most sections, this is NOT open to every staff role by default.
  "/admin/customer-care": CUSTOMER_CARE_ROLES,
};

/** Longest-prefix match against ADMIN_NAV_ACCESS — e.g. "/admin/finance/reports/profit-loss"
 * matches the "/admin/finance" entry. Returns null (no restriction) if nothing matches. */
export function allowedRolesForPath(pathname: string): Role[] | null {
  const match = Object.keys(ADMIN_NAV_ACCESS)
    .filter((prefix) => pathname.startsWith(prefix))
    .sort((a, b) => b.length - a.length)[0];
  return match ? ADMIN_NAV_ACCESS[match] : null;
}
