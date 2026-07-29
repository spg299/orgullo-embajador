"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Item {
  label: string;
  count: number;
  color?: string;
}

export function TopBarChart({
  data,
  emptyMessage,
  defaultColor = "#0f3fb0",
}: {
  data: Item[];
  emptyMessage: string;
  defaultColor?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm font-medium text-admin-text-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 42)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <XAxis type="number" allowDecimals={false} hide />
        <YAxis
          type="category"
          dataKey="label"
          width={140}
          tick={{ fill: "var(--admin-text-muted)", fontSize: 12 }}
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
          cursor={{ fill: "var(--admin-border)" }}
        />
        <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={18}>
          {data.map((item, i) => (
            <Cell key={i} fill={item.color ?? defaultColor} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
