"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import AuthModal from "@/components/auth/AuthModal";
import { CloseIcon, MenuIcon } from "@/components/ui/Icons";
import { siteSettings as defaultSiteSettings, fetchSiteSettings } from "@/data/siteSettings";

const links = [
  { href: "/#inicio", label: "Inicio" },
  { href: "/#partidos", label: "Partidos" },
  { href: "/#como-comprar", label: "Cómo comprar" },
  { href: "/#contacto", label: "Contacto" },
];

const ADMIN_LINK = { href: "/admin", label: "Panel de administración" };

// Staggered items: the nav links (+1 more when the admin link is shown) +
// the login/logout button. Kept in sync with the JSX below so open/close
// stagger delays line up in both directions.
const MOBILE_STAGGER_MS = 70;
const MOBILE_ITEM_TRANSITION =
  "transition-all duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)]";

function mobileItemStyle(open: boolean, index: number, total: number): CSSProperties {
  const delayIndex = open ? index : total - 1 - index;
  return { transitionDelay: `${delayIndex * MOBILE_STAGGER_MS}ms` };
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState(defaultSiteSettings.site_logo_url);
  const { user, loading, isAdmin } = useAuth();

  useEffect(() => {
    fetchSiteSettings().then((settings) => setLogoUrl(settings.site_logo_url));
  }, []);

  const navLinks = isAdmin ? [...links, ADMIN_LINK] : links;
  const mobileItemCount = navLinks.length + 1;

  const firstName = (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-navy-900/5 bg-white/80 backdrop-blur-lg">
        <Container className="flex h-20 items-center justify-between">
          <Link href="/" className="group flex items-center gap-2.5">
            <img
              src={logoUrl}
              alt="Orgullo Embajador"
              width={112}
              height={112}
              className="h-14 w-14 rounded-xl object-contain shadow-card transition-transform duration-300 ease-out group-hover:scale-105"
            />
            <span className="font-display text-lg font-extrabold leading-none tracking-tight text-navy-950">
              Orgullo
              <br />
              <span className="text-royal-500">Embajador</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-9 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-navy-800/80 transition-colors hover:text-royal-500"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            {!loading && user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-navy-800">
                  Hola, {firstName ?? "usuario"}
                </span>
                <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>
                  Cerrar sesión
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setAuthOpen(true)}>
                Iniciar sesión
              </Button>
            )}
          </div>

          <button
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full text-navy-900 lg:hidden"
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </Container>

        <div
          aria-hidden={!open}
          className={`grid overflow-hidden border-t border-navy-900/5 bg-white transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden ${
            open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <Container
              className={`flex flex-col gap-1 py-4 transition-opacity duration-300 ${
                open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              {navLinks.map((link, i) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  tabIndex={open ? 0 : -1}
                  style={mobileItemStyle(open, i, mobileItemCount)}
                  className={`group relative rounded-lg px-3 py-2.5 text-sm font-medium text-navy-800 hover:scale-[1.025] hover:text-royal-500 ${MOBILE_ITEM_TRANSITION} ${
                    open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                  }`}
                >
                  {link.label}
                  <span className="pointer-events-none absolute inset-x-3 bottom-1 h-[2px] origin-left scale-x-0 bg-royal-500 transition-transform duration-300 ease-out group-hover:scale-x-100" />
                </Link>
              ))}

              <div className="mt-2 flex flex-col gap-2 px-1">
                <div
                  style={mobileItemStyle(open, navLinks.length, mobileItemCount)}
                  className={`flex flex-col gap-2 ${MOBILE_ITEM_TRANSITION} ${
                    open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                  }`}
                >
                  {!loading && user ? (
                    <>
                      <p className="px-1 text-sm font-medium text-navy-800">
                        Hola, {firstName ?? "usuario"}
                      </p>
                      <Button
                        variant="secondary"
                        size="sm"
                        tabIndex={open ? 0 : -1}
                        onClick={() => {
                          supabase.auth.signOut();
                          setOpen(false);
                        }}
                      >
                        Cerrar sesión
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      tabIndex={open ? 0 : -1}
                      onClick={() => {
                        setAuthOpen(true);
                        setOpen(false);
                      }}
                    >
                      Iniciar sesión
                    </Button>
                  )}
                </div>
              </div>
            </Container>
          </div>
        </div>
      </header>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </>
  );
}
