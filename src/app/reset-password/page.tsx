"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";
import { supabaseAuthErrorMessage } from "@/lib/supabase/authErrors";

const inputClasses =
  "w-full rounded-xl border border-navy-900/12 bg-white px-4 py-3 text-sm text-navy-950 placeholder:text-navy-900/30 focus:border-royal-400 focus:outline-none focus:ring-2 focus:ring-royal-100";

const labelClasses = "text-sm font-medium text-navy-900/80";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session));
      setCheckingSession(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(Boolean(session));
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => router.push("/"), 2500);
    } catch (err) {
      setError(supabaseAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-royal-50/40 py-16 sm:py-24">
        <Container className="flex justify-center">
          <div className="w-full max-w-md rounded-3xl border border-navy-900/8 bg-white p-6 shadow-card sm:p-8">
            <h1 className="font-display text-2xl font-bold tracking-tight text-navy-950">
              Restablecer contraseña
            </h1>

            {checkingSession ? (
              <p className="mt-4 text-sm font-medium text-navy-700/60">Verificando enlace...</p>
            ) : !hasSession ? (
              <p className="mt-4 rounded-xl bg-rose-50 px-4 py-6 text-center text-sm font-medium text-rose-700">
                Este enlace no es válido o ya expiró. Solicita uno nuevo desde &quot;Iniciar
                sesión&quot; → &quot;¿Olvidaste tu contraseña?&quot;.
              </p>
            ) : success ? (
              <p className="mt-4 rounded-xl bg-royal-50/60 px-4 py-6 text-center text-sm font-medium text-navy-800">
                ¡Contraseña actualizada! Te llevamos al inicio...
              </p>
            ) : (
              <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
                <p className="text-sm font-medium text-navy-700/60">Ingresa tu nueva contraseña.</p>
                <label className="flex flex-col gap-1.5">
                  <span className={labelClasses}>Nueva contraseña</span>
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
                <label className="flex flex-col gap-1.5">
                  <span className={labelClasses}>Confirmar contraseña</span>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClasses}
                    placeholder="Repite la contraseña"
                  />
                </label>

                {error && <p className="text-sm text-rose-600">{error}</p>}

                <Button type="submit" variant="primary" className="mt-2 w-full" disabled={loading}>
                  {loading ? "Guardando..." : "Guardar nueva contraseña"}
                </Button>
              </form>
            )}
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
