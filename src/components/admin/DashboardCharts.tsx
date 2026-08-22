"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";

const STATUS_COLORS: Record<string, string> = {
  "ORDER PLACED": "#a9803f",
  "PAYMENT CONFIRMED": "#3f6b4c",
  PROCESSING: "#5b7592",
  PACKED: "#5b7592",
  SHIPPED: "#3f6b4c",
  "OUT FOR DELIVERY": "#3f6b4c",
  DELIVERED: "#14130f",
  CANCELLED: "#a3372f",
};

export function RevenueTrendChart({ data }: { data: { date: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4ddce" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#3a3833" }} axisLine={{ stroke: "#e4ddce" }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#3a3833" }} axisLine={false} tickLine={false} width={50} />
        <Tooltip
          contentStyle={{ borderRadius: 0, border: "1px solid #e4ddce", fontSize: 12 }}
          formatter={(value) => [`AED ${Number(value).toFixed(2)}`, "Revenue"]}
        />
        <Line type="monotone" dataKey="total" stroke="#a9803f" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function OrdersByStatusChart({ data }: { data: { status: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4ddce" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: "#3a3833" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis dataKey="status" type="category" width={110} tick={{ fontSize: 11, fill: "#3a3833" }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 0, border: "1px solid #e4ddce", fontSize: 12 }} />
        <Bar dataKey="count" radius={[0, 2, 2, 0]}>
          {data.map((entry) => (
            <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#a9803f"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
