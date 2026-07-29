"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCOP } from "@/lib/format";

interface Slice {
  label: string;
  value: number;
  color: string;
}

export function BudgetDonutChart({ data }: { data: Slice[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center text-sm font-medium text-admin-text-muted">
        Aún no hay presupuesto asignado.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="label" innerRadius={55} outerRadius={85} paddingAngle={2}>
          {data.map((slice) => (
            <Cell key={slice.label} fill={slice.color} />
          ))}
        </Pie>
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
        <Legend wrapperStyle={{ fontSize: 12, color: "var(--admin-text-muted)" }} iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  );
}
