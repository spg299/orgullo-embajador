"use client";

import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { PencilIcon, TrashIcon } from "@/components/ui/Icons";
import { formatCOP } from "@/lib/format";

type Availability = "alta" | "media" | "baja";

interface TierRow {
  id: string;
  name: string;
  description: string;
  color: string;
  price: number;
  availability: Availability;
  sort_order: number;
}

const emptyTier: TierRow = {
  id: "",
  name: "",
  description: "",
  color: "#0f3fb0",
  price: 0,
  availability: "alta",
  sort_order: 0,
};

const availabilityLabels: Record<Availability, string> = {
  alta: "Alta disponibilidad",
  media: "Disponibilidad media",
  baja: "Últimas boletas",
};

// TEMPORARY DEBUG: surfaces the real Supabase/API error instead of a generic
// fallback, to diagnose why saving a tier was failing silently. Reads the
// response as text first (not res.json() directly) so a non-JSON error body
// — e.g. an uncaught exception in the route handler — is still visible
// instead of being swallowed into an empty object. Revert to a friendly
// message once the root cause is confirmed fixed.
async function describeError(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const body = JSON.parse(text);
    return body.error || text || `Error ${res.status}`;
  } catch {
    return text || `Error ${res.status}`;
  }
}

export default function AdminPreciosPage() {
  const [tiers, setTiers] = useState<TierRow[] | null>(null);
  const [editing, setEditing] = useState<TierRow | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loading = tiers === null;

  async function fetchTiers(): Promise<TierRow[]> {
    const { data, error } = await supabase.from("tiers").select("*").order("sort_order");
    return error ? [] : ((data as TierRow[]) ?? []);
  }

  useEffect(() => {
    fetchTiers().then(setTiers);
  }, []);

  function openNew() {
    setEditing({ ...emptyTier, sort_order: (tiers?.length ?? 0) + 1 });
    setIsNew(true);
    setError(null);
  }

  function openEdit(tier: TierRow) {
    setEditing({ ...tier });
    setIsNew(false);
    setError(null);
  }

  async function handleDelete(id: string) {
    if (!confirm(`¿Eliminar la localidad "${id}"? Esta acción no se puede deshacer.`)) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    const res = await fetch("/api/admin/tiers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, id }),
    });
    if (res.ok) fetchTiers().then(setTiers);
    else {
      const message = await describeError(res);
      console.error("DEBUG tiers delete failed:", res.status, message);
      alert(message);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    const res = await fetch("/api/admin/tiers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, tier: editing }),
    });

    setSaving(false);
    if (res.ok) {
      setEditing(null);
      fetchTiers().then(setTiers);
    } else {
      const message = await describeError(res);
      console.error("DEBUG tiers save failed:", res.status, message);
      setError(message);
    }
  }

  const tierList = tiers ?? [];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
            Precios
          </h1>
          <p className="mt-1 text-sm font-medium text-navy-700/60">
            Crea, edita y elimina las localidades y sus precios.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={openNew}>
          Nueva localidad
        </Button>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-navy-900/8 bg-white shadow-card">
        {loading ? (
          <p className="p-6 text-sm font-medium text-navy-700/60">Cargando...</p>
        ) : tierList.length === 0 ? (
          <p className="p-6 text-sm font-medium text-navy-700/60">
            Aún no hay localidades. Crea la primera, o ejecuta la migración SQL para importar las
            existentes.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-royal-50/60 text-xs font-semibold uppercase tracking-wider text-navy-700/60">
              <tr>
                <th className="px-5 py-3">Localidad</th>
                <th className="px-5 py-3">Precio</th>
                <th className="px-5 py-3">Disponibilidad</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-900/5">
              {tierList.map((tier) => (
                <tr key={tier.id}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: tier.color }}
                      />
                      <span className="font-semibold text-navy-950">{tier.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-navy-700/70">{formatCOP(tier.price)}</td>
                  <td className="px-5 py-3 text-navy-700/70">
                    {availabilityLabels[tier.availability]}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        aria-label="Editar"
                        onClick={() => openEdit(tier)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-navy-700 hover:bg-royal-50"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        type="button"
                        aria-label="Eliminar"
                        onClick={() => handleDelete(tier.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-rose-600 hover:bg-rose-50"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-navy-900/8 bg-white p-6 shadow-soft sm:p-8">
            <h2 className="font-display text-xl font-bold tracking-tight text-navy-950">
              {isNew ? "Nueva localidad" : `Editar: ${editing.name}`}
            </h2>

            <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
              {isNew && (
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-navy-900/80">
                    ID (slug único, ej. tribuna-norte)
                  </span>
                  <input
                    required
                    value={editing.id}
                    onChange={(e) => setEditing({ ...editing, id: e.target.value })}
                    className="w-full rounded-xl border border-navy-900/12 px-4 py-2.5 text-sm"
                  />
                </label>
              )}

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-navy-900/80">Localidad</span>
                <input
                  required
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="rounded-xl border border-navy-900/12 px-4 py-2.5 text-sm"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-navy-900/80">Descripción</span>
                <input
                  required
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="rounded-xl border border-navy-900/12 px-4 py-2.5 text-sm"
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-navy-900/80">Precio (COP)</span>
                  <input
                    required
                    type="number"
                    min={0}
                    value={editing.price}
                    onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                    className="rounded-xl border border-navy-900/12 px-4 py-2.5 text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-navy-900/80">Color</span>
                  <input
                    type="color"
                    value={editing.color}
                    onChange={(e) => setEditing({ ...editing, color: e.target.value })}
                    className="h-[42px] w-full rounded-xl border border-navy-900/12 px-2 py-1"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-navy-900/80">Disponibilidad</span>
                <select
                  value={editing.availability}
                  onChange={(e) =>
                    setEditing({ ...editing, availability: e.target.value as Availability })
                  }
                  className="rounded-xl border border-navy-900/12 px-4 py-2.5 text-sm"
                >
                  <option value="alta">Alta disponibilidad</option>
                  <option value="media">Disponibilidad media</option>
                  <option value="baja">Últimas boletas</option>
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-navy-900/80">Orden</span>
                <input
                  type="number"
                  value={editing.sort_order}
                  onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
                  className="w-32 rounded-xl border border-navy-900/12 px-4 py-2.5 text-sm"
                />
              </label>

              {error && <p className="text-sm text-rose-600">{error}</p>}

              <div className="mt-2 flex gap-3">
                <Button type="submit" variant="primary" className="flex-1" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
