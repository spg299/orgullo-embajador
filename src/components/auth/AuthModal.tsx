"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase/client";
import { supabaseAuthErrorMessage } from "@/lib/supabase/authErrors";
import { SITE_URL } from "@/lib/email/config";
import Button from "@/components/ui/Button";
import { CloseIcon } from "@/components/ui/Icons";

type View = "login" | "register" | "forgot";

const inputClasses =
  "w-full rounded-xl border border-navy-900/12 bg-white px-4 py-3 text-sm text-navy-950 placeholder:text-navy-900/30 focus:border-royal-400 focus:outline-none focus:ring-2 focus:ring-royal-100";

const labelClasses = "text-sm font-medium text-navy-900/80";

export default function AuthModal({
  initialView = "login",
  onClose,
}: {
  initialView?: View;
  onClose: () => void;
}) {
  const [view, setView] = useState<View>(initialView);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [confirmEmailSent, setConfirmEmailSent] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      onClose();
    } catch (err) {
      setError(supabaseAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: SITE_URL,
        },
      });
      if (error) throw error;

      if (data.session) {
        fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: data.session.access_token }),
        }).catch(() => {});
        onClose();
      } else {
        setConfirmEmailSent(true);
      }
    } catch (err) {
      setError(supabaseAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${SITE_URL}/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err) {
      setError(supabaseAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function switchView(next: View) {
    setView(next);
    setError(null);
    setResetSent(false);
    setConfirmEmailSent(false);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-navy-900/8 bg-white p-6 shadow-soft sm:p-8">
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onClose}
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-navy-900/50 transition-colors hover:bg-navy-900/5 hover:text-navy-900"
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        {view === "login" && (
          <>
            <h2 className="font-display text-2xl font-bold tracking-tight text-navy-950 pr-8">Iniciar sesión</h2>
            <p className="mt-1 text-sm font-medium text-navy-700/60">
              Ingresa para gestionar tus compras de boletas.
            </p>

            <form className="mt-6 flex flex-col gap-4" onSubmit={handleLogin}>
              <label className="flex flex-col gap-1.5">
                <span className={labelClasses}>Correo electrónico</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClasses}
                  placeholder="tucorreo@ejemplo.com"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelClasses}>Contraseña</span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClasses}
                  placeholder="••••••••"
                />
              </label>

              {error && <p className="text-sm text-rose-600">{error}</p>}

              <button
                type="button"
                onClick={() => switchView("forgot")}
                className="self-end text-sm font-medium text-royal-500 hover:text-royal-600"
              >
                ¿Olvidaste tu contraseña?
              </button>

              <Button type="submit" variant="primary" className="mt-2 w-full" disabled={loading}>
                {loading ? "Ingresando..." : "Iniciar sesión"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm font-medium text-navy-700/60">
              ¿No tienes cuenta?{" "}
              <button
                type="button"
                onClick={() => switchView("register")}
                className="font-semibold text-royal-500 hover:text-royal-600"
              >
                Regístrate
              </button>
            </p>
          </>
        )}

        {view === "register" && (
          <>
            <h2 className="font-display text-2xl font-bold tracking-tight text-navy-950 pr-8">Crear cuenta</h2>
            <p className="mt-1 text-sm font-medium text-navy-700/60">
              Únete para recibir aviso cuando haya nuevas boletas disponibles.
            </p>

            {confirmEmailSent ? (
              <p className="mt-6 rounded-xl bg-royal-50/60 px-4 py-6 text-center text-sm font-medium text-navy-800">
                ¡Listo! Revisa tu correo (<strong>{email}</strong>) y confirma tu cuenta antes de
                iniciar sesión.
              </p>
            ) : (
              <form className="mt-6 flex flex-col gap-4" onSubmit={handleRegister}>
                <label className="flex flex-col gap-1.5">
                  <span className={labelClasses}>Nombre completo</span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClasses}
                    placeholder="Ej. Juan Pérez Gómez"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelClasses}>Correo electrónico</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClasses}
                    placeholder="tucorreo@ejemplo.com"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelClasses}>Contraseña</span>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClasses}
                    placeholder="Mínimo 6 caracteres"
                  />
                </label>

                {error && <p className="text-sm text-rose-600">{error}</p>}

                <Button type="submit" variant="primary" className="mt-2 w-full" disabled={loading}>
                  {loading ? "Creando cuenta..." : "Crear cuenta"}
                </Button>
              </form>
            )}

            <p className="mt-6 text-center text-sm font-medium text-navy-700/60">
              ¿Ya tienes cuenta?{" "}
              <button
                type="button"
                onClick={() => switchView("login")}
                className="font-semibold text-royal-500 hover:text-royal-600"
              >
                Inicia sesión
              </button>
            </p>
          </>
        )}

        {view === "forgot" && (
          <>
            <h2 className="font-display text-2xl font-bold tracking-tight text-navy-950 pr-8">
              Recuperar contraseña
            </h2>
            <p className="mt-1 text-sm font-medium text-navy-700/60">
              Te enviaremos un correo con instrucciones para restablecerla.
            </p>

            {resetSent ? (
              <p className="mt-6 rounded-xl bg-royal-50/60 px-4 py-6 text-center text-sm font-medium text-navy-800">
                Listo — revisa tu correo (<strong>{email}</strong>) para continuar.
              </p>
            ) : (
              <form className="mt-6 flex flex-col gap-4" onSubmit={handleForgotPassword}>
                <label className="flex flex-col gap-1.5">
                  <span className={labelClasses}>Correo electrónico</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClasses}
                    placeholder="tucorreo@ejemplo.com"
                  />
                </label>

                {error && <p className="text-sm text-rose-600">{error}</p>}

                <Button type="submit" variant="primary" className="mt-2 w-full" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar enlace"}
                </Button>
              </form>
            )}

            <p className="mt-6 text-center text-sm font-medium text-navy-700/60">
              <button
                type="button"
                onClick={() => switchView("login")}
                className="font-semibold text-royal-500 hover:text-royal-600"
              >
                Volver a iniciar sesión
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
