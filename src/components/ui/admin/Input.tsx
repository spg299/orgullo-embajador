import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className = "", id, ...props },
  ref,
) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && <span className="text-sm font-medium text-admin-text/80">{label}</span>}
      <input
        ref={ref}
        id={id}
        className={`rounded-admin-md border px-4 py-2.5 text-sm text-admin-text placeholder:text-admin-text-muted/60 bg-admin-surface transition-colors focus:outline-none focus:ring-2 focus:ring-royal-400/40 ${
          error ? "border-rose-400" : "border-admin-border focus:border-royal-400"
        } ${className}`}
        {...props}
      />
      {hint && !error && <span className="text-xs font-medium text-admin-text-muted">{hint}</span>}
      {error && <span className="text-xs font-medium text-rose-500">{error}</span>}
    </label>
  );
});
