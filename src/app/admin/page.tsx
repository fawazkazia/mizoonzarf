import Link from "next/link";
import { auth } from "@/lib/auth";
import { getDashboardStats } from "@/lib/data/admin-dashboard";
import { formatINR } from "@/lib/currency";
import { StatCard } from "@/components/admin/StatCard";
import { RevenueTrendChart, OrdersByStatusChart } from "@/components/admin/DashboardCharts";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";
import { Badge } from "@/components/ui/Badge";
import { getOrderStatusDisplay } from "@/lib/orders/status";
import { FINANCE_ROLES } from "@/lib/admin-permissions";
import { cn } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const [stats, session] = await Promise.all([getDashboardStats(), auth()]);
  // Never expose revenue to a role outside Finance — see the spec's "never expose financial
  // information to unauthorized staff." Everything else on this dashboard (orders, stock,
  // abandoned carts) is legitimately useful to every staff role, so only these two tiles and
  // the revenue trend chart below are conditional.
  const canSeeRevenue = FINANCE_ROLES.includes(session!.user.role as never);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-3xl">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {canSeeRevenue && <StatCard label="Revenue" value={formatINR(stats.revenue)} href="/admin/analytics" />}
        <StatCard label="Orders" value={String(stats.orderCount)} href="/admin/orders" />
        <StatCard label="Customers" value={String(stats.customerCount)} href="/admin/customers" />
        <StatCard label="Products" value={String(stats.productCount)} href="/admin/products" />
        {canSeeRevenue && <StatCard label="Avg. Order Value" value={formatINR(stats.avgOrderValue)} href="/admin/analytics" />}
        <StatCard
          label="Low Stock"
          value={String(stats.lowStockCount)}
          tone={stats.lowStockCount > 0 ? "warning" : "default"}
          href="/admin/products?stock=low"
        />
        <StatCard
          label="Abandoned Carts"
          value={String(stats.abandonedCartCount)}
          tone={stats.abandonedCartCount > 0 ? "warning" : "default"}
          href="/admin/abandoned-carts"
        />
        <StatCard
          label="Pending Returns"
          value={String(stats.pendingReturnsCount)}
          tone={stats.pendingReturnsCount > 0 ? "warning" : "default"}
          href="/admin/returns"
        />
      </div>

      <div className={cn("grid gap-6", canSeeRevenue && "lg:grid-cols-2")}>
        {canSeeRevenue && (
          <div className="border border-line bg-paper p-5">
            <h2 className="mb-4 font-display text-lg">Revenue — Last 14 Days</h2>
            <RevenueTrendChart data={stats.revenueTrend} />
          </div>
        )}
        <div className="border border-line bg-paper p-5">
          <h2 className="mb-4 font-display text-lg">Orders by Status</h2>
          <OrdersByStatusChart data={stats.ordersByStatus} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs uppercase tracking-wide underline">
              View All
            </Link>
          </div>
          <Table compact>
            <thead>
              <tr>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Status</Th>
                <Th className="text-right">Total</Th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.length === 0 && <EmptyRow colSpan={4}>No orders yet.</EmptyRow>}
              {stats.recentOrders.map((o) => {
                const statusDisplay = getOrderStatusDisplay(o.status, o.paymentStatus, o.paymentMethod);
                return (
                  <tr key={o.id}>
                    <Td>
                      <Link href={`/admin/orders/${o.id}`} className="hover:underline">
                        {o.orderNumber}
                      </Link>
                    </Td>
                    <Td>{o.customer}</Td>
                    <Td>
                      <Badge tone={statusDisplay.tone}>{statusDisplay.label}</Badge>
                    </Td>
                    <Td className="text-right">{formatINR(o.total)}</Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg">Low Stock</h2>
            <Link href="/admin/products?stock=low" className="text-xs uppercase tracking-wide underline">
              View Products
            </Link>
          </div>
          <Table compact>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th>Variant</Th>
                <Th className="text-right">Stock</Th>
              </tr>
            </thead>
            <tbody>
              {stats.lowStockVariants.length === 0 && <EmptyRow colSpan={3}>Nothing running low.</EmptyRow>}
              {stats.lowStockVariants.map((v) => (
                <tr key={v.id}>
                  <Td>
                    <Link href={`/admin/products?q=${encodeURIComponent(v.productName)}`} className="hover:underline">
                      {v.productName}
                    </Link>
                  </Td>
                  <Td>{v.label || "—"}</Td>
                  <Td className="text-right text-sale">{v.stock}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>
    </div>
  );
}
