"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/auth/AuthModal";
import Button from "@/components/ui/Button";
import { ArrowRightIcon, LockIcon } from "@/components/ui/Icons";

const navItems = [
  { href: "/admin", label: "Dashboard", emoji: "📊" },
  { href: "/admin/matches", label: "Partidos", emoji: "⚽" },
  { href: "/admin/precios", label: "Precios", emoji: "💰" },
  { href: "/admin/logos", label: "Logos", emoji: "🖼" },
  { href: "/admin/hero", label: "Hero", emoji: "🎥" },
  { href: "/admin/testimonials", label: "Testimonios", emoji: "⭐" },
  { href: "/admin/users", label: "Usuarios", emoji: "👥" },
  { href: "/admin/configuracion", label: "Configuración", emoji: "⚙️" },
];

function Forbidden() {
  const { user, loading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 p-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-400">
          <LockIcon className="h-7 w-7" />
        </div>
        <p className="mt-6 font-display text-sm font-bold uppercase tracking-widest text-rose-400">
          Error 403
        </p>
        <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-white">
          {loading ? "Verificando acceso..." : user ? "No tienes permisos" : "Inicia sesión"}
        </h1>
        <p className="mt-3 text-sm font-medium leading-relaxed text-white/60">
          {loading
            ? "Un momento mientras confirmamos tu sesión."
            : user
              ? "Esta sección es solo para administradores. Si crees que deberías tener acceso, contacta a un administrador."
              : "Necesitas iniciar sesión con una cuenta de administrador para ver el panel."}
        </p>

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

  if (loading || !user || !isAdmin) {
    return <Forbidden />;
  }

  return (
    <div className="flex min-h-screen bg-royal-50/40">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-navy-900/8 bg-navy-950 p-5 lg:flex">
        <Link href="/" className="mb-8 flex items-center gap-2.5 px-1">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-royal-400 to-royal-600 font-display text-sm font-bold text-white">
            OE
          </span>
          <span className="font-display text-sm font-extrabold leading-none tracking-tight text-white">
            Panel admin
          </span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="text-base leading-none" aria-hidden="true">
                  {item.emoji}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-white/50 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ArrowRightIcon className="h-4 w-4 rotate-180" />
          Volver al sitio
        </Link>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-navy-900/8 bg-white px-6 py-4 lg:hidden">
          <span className="font-display text-sm font-extrabold text-navy-950">Panel admin</span>
          <Link href="/" className="text-sm font-medium text-royal-500">
            Volver al sitio
          </Link>
        </header>

        <div className="border-b border-navy-900/8 bg-white px-6 py-4">
          <p className="text-sm font-medium text-navy-700/60">
            Conectado como <span className="font-semibold text-navy-950">{profile?.full_name || profile?.email}</span>
          </p>
        </div>

        <nav className="flex gap-1 overflow-x-auto border-b border-navy-900/8 bg-white px-4 py-2 lg:hidden">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active ? "bg-royal-500 text-white" : "bg-royal-50 text-navy-700"
                }`}
              >
                <span className="text-sm leading-none" aria-hidden="true">
                  {item.emoji}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
