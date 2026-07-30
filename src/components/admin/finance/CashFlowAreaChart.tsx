"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCOP } from "@/lib/format";

interface Point {
  label: string;
  balance: number;
}

// Net monthly flow (ingresos - gastos for that month) — the filled area
// reads at a glance which months ran a surplus vs. a deficit.
export function CashFlowAreaChart({ data }: { data: Point[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center text-sm font-medium text-admin-text-muted">
        Aún no hay movimientos registrados.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="cashFlowFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f3fb0" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#0f3fb0" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--admin-border)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "var(--admin-text-muted)", fontSize: 11 }}
          axisLine={{ stroke: "var(--admin-border)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "var(--admin-text-muted)", fontSize: 11 }}
          tickFormatter={(v) => (Math.abs(v) >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${v / 1000}k`)}
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
        <Area type="monotone" dataKey="balance" name="Flujo neto" stroke="#0f3fb0" strokeWidth={2.5} fill="url(#cashFlowFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
