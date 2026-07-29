"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCOP } from "@/lib/format";

interface MonthPoint {
  month: string;
  ingresos: number;
  gastos: number;
}

export function FinanceLineChart({ data }: { data: MonthPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center text-sm font-medium text-admin-text-muted">
        Aún no hay movimientos registrados.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid stroke="var(--admin-border)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: "var(--admin-text-muted)", fontSize: 11 }}
          axisLine={{ stroke: "var(--admin-border)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "var(--admin-text-muted)", fontSize: 11 }}
          tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${v / 1000}k`)}
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
          formatter={(value) => formatCOP(Number(value))}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "var(--admin-text-muted)" }} />
        <Line type="monotone" dataKey="ingresos" name="Ingresos" stroke="#10b981" strokeWidth={2.5} dot={false} />
        <Line type="monotone" dataKey="gastos" name="Gastos" stroke="#ef4444" strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
