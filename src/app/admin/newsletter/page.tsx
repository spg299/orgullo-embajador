"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";

interface UserRow {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
}

export default function AdminNewsletterPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      const res = await fetch("/api/admin/users/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) setUsers(body.users ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const emails = users.map((u) => u.email).filter(Boolean) as string[];

  async function copyEmails() {
    await navigator.clipboard.writeText(emails.join(", "));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
            Newsletter
          </h1>
          <p className="mt-1 text-sm font-medium text-navy-700/60">
            Todos los usuarios registrados reciben aviso de nuevas boletas por correo — esta es tu
            lista para campañas ({emails.length} correo(s)).
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={copyEmails} disabled={emails.length === 0}>
          {copied ? "¡Copiado!" : "Copiar correos"}
        </Button>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-navy-900/8 bg-white shadow-card">
        {loading ? (
          <p className="p-6 text-sm font-medium text-navy-700/60">Cargando...</p>
        ) : users.length === 0 ? (
          <p className="p-6 text-sm font-medium text-navy-700/60">Aún no hay usuarios registrados.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-royal-50/60 text-xs font-semibold uppercase tracking-wider text-navy-700/60">
              <tr>
                <th className="px-5 py-3">Nombre</th>
                <th className="px-5 py-3">Correo</th>
                <th className="px-5 py-3">Registrado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-900/5">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-5 py-3 font-semibold text-navy-950">{u.full_name || "—"}</td>
                  <td className="px-5 py-3 text-navy-700/70">{u.email}</td>
                  <td className="px-5 py-3 text-navy-700/70">
                    {new Date(u.created_at).toLocaleDateString("es-CO")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
