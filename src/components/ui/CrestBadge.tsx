const palettes: Record<string, { from: string; to: string; text: string }> = {
  M: { from: "#1a56d6", to: "#0a2f8c", text: "#ffffff" },
  B: { from: "#e0b84a", to: "#a9791a", text: "#0a0f24" },
  N: { from: "#0e8f3e", to: "#095c28", text: "#ffffff" },
  J: { from: "#c8102e", to: "#8c0b20", text: "#ffffff" },
  T: { from: "#7a1f2b", to: "#4a1119", text: "#ffffff" },
  BC: { from: "#f59e0b", to: "#78350f", text: "#ffffff" },
  DC: { from: "#16a34a", to: "#14532d", text: "#ffffff" },
  F: { from: "#38bdf8", to: "#0369a1", text: "#ffffff" },
  BF: { from: "#7c3aed", to: "#4c1d95", text: "#ffffff" },
  OC: { from: "#0d9488", to: "#115e59", text: "#ffffff" },
  UM: { from: "#f97316", to: "#9a3412", text: "#ffffff" },
  AD: { from: "#ca8a04", to: "#1c1917", text: "#ffffff" },
  AM: { from: "#dc2626", to: "#7f1d1d", text: "#ffffff" },
  DP: { from: "#9f1239", to: "#4c0519", text: "#ffffff" },
  IB: { from: "#6366f1", to: "#312e81", text: "#ffffff" },
  JG: { from: "#65a30d", to: "#1a2e05", text: "#ffffff" },
};

export default function CrestBadge({
  initial,
  size = "md",
}: {
  initial: string;
  size?: "sm" | "md" | "lg";
}) {
  const palette = palettes[initial] ?? palettes.M;
  const sizeClasses = {
    sm: "h-10 w-10 text-sm",
    md: "h-14 w-14 text-lg",
    lg: "h-20 w-20 text-2xl",
  }[size];

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-2xl font-display font-bold shadow-card ${sizeClasses}`}
      style={{
        background: `linear-gradient(145deg, ${palette.from}, ${palette.to})`,
        color: palette.text,
      }}
    >
      <span className="relative">{initial}</span>
      <span className="pointer-events-none absolute inset-0 rounded-2xl border border-white/20" />
    </div>
  );
}
