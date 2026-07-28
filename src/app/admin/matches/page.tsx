"use client";

import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { PencilIcon, TrashIcon } from "@/components/ui/Icons";
import { tiers } from "@/data/tiers";

type MatchStatus = "available" | "upcoming" | "sold_out";

interface MatchRow {
  id: string;
  rival: string;
  rival_initial: string;
  rival_crest: string | null;
  match_date: string;
  match_time: string;
  stadium: string;
  status: MatchStatus;
  buy_link: string | null;
  show_in_hero: boolean;
  tier_prices: Record<string, number> | null;
  sort_order: number;
}

const emptyMatch: MatchRow = {
  id: "",
  rival: "",
  rival_initial: "",
  rival_crest: "",
  match_date: "",
  match_time: "",
  stadium: "Estadio El Campín",
  status: "upcoming",
  buy_link: "",
  show_in_hero: true,
  tier_prices: null,
  sort_order: 0,
};

const statusLabels: Record<MatchStatus, string> = {
  available: "Disponible",
  upcoming: "Próximamente",
  sold_out: "Agotado",
};

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<MatchRow[] | null>(null);
  const [editing, setEditing] = useState<MatchRow | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loading = matches === null;

  async function fetchMatches(): Promise<MatchRow[]> {
    const { data, error } = await supabase.from("matches").select("*").order("sort_order");
    return error ? [] : ((data as MatchRow[]) ?? []);
  }

  useEffect(() => {
    fetchMatches().then(setMatches);
  }, []);

  function openNew() {
    setEditing({ ...emptyMatch, sort_order: (matches?.length ?? 0) + 1 });
    setIsNew(true);
    setError(null);
  }

  function openEdit(match: MatchRow) {
    setEditing({ ...match });
    setIsNew(false);
    setError(null);
  }

  async function handleDelete(id: string) {
    if (!confirm(`¿Eliminar el partido "${id}"? Esta acción no se puede deshacer.`)) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    const res = await fetch("/api/admin/matches", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, id }),
    });
    if (res.ok) fetchMatches().then(setMatches);
    else {
      const body = await res.json().catch(() => ({}));
      alert(body.error ?? "No se pudo eliminar el partido.");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    const res = await fetch("/api/admin/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, match: editing }),
    });

    setSaving(false);
    if (res.ok) {
      setEditing(null);
      fetchMatches().then(setMatches);
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "No se pudo guardar el partido.");
    }
  }

  const matchList = matches ?? [];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
            Partidos
          </h1>
          <p className="mt-1 text-sm font-medium text-navy-700/60">
            Crea, edita y elimina los partidos del calendario.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={openNew}>
          Nuevo partido
        </Button>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-navy-900/8 bg-white shadow-card">
        {loading ? (
          <p className="p-6 text-sm font-medium text-navy-700/60">Cargando...</p>
        ) : matchList.length === 0 ? (
          <p className="p-6 text-sm font-medium text-navy-700/60">
            Aún no hay partidos. Crea el primero, o ejecuta la migración SQL para importar los
            existentes.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-royal-50/60 text-xs font-semibold uppercase tracking-wider text-navy-700/60">
              <tr>
                <th className="px-5 py-3">Rival</th>
                <th className="px-5 py-3">Fecha</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3">Hero</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-900/5">
              {matchList.map((match) => (
                <tr key={match.id}>
                  <td className="px-5 py-3 font-semibold text-navy-950">{match.rival}</td>
                  <td className="px-5 py-3 text-navy-700/70">
                    {match.match_date} · {match.match_time}
                  </td>
                  <td className="px-5 py-3 text-navy-700/70">{statusLabels[match.status]}</td>
                  <td className="px-5 py-3 text-navy-700/70">{match.show_in_hero ? "Sí" : "No"}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        aria-label="Editar"
                        onClick={() => openEdit(match)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-navy-700 hover:bg-royal-50"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        type="button"
                        aria-label="Eliminar"
                        onClick={() => handleDelete(match.id)}
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
              {isNew ? "Nuevo partido" : `Editar: ${editing.rival}`}
            </h2>

            <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
              {isNew && (
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-navy-900/80">
                    ID (slug único, ej. millonarios-vs-rival)
                  </span>
                  <input
                    required
                    value={editing.id}
                    onChange={(e) => setEditing({ ...editing, id: e.target.value })}
                    className="w-full rounded-xl border border-navy-900/12 px-4 py-2.5 text-sm"
                  />
                </label>
              )}

              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-navy-900/80">Rival</span>
                  <input
                    required
                    value={editing.rival}
                    onChange={(e) => setEditing({ ...editing, rival: e.target.value })}
                    className="rounded-xl border border-navy-900/12 px-4 py-2.5 text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-navy-900/80">Inicial</span>
                  <input
                    required
                    value={editing.rival_initial}
                    onChange={(e) => setEditing({ ...editing, rival_initial: e.target.value })}
                    className="rounded-xl border border-navy-900/12 px-4 py-2.5 text-sm"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-navy-900/80">Escudo (URL)</span>
                <input
                  value={editing.rival_crest ?? ""}
                  onChange={(e) => setEditing({ ...editing, rival_crest: e.target.value })}
                  placeholder="/images/crests/rival.png"
                  className="rounded-xl border border-navy-900/12 px-4 py-2.5 text-sm"
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-navy-900/80">Fecha</span>
                  <input
                    required
                    value={editing.match_date}
                    onChange={(e) => setEditing({ ...editing, match_date: e.target.value })}
                    placeholder="Martes, 4 de agosto de 2026"
                    className="rounded-xl border border-navy-900/12 px-4 py-2.5 text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-navy-900/80">Hora</span>
                  <input
                    required
                    value={editing.match_time}
                    onChange={(e) => setEditing({ ...editing, match_time: e.target.value })}
                    placeholder="8:20 p.m."
                    className="rounded-xl border border-navy-900/12 px-4 py-2.5 text-sm"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-navy-900/80">Estadio</span>
                <input
                  required
                  value={editing.stadium}
                  onChange={(e) => setEditing({ ...editing, stadium: e.target.value })}
                  className="rounded-xl border border-navy-900/12 px-4 py-2.5 text-sm"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-navy-900/80">Estado</span>
                <select
                  value={editing.status}
                  onChange={(e) =>
                    setEditing({ ...editing, status: e.target.value as MatchStatus })
                  }
                  className="rounded-xl border border-navy-900/12 px-4 py-2.5 text-sm"
                >
                  <option value="available">Disponible</option>
                  <option value="upcoming">Próximamente</option>
                  <option value="sold_out">Agotado</option>
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-navy-900/80">
                  Enlace de compra (opcional, si vacío usa /comprar?match=id)
                </span>
                <input
                  value={editing.buy_link ?? ""}
                  onChange={(e) => setEditing({ ...editing, buy_link: e.target.value })}
                  className="rounded-xl border border-navy-900/12 px-4 py-2.5 text-sm"
                />
              </label>

              <fieldset className="rounded-xl border border-navy-900/10 p-4">
                <legend className="px-1 text-sm font-semibold text-navy-950">
                  Precios por localidad (opcional — vacío usa el precio general)
                </legend>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  {tiers.map((tier) => (
                    <label key={tier.id} className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-navy-700/70">{tier.name}</span>
                      <input
                        type="number"
                        min={0}
                        value={editing.tier_prices?.[tier.id] ?? ""}
                        placeholder={String(tier.price)}
                        onChange={(e) => {
                          const value = e.target.value;
                          setEditing({
                            ...editing,
                            tier_prices: {
                              ...(editing.tier_prices ?? {}),
                              ...(value ? { [tier.id]: Number(value) } : {}),
                            },
                          });
                        }}
                        className="rounded-lg border border-navy-900/12 px-3 py-2 text-sm"
                      />
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={editing.show_in_hero}
                  onChange={(e) => setEditing({ ...editing, show_in_hero: e.target.checked })}
                  className="h-4 w-4 rounded border-navy-900/25 text-royal-500"
                />
                <span className="text-sm font-medium text-navy-900/80">Mostrar en el Hero</span>
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
