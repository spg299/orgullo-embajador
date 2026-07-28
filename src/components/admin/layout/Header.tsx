"use client";

import { supabase } from "@/lib/supabase/client";
import { MenuIcon, LogoutIcon } from "@/components/ui/Icons";
import { Avatar } from "@/components/ui/admin/Avatar";
import { Breadcrumb } from "@/components/ui/admin/Breadcrumb";
import { ThemeToggle } from "@/components/ui/admin/ThemeToggle";
import { navItems } from "@/components/admin/layout/navItems";
import type { Profile } from "@/contexts/AuthContext";

export function Header({
  pathname,
  profile,
  onOpenMobileNav,
}: {
  pathname: string;
  profile: Profile | null;
  onOpenMobileNav: () => void;
}) {
  const currentLabel = navItems.find((item) => item.href === pathname)?.label ?? "Dashboard";
  const displayName = profile?.full_name || profile?.email || "Administrador";

  return (
    <header className="flex items-center justify-between gap-4 border-b border-admin-border bg-admin-surface px-4 py-3.5 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Abrir menú"
          className="flex h-9 w-9 items-center justify-center rounded-full text-admin-text-muted transition-colors hover:bg-admin-bg hover:text-admin-text lg:hidden"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <Breadcrumb items={[{ label: "Panel admin", href: "/admin" }, { label: currentLabel }]} />
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <div className="mx-1 hidden items-center gap-2.5 sm:flex">
          <Avatar name={displayName} size="sm" />
          <div className="leading-tight">
            <p className="text-sm font-semibold text-admin-text">{displayName}</p>
            <p className="text-xs font-medium text-admin-text-muted">
              {profile?.role === "admin" ? "Administrador" : "Usuario"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          aria-label="Cerrar sesión"
          className="flex h-9 w-9 items-center justify-center rounded-full text-admin-text-muted transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
        >
          <LogoutIcon className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
