"use client";

import { useEffect, useRef, useState } from "react";

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
  AF: { from: "#dc2626", to: "#1d4ed8", text: "#ffffff" },
};

// Responsive so a pair of crests always lands in the 40-48px (desktop) /
// 32-40px (mobile) range the design calls for, at every size tier.
const sizeClasses = {
  sm: "h-8 w-8 sm:h-10 sm:w-10 text-sm",
  md: "h-9 w-9 sm:h-12 sm:w-12 text-lg",
  lg: "h-20 w-20 text-2xl",
};

export default function CrestBadge({
  initial,
  size = "md",
  crestSrc,
  alt,
}: {
  initial: string;
  size?: "sm" | "md" | "lg";
  /** Path to the official crest image (e.g. "/images/crests/millonarios.png"). */
  crestSrc?: string;
  /** Accessible name for the crest, e.g. "Escudo de Millonarios FC". */
  alt?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const palette = palettes[initial] ?? palettes.M;
  const showImage = Boolean(crestSrc) && !imageFailed;

  // The <img> is server-rendered, so on a fast (e.g. local) 404 the native
  // error event can fire before hydration attaches onError, and browsers
  // don't replay it. Checking the already-settled element once on mount
  // catches that case too.
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth === 0) {
      setImageFailed(true);
    }
  }, [crestSrc]);

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl font-display font-bold shadow-card transition-transform duration-500 ${sizeClasses[size]}`}
      style={
        showImage
          ? { background: "#ffffff" }
          : { background: `linear-gradient(145deg, ${palette.from}, ${palette.to})`, color: palette.text }
      }
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- crest set is small and variable; next/image adds no real benefit here
        <img
          ref={imgRef}
          src={crestSrc}
          alt={alt ?? `Escudo de ${initial}`}
          className="h-full w-full object-contain p-1.5"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="relative">{initial}</span>
      )}
      <span className="pointer-events-none absolute inset-0 rounded-2xl border border-white/20" />
    </div>
  );
}
