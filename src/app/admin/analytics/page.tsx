import Link from "next/link";
import { getAnalytics } from "@/lib/data/admin-analytics";
import { resolvePresetRange, DATE_PRESETS, type DatePreset } from "@/lib/data/date-presets";
import { formatINR } from "@/lib/currency";
import { StatCard } from "@/components/admin/StatCard";
import {
  RevenueTrendChart,
  OrdersByStatusChart,
  TopProductsChart,
  TopCategoriesChart,
  CustomerGrowthChart,
} from "@/components/admin/DashboardCharts";
import { AnalyticsDateFilter } from "./AnalyticsDateFilter";

export const metadata = { title: "Sales Analytics" };

interface PageProps {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>;
}

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default async function AdminAnalyticsPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  const isValidPreset = (v?: string): v is DatePreset => !!v && (DATE_PRESETS as readonly string[]).includes(v);
  const preset: DatePreset | null = !sp.from && !sp.to ? (isValidPreset(sp.preset) ? sp.preset : "30d") : null;

  const range = preset
    ? resolvePresetRange(preset)
    : {
        from: sp.from ? new Date(sp.from) : resolvePresetRange("30d").from,
        to: sp.to ? new Date(new Date(sp.to).setHours(23, 59, 59, 999)) : new Date(),
      };

  const stats = await getAnalytics(range);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl">Sales Analytics</h1>
        <Link href="/admin/orders" className="text-xs uppercase tracking-wide underline">
          View All Orders
        </Link>
      </div>

      <AnalyticsDateFilter activePreset={preset} from={toDateInputValue(range.from)} to={toDateInputValue(range.to)} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Revenue" value={formatINR(stats.revenue)} />
        <StatCard label="Orders" value={String(stats.orderCount)} />
        <StatCard label="Avg. Order Value" value={formatINR(stats.avgOrderValue)} />
        <StatCard
          label="Cart → Order Conversion"
          value={`${(stats.conversionRate * 100).toFixed(1)}%`}
          hint={`${stats.abandonedCartCount} abandoned`}
          href="/admin/abandoned-carts"
        />
        <StatCard label="New Customers" value={String(stats.customerGrowth.reduce((s, b) => s + b.count, 0))} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="border border-line bg-paper p-5">
          <h2 className="mb-4 font-display text-lg">Revenue Trend</h2>
          <RevenueTrendChart data={stats.revenueTrend} />
        </div>
        <div className="border border-line bg-paper p-5">
          <h2 className="mb-4 font-display text-lg">Orders by Status</h2>
          <OrdersByStatusChart data={stats.ordersByStatus} />
        </div>
        <div className="border border-line bg-paper p-5">
          <h2 className="mb-4 font-display text-lg">Top Products</h2>
          <TopProductsChart data={stats.topProducts} />
        </div>
        <div className="border border-line bg-paper p-5">
          <h2 className="mb-4 font-display text-lg">Top Categories</h2>
          <TopCategoriesChart data={stats.topCategories} />
        </div>
        <div className="border border-line bg-paper p-5 lg:col-span-2">
          <h2 className="mb-4 font-display text-lg">Customer Growth</h2>
          <CustomerGrowthChart data={stats.customerGrowth} />
        </div>
      </div>
    </div>
  );
}
