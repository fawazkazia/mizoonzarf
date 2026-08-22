import Link from "next/link";
import { getDashboardStats } from "@/lib/data/admin-dashboard";
import { getSettings } from "@/lib/settings";
import { StatCard } from "@/components/admin/StatCard";
import { RevenueTrendChart, OrdersByStatusChart } from "@/components/admin/DashboardCharts";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const [stats, settings] = await Promise.all([getDashboardStats(), getSettings()]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-3xl">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Revenue" value={`${settings.currencySymbol} ${stats.revenue.toFixed(0)}`} />
        <StatCard label="Orders" value={String(stats.orderCount)} />
        <StatCard label="Customers" value={String(stats.customerCount)} />
        <StatCard label="Products" value={String(stats.productCount)} />
        <StatCard label="Avg. Order Value" value={`${settings.currencySymbol} ${stats.avgOrderValue.toFixed(0)}`} />
        <StatCard label="Low Stock" value={String(stats.lowStockCount)} tone={stats.lowStockCount > 0 ? "warning" : "default"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="border border-line bg-paper p-5">
          <h2 className="mb-4 font-display text-lg">Revenue — Last 14 Days</h2>
          <RevenueTrendChart data={stats.revenueTrend} />
        </div>
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
          <Table>
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
              {stats.recentOrders.map((o) => (
                <tr key={o.id}>
                  <Td>
                    <Link href={`/admin/orders/${o.id}`} className="hover:underline">
                      {o.orderNumber}
                    </Link>
                  </Td>
                  <Td>{o.customer}</Td>
                  <Td>
                    <Badge tone={o.status === "DELIVERED" ? "success" : o.status === "CANCELLED" ? "sale" : "ink"}>
                      {o.status.replace(/_/g, " ")}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    {settings.currencySymbol} {o.total.toFixed(2)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg">Low Stock</h2>
            <Link href="/admin/products" className="text-xs uppercase tracking-wide underline">
              View Products
            </Link>
          </div>
          <Table>
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
