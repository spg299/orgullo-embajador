import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDownIcon } from "@/components/ui/Icons";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
}

// Takes `children` (pass <option> elements through verbatim) rather than a
// forced options[] prop, so each page's exact option list/order stays
// untouched when swapping in this component.
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className = "", id, children, ...props },
  ref,
) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && <span className="text-sm font-medium text-admin-text/80">{label}</span>}
      <div className="relative">
        <select
          ref={ref}
          id={id}
          className={`w-full appearance-none rounded-admin-md border bg-admin-surface px-4 py-2.5 pr-10 text-sm text-admin-text transition-colors focus:outline-none focus:ring-2 focus:ring-royal-400/40 ${
            error ? "border-rose-400" : "border-admin-border focus:border-royal-400"
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-text-muted" />
      </div>
      {hint && !error && <span className="text-xs font-medium text-admin-text-muted">{hint}</span>}
      {error && <span className="text-xs font-medium text-rose-500">{error}</span>}
    </label>
  );
});
