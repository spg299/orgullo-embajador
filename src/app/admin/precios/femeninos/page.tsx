"use client";

import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { PencilIcon, TrashIcon } from "@/components/ui/Icons";
import { formatCOP } from "@/lib/format";
import { DataTable, type DataTableColumn } from "@/components/ui/admin/DataTable";
import { useDataTable } from "@/components/ui/admin/useDataTable";
import { Dialog } from "@/components/ui/admin/Dialog";
import { ConfirmDialog } from "@/components/ui/admin/ConfirmDialog";
import { Input } from "@/components/ui/admin/Input";
import { Select } from "@/components/ui/admin/Select";
import { useToast } from "@/components/ui/admin/Toast";
import { Badge } from "@/components/ui/admin/Badge";

type Availability = "disponible" | "baja" | "agotado";

interface FemaleTierRow {
  id: string;
  name: string;
  description: string;
  color: string;
  price: number;
  availability: Availability;
  sort_order: number;
}

const emptyTier: FemaleTierRow = {
  id: "",
  name: "",
  description: "",
  color: "#0f3fb0",
  price: 0,
  availability: "disponible",
  sort_order: 0,
};

const availabilityLabels: Record<Availability, string> = {
  disponible: "Disponible",
  baja: "Últimas boletas",
  agotado: "Agotado",
};

const availabilityBadgeVariant: Record<Availability, "success" | "warning" | "danger"> = {
  disponible: "success",
  baja: "warning",
  agotado: "danger",
};

async function describeError(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const body = JSON.parse(text);
    return body.error || text || `Error ${res.status}`;
  } catch {
    return text || `Error ${res.status}`;
  }
}

// Independent from /admin/precios (men's) — its own table (female_tiers),
// own API route (/api/admin/female-tiers). A shared list used by every
// active women's match, exactly like public.tiers is shared by every
// men's match.
export default function AdminFemaleTiersPage() {
  const toast = useToast();
  const [tiers, setTiers] = useState<FemaleTierRow[] | null>(null);
  const [editing, setEditing] = useState<FemaleTierRow | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<FemaleTierRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const loading = tiers === null;

  const table = useDataTable<FemaleTierRow>({
    data: tiers ?? [],
    searchableFields: ["name", "description"],
    initialSort: { field: "sort_order", direction: "asc" },
  });

  async function fetchTiers(): Promise<FemaleTierRow[]> {
    const { data, error } = await supabase.from("female_tiers").select("*").order("sort_order");
    return error ? [] : ((data as FemaleTierRow[]) ?? []);
  }

  useEffect(() => {
    fetchTiers().then(setTiers);
  }, []);

  function openNew() {
    setEditing({ ...emptyTier, sort_order: (tiers?.length ?? 0) + 1 });
    setIsNew(true);
    setError(null);
  }

  function openEdit(tier: FemaleTierRow) {
    setEditing({ ...tier });
    setIsNew(false);
    setError(null);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    const res = await fetch("/api/admin/female-tiers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, id: pendingDelete.id }),
    });
    setDeleting(false);
    if (res.ok) {
      fetchTiers().then(setTiers);
      toast.success("Localidad eliminada.");
    } else {
      toast.error(await describeError(res));
    }
    setPendingDelete(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    const res = await fetch("/api/admin/female-tiers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, tier: editing }),
    });

    setSaving(false);
    if (res.ok) {
      setEditing(null);
      fetchTiers().then(setTiers);
      toast.success("Localidad guardada correctamente.");
    } else {
      const message = await describeError(res);
      setError(message);
      toast.error(message);
    }
  }

  const columns: DataTableColumn<FemaleTierRow>[] = [
    {
      key: "name",
      header: "Localidad",
      sortable: true,
      render: (tier) => (
        <div className="flex items-center gap-2.5">
          <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: tier.color }} />
          <span className="font-semibold text-admin-text">{tier.name}</span>
        </div>
      ),
    },
    {
      key: "price",
      header: "Precio",
      sortable: true,
      render: (tier) => formatCOP(tier.price),
    },
    {
      key: "availability",
      header: "Disponibilidad",
      sortable: true,
      render: (tier) => (
        <Badge
          variant={availabilityBadgeVariant[tier.availability]}
          dot={tier.availability !== "disponible"}
        >
          {availabilityLabels[tier.availability]}
        </Badge>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-admin-text">
            Precios femeninos
          </h1>
          <p className="mt-1 text-sm font-medium text-admin-text-muted">
            Crea, edita y elimina las localidades y sus precios para los partidos femeninos. Este
            listado es independiente del de Precios (hombres) y aplica a todos los partidos
            femeninos activos.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={openNew} className="self-start sm:self-auto">
          Nueva localidad
        </Button>
      </div>

      <div className="mt-6">
        <DataTable
          table={table}
          keyField="id"
          loading={loading}
          emptyMessage="Aún no hay localidades femeninas. Crea la primera."
          searchPlaceholder="Buscar por localidad..."
          columns={columns}
          renderActions={(tier) => (
            <>
              <button
                type="button"
                aria-label="Editar"
                onClick={() => openEdit(tier)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-admin-text-muted transition-colors hover:bg-admin-bg hover:text-admin-text"
              >
                <PencilIcon />
              </button>
              <button
                type="button"
                aria-label="Eliminar"
                onClick={() => setPendingDelete(tier)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10"
              >
                <TrashIcon />
              </button>
            </>
          )}
        />
      </div>

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={isNew ? "Nueva localidad" : `Editar: ${editing?.name ?? ""}`}
      >
        {editing && (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {isNew && (
              <Input
                label="ID (slug único, ej. femenino-tribuna-norte)"
                required
                value={editing.id}
                onChange={(e) => setEditing({ ...editing, id: e.target.value })}
              />
            )}

            <Input
              label="Localidad"
              required
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />

            <Input
              label="Descripción"
              required
              value={editing.description}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Precio (COP)"
                required
                type="number"
                min={0}
                value={editing.price}
                onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
              />
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-admin-text/80">Color</span>
                <input
                  type="color"
                  value={editing.color}
                  onChange={(e) => setEditing({ ...editing, color: e.target.value })}
                  className="h-[42px] w-full rounded-admin-md border border-admin-border bg-admin-surface px-2 py-1"
                />
              </label>
            </div>

            <Select
              label="Disponibilidad"
              value={editing.availability}
              onChange={(e) => setEditing({ ...editing, availability: e.target.value as Availability })}
            >
              <option value="disponible">Disponible</option>
              <option value="baja">Últimas boletas</option>
              <option value="agotado">Agotado</option>
            </Select>

            <Input
              label="Orden"
              type="number"
              value={editing.sort_order}
              onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
              className="w-32"
            />

            {error && <p className="text-sm text-rose-500">{error}</p>}

            <div className="mt-2 flex gap-3">
              <Button type="submit" variant="primary" className="flex-1" disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Eliminar localidad"
        description={
          pendingDelete
            ? `¿Eliminar la localidad "${pendingDelete.name}"? Esta acción no se puede deshacer.`
            : undefined
        }
        confirmLabel="Eliminar"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
