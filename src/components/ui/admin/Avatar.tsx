const PALETTE = [
  "bg-royal-500",
  "bg-gold-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-royal-300",
];

function colorFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

// Initials-only — there's no avatar_url column on profiles, and adding
// photo upload would be new functionality outside this redesign's scope.
export function Avatar({
  name,
  size = "md",
}: {
  name: string | null | undefined;
  size?: "sm" | "md";
}) {
  const label = name?.trim() || "?";
  const initial = label.slice(0, 1).toUpperCase();
  const sizeClass = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-display font-bold text-white ${colorFor(label)} ${sizeClass}`}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
