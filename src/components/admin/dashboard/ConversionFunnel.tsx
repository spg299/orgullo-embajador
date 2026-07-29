interface FunnelStage {
  label: string;
  value: number;
  color: string;
}

function formatRate(numerator: number, denominator: number): string {
  if (denominator === 0) return "—";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

export function ConversionFunnel({
  visitors,
  solicitudes,
  confirmadas,
}: {
  visitors: number;
  solicitudes: number;
  confirmadas: number;
}) {
  const stages: FunnelStage[] = [
    { label: "Visitantes", value: visitors, color: "#0f3fb0" },
    { label: "Solicitudes", value: solicitudes, color: "#cc9a2e" },
    { label: "Compras confirmadas", value: confirmadas, color: "#10b981" },
  ];
  const max = Math.max(visitors, 1);
  const overallConversion = formatRate(confirmadas, visitors);

  return (
    <div className="flex flex-col gap-3">
      {stages.map((stage, i) => (
        <div key={stage.label}>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-admin-text">{stage.label}</span>
            <span className="font-display font-bold text-admin-text">{stage.value.toLocaleString("es-CO")}</span>
          </div>
          <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-admin-border">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max((stage.value / max) * 100, stage.value > 0 ? 3 : 0)}%`,
                backgroundColor: stage.color,
              }}
            />
          </div>
          {i < stages.length - 1 && (
            <p className="mt-1.5 text-xs font-medium text-admin-text-muted">
              {formatRate(stages[i + 1].value, stage.value)} pasa a &ldquo;{stages[i + 1].label}&rdquo;
            </p>
          )}
        </div>
      ))}

      <div className="mt-2 flex items-center justify-between rounded-admin-md bg-admin-bg px-4 py-3">
        <span className="text-sm font-semibold text-admin-text">Conversión general</span>
        <span className="font-display text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
          {overallConversion}
        </span>
      </div>
    </div>
  );
}
