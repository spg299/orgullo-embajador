"use client";

interface MonthPoint {
  month: string;
  ingresos: number;
  gastos: number;
}

// Compact inline trend line, not a standalone chart panel — supporting
// context next to the stat strip, not a visual centerpiece.
export function FlowSparkline({ data }: { data: MonthPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-admin-lg border border-admin-border bg-admin-surface p-4 text-xs font-medium text-admin-text-muted shadow-admin-xs">
        Aún no hay movimientos para mostrar una tendencia.
      </div>
    );
  }

  const allValues = data.flatMap((d) => [d.ingresos, d.gastos]);
  const max = Math.max(...allValues, 1);
  const toX = (i: number) => (data.length > 1 ? (i / (data.length - 1)) * 300 : 150);
  const toY = (v: number) => 36 - (v / max) * 32;

  const ingresosPoints = data.map((d, i) => `${toX(i)},${toY(d.ingresos)}`).join(" ");
  const gastosPoints = data.map((d, i) => `${toX(i)},${toY(d.gastos)}`).join(" ");
  const lastIngreso = data[data.length - 1].ingresos;
  const lastGasto = data[data.length - 1].gastos;

  return (
    <div className="flex flex-col gap-3 rounded-admin-lg border border-admin-border bg-admin-surface p-3.5 shadow-admin-xs sm:flex-row sm:items-center sm:gap-5 sm:p-4">
      <div className="shrink-0">
        <p className="text-[11px] text-admin-text-muted">Flujo neto</p>
        <p className="text-[13px] font-bold text-admin-text">
          {data.length} {data.length === 1 ? "mes" : "meses"}
        </p>
      </div>
      <svg viewBox="0 0 300 40" preserveAspectRatio="none" className="h-10 w-full flex-1">
        <polyline
          points={ingresosPoints}
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={toX(data.length - 1)} cy={toY(lastIngreso)} r="3" fill="#10b981" />
        <polyline
          points={gastosPoints}
          fill="none"
          stroke="#f43f5e"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={toX(data.length - 1)} cy={toY(lastGasto)} r="3" fill="#f43f5e" />
      </svg>
      <div className="flex shrink-0 items-center gap-3.5 text-[11px] text-admin-text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Ingresos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          Gastos
        </span>
      </div>
    </div>
  );
}
