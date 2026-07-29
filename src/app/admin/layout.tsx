"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { AdminThemeProvider } from "@/contexts/AdminThemeContext";
import { ToastProvider } from "@/components/ui/admin/Toast";
import AuthModal from "@/components/auth/AuthModal";
import Button from "@/components/ui/Button";
import { ArrowRightIcon, LockIcon } from "@/components/ui/Icons";
import { Sidebar } from "@/components/admin/layout/Sidebar";
import { Header } from "@/components/admin/layout/Header";
import { MobileDrawer } from "@/components/admin/layout/MobileDrawer";

function Forbidden() {
  const { user, loading, isAdmin } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Every denied/unauthorized attempt is logged server-side (never trusts
  // this component's own client-side read of `user`/`isAdmin` for the log
  // entry itself — the API route independently re-verifies the token).
  useEffect(() => {
    if (loading) return;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/access-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: pathname, accessToken: data.session?.access_token }),
      });
      const body = await res.json().catch(() => ({}));
      if (body.blocked) {
        setBlockedMessage("Demasiados intentos fallidos. Inténtalo de nuevo en unos minutos.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Authenticated but not admin: auto-redirect home after a few seconds.
  useEffect(() => {
    if (loading || !user || isAdmin) return;
    const timer = setTimeout(() => router.push("/"), 5000);
    return () => clearTimeout(timer);
  }, [loading, user, isAdmin, router]);

  const deniedNotAdmin = !loading && user && !isAdmin;

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 p-6">
      <div className="w-full max-w-md rounded-admin-xl border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-admin-lg bg-rose-500/15 text-rose-400">
          <LockIcon className="h-7 w-7" />
        </div>
        <p className="mt-6 font-display text-sm font-bold uppercase tracking-widest text-rose-400">
          Error 403
        </p>
        <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-white">
          {loading ? "Verificando acceso..." : deniedNotAdmin ? "Acceso denegado" : "Inicia sesión"}
        </h1>
        <p className="mt-3 text-sm font-medium leading-relaxed text-white/60">
          {loading
            ? "Un momento mientras confirmamos tu sesión."
            : deniedNotAdmin
              ? "Acceso denegado. No tienes permisos para acceder al panel administrativo. Te redirigiremos al sitio principal en unos segundos."
              : "Necesitas iniciar sesión con una cuenta de administrador para ver el panel."}
        </p>
        {blockedMessage && <p className="mt-3 text-sm font-semibold text-rose-400">{blockedMessage}</p>}

        {!loading && (
          <div className="mt-8 flex flex-col gap-3">
            {!user && (
              <Button variant="primary" className="w-full" onClick={() => setAuthOpen(true)}>
                Iniciar sesión
              </Button>
            )}
            <Link
              href="/"
              className="flex items-center justify-center gap-2 text-sm font-medium text-white/60 transition-colors hover:text-white"
            >
              <ArrowRightIcon className="h-4 w-4 rotate-180" />
              Volver al inicio
            </Link>
          </div>
        )}
      </div>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, profile, loading, isAdmin } = useAuth();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (loading || !user || !isAdmin) {
    return <Forbidden />;
  }

  return (
    <AdminThemeProvider>
      <ToastProvider>
        <div className="flex min-h-screen bg-admin-bg">
          <Sidebar pathname={pathname} />
          <MobileDrawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} pathname={pathname} />

          <div className="flex min-h-screen flex-1 flex-col">
            <Header pathname={pathname} profile={profile} onOpenMobileNav={() => setMobileNavOpen(true)} />
            <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
          </div>
        </div>
      </ToastProvider>
    </AdminThemeProvider>
  );
}
