"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { STATUS_CHART_COLORS, type SaleStatus } from "@/data/sales";

interface Slice {
  status: SaleStatus;
  label: string;
  count: number;
}

export function StatusDonutChart({ data }: { data: Slice[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center text-sm font-medium text-admin-text-muted">
        Aún no hay ventas registradas.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="label"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
        >
          {data.map((slice) => (
            <Cell key={slice.status} fill={STATUS_CHART_COLORS[slice.status]} />
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
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: "var(--admin-text-muted)" }}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
