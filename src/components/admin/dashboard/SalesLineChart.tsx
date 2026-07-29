"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

export function SalesLineChart({ data }: { data: { date: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid stroke="var(--admin-border)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: "var(--admin-text-muted)", fontSize: 11 }}
          tickFormatter={(v) => v.slice(5)}
          axisLine={{ stroke: "var(--admin-border)" }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: "var(--admin-text-muted)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "var(--admin-surface)",
            border: "1px solid var(--admin-border)",
            borderRadius: 12,
            color: "var(--admin-text)",
            fontSize: 13,
          }}
          labelFormatter={(v) => `Fecha: ${v}`}
          formatter={(value) => [Number(value), "Ventas"]}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke="#0f3fb0"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
