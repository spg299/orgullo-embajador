"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCOP } from "@/lib/format";

interface Item {
  label: string;
  ingresos: number;
  gastos: number;
}

export function IncomeVsExpenseChart({ data }: { data: Item[] }) {
  const hasData = data.some((d) => d.ingresos > 0 || d.gastos > 0);

  if (!hasData) {
    return (
      <div className="flex h-[240px] items-center justify-center text-sm font-medium text-admin-text-muted">
        Aún no hay movimientos registrados.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid stroke="var(--admin-border)" vertical={false} />
        <XAxis
          dataKey="label"
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
        <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[6, 6, 0, 0]} />
        <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
