"use client";

import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { PencilIcon, TrashIcon } from "@/components/ui/Icons";

interface VideoRow {
  id: string;
  url: string;
  active: boolean;
  sort_order: number;
}

const emptyVideo: Omit<VideoRow, "id"> = { url: "", active: true, sort_order: 0 };

export default function AdminVideosPage() {
  const [items, setItems] = useState<VideoRow[] | null>(null);
  const [editing, setEditing] = useState<Partial<VideoRow> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loading = items === null;

  async function fetchItems(): Promise<VideoRow[]> {
    const { data, error } = await supabase.from("hero_videos").select("*").order("sort_order");
    return error ? [] : ((data as VideoRow[]) ?? []);
  }

  useEffect(() => {
    fetchItems().then(setItems);
  }, []);

  async function getAccessToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este video?")) return;
    const accessToken = await getAccessToken();
    const res = await fetch("/api/admin/hero-videos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, id }),
    });
    if (res.ok) fetchItems().then(setItems);
    else {
      const body = await res.json().catch(() => ({}));
      alert(body.error ?? "No se pudo eliminar.");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError(null);
    const accessToken = await getAccessToken();

    const res = await fetch("/api/admin/hero-videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, video: editing }),
    });

    setSaving(false);
    if (res.ok) {
      setEditing(null);
      fetchItems().then(setItems);
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "No se pudo guardar el video.");
    }
  }

  async function toggleActive(item: VideoRow) {
    const accessToken = await getAccessToken();
    await fetch("/api/admin/hero-videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, video: { ...item, active: !item.active } }),
    });
    fetchItems().then(setItems);
  }

  const itemList = items ?? [];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
            Videos del Hero
          </h1>
          <p className="mt-1 text-sm font-medium text-navy-700/60">
            Administra los videos de fondo que rotan en el Hero.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditing({ ...emptyVideo, sort_order: itemList.length + 1 });
            setError(null);
          }}
        >
          Nuevo video
        </Button>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-navy-900/8 bg-white shadow-card">
        {loading ? (
          <p className="p-6 text-sm font-medium text-navy-700/60">Cargando...</p>
        ) : itemList.length === 0 ? (
          <p className="p-6 text-sm font-medium text-navy-700/60">Aún no hay videos.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-royal-50/60 text-xs font-semibold uppercase tracking-wider text-navy-700/60">
              <tr>
                <th className="px-5 py-3">URL</th>
                <th className="px-5 py-3">Orden</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-900/5">
              {itemList.map((item) => (
                <tr key={item.id}>
                  <td className="max-w-xs truncate px-5 py-3 font-medium text-navy-950">
                    {item.url}
                  </td>
                  <td className="px-5 py-3 text-navy-700/70">{item.sort_order}</td>
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => toggleActive(item)}
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        item.active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-navy-900/5 text-navy-700/50"
                      }`}
                    >
                      {item.active ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        aria-label="Editar"
                        onClick={() => {
                          setEditing(item);
                          setError(null);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-navy-700 hover:bg-royal-50"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        type="button"
                        aria-label="Eliminar"
                        onClick={() => handleDelete(item.id)}
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
          <div className="w-full max-w-md rounded-3xl border border-navy-900/8 bg-white p-6 shadow-soft sm:p-8">
            <h2 className="font-display text-xl font-bold tracking-tight text-navy-950">
              {editing.id ? "Editar video" : "Nuevo video"}
            </h2>

            <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-navy-900/80">
                  URL del video (ej. /videos/mi-video.mp4)
                </span>
                <input
                  required
                  value={editing.url ?? ""}
                  onChange={(e) => setEditing({ ...editing, url: e.target.value })}
                  className="rounded-xl border border-navy-900/12 px-4 py-2.5 text-sm"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-navy-900/80">Orden</span>
                <input
                  type="number"
                  value={editing.sort_order ?? 0}
                  onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
                  className="w-32 rounded-xl border border-navy-900/12 px-4 py-2.5 text-sm"
                />
              </label>

              <label className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={editing.active ?? true}
                  onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                  className="h-4 w-4 rounded border-navy-900/25 text-royal-500"
                />
                <span className="text-sm font-medium text-navy-900/80">Activo</span>
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
