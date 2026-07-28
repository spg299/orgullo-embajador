"use client";

import { useAdminTheme } from "@/contexts/AdminThemeContext";
import { SunIcon, MoonIcon } from "@/components/ui/Icons";

export function ThemeToggle() {
  const { toggle } = useAdminTheme();

  // Both icons always render — which one is visible is decided purely by
  // CSS (the dark: variant tracks the data-admin-theme attribute), so the
  // server render and the client's first render are byte-identical and
  // there's nothing for React to hydration-mismatch on. Branching this on
  // the `theme` value from context instead would render a different icon
  // server-side ("light", no window) vs. client-side (a stored "dark"
  // preference), which is exactly what caused a hydration error here.
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Cambiar tema"
      className="flex h-9 w-9 items-center justify-center rounded-full text-admin-text-muted transition-colors hover:bg-admin-border hover:text-admin-text"
    >
      <SunIcon className="hidden h-5 w-5 dark:block" />
      <MoonIcon className="block h-5 w-5 dark:hidden" />
    </button>
  );
}
