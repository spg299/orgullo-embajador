interface Breakdown {
  today: number;
  d7: number;
  d15: number;
  d30: number;
  y1: number;
}

const WINDOWS: { key: keyof Breakdown; label: string }[] = [
  { key: "today", label: "Hoy" },
  { key: "d7", label: "7 días" },
  { key: "d15", label: "15 días" },
  { key: "d30", label: "30 días" },
  { key: "y1", label: "1 año" },
];

export function VisitorsBreakdown({ data }: { data: Breakdown }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {WINDOWS.map((w) => (
        <div key={w.key} className="rounded-admin-md bg-admin-bg px-3 py-3 text-center">
          <p className="font-display text-xl font-extrabold tracking-tight text-admin-text">
            {data[w.key].toLocaleString("es-CO")}
          </p>
          <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-admin-text-muted">
            {w.label}
          </p>
        </div>
      ))}
    </div>
  );
}
