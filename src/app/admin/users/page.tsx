"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { TrashIcon } from "@/components/ui/Icons";
import { DataTable, type DataTableColumn } from "@/components/ui/admin/DataTable";
import { useDataTable } from "@/components/ui/admin/useDataTable";
import { ConfirmDialog } from "@/components/ui/admin/ConfirmDialog";
import { useToast } from "@/components/ui/admin/Toast";

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
  const toast = useToast();
  const [result, setResult] = useState<UsersResult | null>(null);
  const [pendingDemote, setPendingDemote] = useState<UserRow | null>(null);
  const [pendingDelete, setPendingDelete] = useState<UserRow | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const loading = result === null;
  const users = result?.users ?? [];
  const error = result?.error ?? null;

  const table = useDataTable<UserRow>({
    data: users,
    searchableFields: ["full_name", "email"],
    initialSort: { field: "created_at", direction: "desc" },
  });

  useEffect(() => {
    fetchUsers().then(setResult);
  }, []);

  async function performChangeRole(target: UserRow, role: "admin" | "user") {
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;

    const res = await fetch("/api/admin/users/update-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, userId: target.id, role }),
    });

    if (res.ok) {
      fetchUsers().then(setResult);
      toast.success("Rol actualizado correctamente.");
    } else {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "No se pudo cambiar el rol.");
    }
  }

  function changeRole(target: UserRow, role: "admin" | "user") {
    if (target.id === user?.id && role === "user") {
      setPendingDemote(target);
      return;
    }
    performChangeRole(target, role);
  }

  function handleDeleteUser(target: UserRow) {
    if (target.id === user?.id) {
      toast.error("No puedes eliminar tu propia cuenta.");
      return;
    }
    setPendingDelete(target);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setActionLoading(true);

    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;

    const res = await fetch("/api/admin/users/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, userId: pendingDelete.id }),
    });

    setActionLoading(false);
    if (res.ok) {
      fetchUsers().then(setResult);
      toast.success("Usuario eliminado.");
    } else {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "No se pudo eliminar el usuario.");
    }
    setPendingDelete(null);
  }

  const columns: DataTableColumn<UserRow>[] = [
    {
      key: "full_name",
      header: "Nombre",
      sortable: true,
      render: (u) => <span className="font-semibold text-admin-text">{u.full_name || "—"}</span>,
    },
    { key: "email", header: "Correo", sortable: true, render: (u) => u.email },
    {
      key: "created_at",
      header: "Fecha",
      sortable: true,
      render: (u) => new Date(u.created_at).toLocaleDateString("es-CO"),
    },
    {
      key: "role",
      header: "Rol",
      sortable: true,
      render: (u) => (
        <div className="relative inline-block">
          <select
            value={u.role}
            onChange={(e) => changeRole(u, e.target.value as "admin" | "user")}
            className="rounded-admin-sm border border-admin-border bg-admin-surface px-2.5 py-1.5 text-sm font-medium text-admin-text focus:border-royal-400 focus:outline-none focus:ring-2 focus:ring-royal-400/40"
          >
            <option value="user">Usuario</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-admin-text">
        Usuarios
      </h1>
      <p className="mt-1 text-sm font-medium text-admin-text-muted">
        Usuarios registrados en el sitio. Cambia el rol para dar o quitar acceso al panel.
      </p>

      {error ? (
        <div className="mt-6 rounded-admin-xl border border-admin-border bg-admin-surface p-6 shadow-admin-xs">
          <p className="text-sm font-medium text-rose-500">{error}</p>
        </div>
      ) : (
        <div className="mt-6">
          <DataTable
            table={table}
            keyField="id"
            loading={loading}
            emptyMessage="Aún no hay usuarios registrados."
            searchPlaceholder="Buscar por nombre o correo..."
            columns={columns}
            renderActions={(u) => (
              <button
                type="button"
                aria-label="Eliminar usuario"
                onClick={() => handleDeleteUser(u)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10"
              >
                <TrashIcon />
              </button>
            )}
          />
        </div>
      )}

      <ConfirmDialog
        open={pendingDemote !== null}
        title="Quitarte el rol de administrador"
        description="Vas a quitarte el rol de administrador a ti mismo. ¿Continuar?"
        confirmLabel="Sí, continuar"
        destructive
        onConfirm={() => {
          if (pendingDemote) performChangeRole(pendingDemote, "user");
          setPendingDemote(null);
        }}
        onCancel={() => setPendingDemote(null)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Eliminar usuario"
        description={
          pendingDelete
            ? `¿Eliminar la cuenta de ${pendingDelete.full_name || pendingDelete.email}? Esta acción no se puede deshacer.`
            : undefined
        }
        confirmLabel="Eliminar"
        destructive
        loading={actionLoading}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
