import { StarIcon } from "@/components/ui/Icons";

const STARS = [1, 2, 3, 4, 5];

export default function StarRating({
  value,
  onChange,
  size = "h-4 w-4",
  className = "",
}: {
  value: number;
  onChange?: (value: number) => void;
  size?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-0.5 ${className}`}
      role={onChange ? "radiogroup" : "img"}
      aria-label={onChange ? "Calificación" : `Calificación: ${value} de 5 estrellas`}
    >
      {STARS.map((n) =>
        onChange ? (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === value}
            aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
            onClick={() => onChange(n)}
            className="transition-transform duration-150 hover:scale-110"
          >
            <StarIcon
              className={`${size} ${n <= value ? "text-gold-500" : "text-navy-900/15 dark:text-white/15"}`}
            />
          </button>
        ) : (
          <StarIcon
            key={n}
            className={`${size} ${n <= value ? "text-gold-500" : "text-navy-900/15 dark:text-white/15"}`}
          />
        ),
      )}
    </div>
  );
}
