"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UserRow {
  id: string;
  full_name: string | null;
  email: string | null;
  role: "admin" | "user";
  created_at: string;
}

interface UsersResult {
  users: UserRow[];
  error: string | null;
}

async function fetchUsers(): Promise<UsersResult> {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  const res = await fetch("/api/admin/users/list", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken }),
  });
  const body = await res.json().catch(() => ({}));

  return res.ok
    ? { users: body.users ?? [], error: null }
    : { users: [], error: body.error ?? "No se pudo cargar la lista de usuarios." };
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [result, setResult] = useState<UsersResult | null>(null);
  const loading = result === null;
  const users = result?.users ?? [];
  const error = result?.error ?? null;

  useEffect(() => {
    fetchUsers().then(setResult);
  }, []);

  async function changeRole(target: UserRow, role: "admin" | "user") {
    if (target.id === user?.id && role === "user") {
      if (!confirm("Vas a quitarte el rol de administrador a ti mismo. ¿Continuar?")) return;
    }

    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;

    const res = await fetch("/api/admin/users/update-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, userId: target.id, role }),
    });

    if (res.ok) fetchUsers().then(setResult);
    else {
      const body = await res.json().catch(() => ({}));
      alert(body.error ?? "No se pudo cambiar el rol.");
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
        Usuarios
      </h1>
      <p className="mt-1 text-sm font-medium text-navy-700/60">
        Usuarios registrados en el sitio. Cambia el rol para dar o quitar acceso al panel.
      </p>

      <div className="mt-6 overflow-hidden rounded-3xl border border-navy-900/8 bg-white shadow-card">
        {loading ? (
          <p className="p-6 text-sm font-medium text-navy-700/60">Cargando...</p>
        ) : error ? (
          <p className="p-6 text-sm text-rose-600">{error}</p>
        ) : users.length === 0 ? (
          <p className="p-6 text-sm font-medium text-navy-700/60">Aún no hay usuarios registrados.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-royal-50/60 text-xs font-semibold uppercase tracking-wider text-navy-700/60">
              <tr>
                <th className="px-5 py-3">Nombre</th>
                <th className="px-5 py-3">Correo</th>
                <th className="px-5 py-3">Fecha</th>
                <th className="px-5 py-3">Rol</th>
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
                  <td className="px-5 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u, e.target.value as "admin" | "user")}
                      className="rounded-lg border border-navy-900/12 px-2.5 py-1.5 text-sm font-medium"
                    >
                      <option value="user">Usuario</option>
                      <option value="admin">Administrador</option>
                    </select>
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
