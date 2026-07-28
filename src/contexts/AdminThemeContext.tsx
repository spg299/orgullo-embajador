"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "oe-admin-theme";

interface AdminThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const AdminThemeContext = createContext<AdminThemeContextValue>({
  theme: "light",
  toggle: () => {},
});

// Read synchronously during the lazy useState initializer (not an effect),
// so React's *internal* state is correct from the client's very first
// render. That alone doesn't fix the visible DOM though: for attribute
// mismatches, React's hydration diffing explicitly leaves the
// server-rendered value in place ("this won't be patched up" — confirmed
// empirically, not just for suppressHydrationWarning'd nodes) rather than
// regenerating the subtree, so a stored "dark" preference would otherwise
// render "light" and never self-correct until the user's next toggle. The
// inline script below runs synchronously while the HTML is still parsing,
// before hydration, and sets the attribute directly on the real DOM node —
// so by the time React hydrates, its own independently-computed value
// already matches, and there's nothing left to mismatch.
function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "dark" || stored === "light" ? stored : "light";
}

const THEME_ROOT_ID = "admin-theme-root";

const THEME_INIT_SCRIPT = `(function(){try{var t=window.localStorage.getItem("${STORAGE_KEY}");var el=document.getElementById("${THEME_ROOT_ID}");if(el)el.setAttribute("data-admin-theme",t==="dark"?"dark":"light");}catch(e){}})();`;

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  function toggle() {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }

  return (
    <AdminThemeContext.Provider value={{ theme, toggle }}>
      <div id={THEME_ROOT_ID} data-admin-theme={theme} suppressHydrationWarning className="contents">
        {children}
      </div>
      <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  return useContext(AdminThemeContext);
}
