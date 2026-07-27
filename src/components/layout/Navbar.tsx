"use client";

import Link from "next/link";
import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import AuthModal from "@/components/auth/AuthModal";
import { CloseIcon, MenuIcon, WhatsAppIcon } from "@/components/ui/Icons";

const links = [
  { href: "/#inicio", label: "Inicio" },
  { href: "/#partidos", label: "Partidos" },
  { href: "/#como-comprar", label: "Cómo comprar" },
  { href: "/#contacto", label: "Contacto" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const { user, loading } = useAuth();

  const firstName = user?.displayName?.split(" ")[0];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-navy-900/5 bg-white/80 backdrop-blur-lg">
        <Container className="flex h-20 items-center justify-between">
          <Link href="/" className="group flex items-center gap-2.5">
            <img
              src="/images/logo-orgullo-embajador.png"
              alt="Orgullo Embajador"
              width={112}
              height={112}
              className="h-14 w-14 rounded-xl object-contain shadow-card transition-transform duration-300 ease-out group-hover:scale-105"
            />
            <span className="font-display text-lg font-bold leading-none text-navy-950">
              Orgullo
              <br />
              <span className="text-royal-500">Embajador</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-9 lg:flex">
            {links.map((link) => (
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
            <Button
              variant="whatsapp"
              size="sm"
              icon={<WhatsAppIcon className="h-4 w-4" />}
            >
              WhatsApp
            </Button>

            {!loading && user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-navy-800">
                  Hola, {firstName ?? "usuario"}
                </span>
                <Button variant="ghost" size="sm" onClick={() => signOut(auth)}>
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
            aria-label="Abrir menú"
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-navy-900 lg:hidden"
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </Container>

        {open && (
          <div className="border-t border-navy-900/5 bg-white lg:hidden">
            <Container className="flex flex-col gap-1 py-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy-800 hover:bg-royal-50"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 flex flex-col gap-2 px-1">
                <Button
                  variant="whatsapp"
                  size="sm"
                  icon={<WhatsAppIcon className="h-4 w-4" />}
                >
                  WhatsApp
                </Button>

                {!loading && user ? (
                  <>
                    <p className="px-1 text-sm font-medium text-navy-800">
                      Hola, {firstName ?? "usuario"}
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        signOut(auth);
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
                    onClick={() => {
                      setAuthOpen(true);
                      setOpen(false);
                    }}
                  >
                    Iniciar sesión
                  </Button>
                )}
              </div>
            </Container>
          </div>
        )}
      </header>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </>
  );
}
