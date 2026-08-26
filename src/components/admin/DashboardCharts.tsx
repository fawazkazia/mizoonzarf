"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { formatINR } from "@/lib/currency";
import { useAdminTheme } from "./AdminThemeProvider";

const PALETTE = {
  light: {
    grid: "#e4ddce",
    tick: "#3a3833",
    tooltipBg: "#ffffff",
    tooltipBorder: "#e4ddce",
    tooltipText: "#14130f",
    gold: "#a9803f",
    success: "#3f6b4c",
    statusColors: {
      "ORDER PLACED": "#a9803f",
      "PAYMENT CONFIRMED": "#3f6b4c",
      PROCESSING: "#5b7592",
      PACKED: "#5b7592",
      SHIPPED: "#3f6b4c",
      "OUT FOR DELIVERY": "#3f6b4c",
      DELIVERED: "#14130f",
      CANCELLED: "#a3372f",
    } as Record<string, string>,
  },
  dark: {
    grid: "#3a362c",
    tick: "#b3ac9c",
    tooltipBg: "#2a271d",
    tooltipBorder: "#4d473a",
    tooltipText: "#efe9dc",
    gold: "#c39a55",
    success: "#5fa373",
    statusColors: {
      "ORDER PLACED": "#c39a55",
      "PAYMENT CONFIRMED": "#5fa373",
      PROCESSING: "#8aa6c2",
      PACKED: "#8aa6c2",
      SHIPPED: "#5fa373",
      "OUT FOR DELIVERY": "#5fa373",
      DELIVERED: "#efe9dc",
      CANCELLED: "#e0564b",
    } as Record<string, string>,
  },
};

function useChartPalette() {
  const { theme } = useAdminTheme();
  return PALETTE[theme];
}

function tooltipStyle(p: (typeof PALETTE)["light"]) {
  return { borderRadius: 0, border: `1px solid ${p.tooltipBorder}`, background: p.tooltipBg, color: p.tooltipText, fontSize: 12 };
}

export function RevenueTrendChart({ data }: { data: { date: string; total: number }[] }) {
  const p = useChartPalette();
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={p.grid} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: p.tick }} axisLine={{ stroke: p.grid }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: p.tick }} axisLine={false} tickLine={false} width={50} />
        <Tooltip contentStyle={tooltipStyle(p)} formatter={(value) => [formatINR(Number(value)), "Revenue"]} />
        <Line type="monotone" dataKey="total" stroke={p.gold} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function OrdersByStatusChart({ data }: { data: { status: string; count: number }[] }) {
  const p = useChartPalette();
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={p.grid} horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: p.tick }} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis dataKey="status" type="category" width={110} tick={{ fontSize: 11, fill: p.tick }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle(p)} />
        <Bar dataKey="count" radius={[0, 2, 2, 0]}>
          {data.map((entry) => (
            <Cell key={entry.status} fill={p.statusColors[entry.status] ?? p.gold} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TopProductsChart({ data }: { data: { name: string; revenue: number }[] }) {
  const p = useChartPalette();
  if (data.length === 0) {
    return <p className="flex h-[260px] items-center justify-center text-sm text-ink-soft">No sales in this period.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 34)}>
      <BarChart data={data} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={p.grid} horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: p.tick }} axisLine={false} tickLine={false} />
        <YAxis
          dataKey="name"
          type="category"
          width={140}
          tick={{ fontSize: 11, fill: p.tick }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value: string) => (value.length > 18 ? `${value.slice(0, 18)}…` : value)}
        />
        <Tooltip contentStyle={tooltipStyle(p)} formatter={(value) => [formatINR(Number(value)), "Revenue"]} />
        <Bar dataKey="revenue" fill={p.gold} radius={[0, 2, 2, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TopCategoriesChart({ data }: { data: { name: string; revenue: number }[] }) {
  const p = useChartPalette();
  if (data.length === 0) {
    return <p className="flex h-[260px] items-center justify-center text-sm text-ink-soft">No sales in this period.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 34)}>
      <BarChart data={data} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={p.grid} horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: p.tick }} axisLine={false} tickLine={false} />
        <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11, fill: p.tick }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle(p)} formatter={(value) => [formatINR(Number(value)), "Revenue"]} />
        <Bar dataKey="revenue" fill={p.success} radius={[0, 2, 2, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CustomerGrowthChart({ data }: { data: { date: string; count: number }[] }) {
  const p = useChartPalette();
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={p.grid} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: p.tick }} axisLine={{ stroke: p.grid }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: p.tick }} axisLine={false} tickLine={false} width={40} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle(p)} formatter={(value) => [String(value), "New Customers"]} />
        <Line type="monotone" dataKey="count" stroke={p.success} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
