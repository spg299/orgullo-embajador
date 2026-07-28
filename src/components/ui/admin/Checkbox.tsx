import { forwardRef, type InputHTMLAttributes } from "react";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className = "", id, ...props },
  ref,
) {
  return (
    <label className="flex items-center gap-2.5">
      <input
        ref={ref}
        id={id}
        type="checkbox"
        className={`h-4 w-4 rounded border-admin-border text-royal-500 focus:ring-2 focus:ring-royal-400/40 ${className}`}
        {...props}
      />
      <span className="text-sm font-medium text-admin-text/80">{label}</span>
    </label>
  );
});
