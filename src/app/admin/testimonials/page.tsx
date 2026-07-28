"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { PencilIcon, TrashIcon, UploadIcon } from "@/components/ui/Icons";

interface TestimonialRow {
  id: string;
  name: string;
  message: string;
  image_url: string | null;
  active: boolean;
  sort_order: number;
}

const emptyTestimonial: Omit<TestimonialRow, "id"> = {
  name: "",
  message: "",
  image_url: "",
  active: true,
  sort_order: 0,
};

export default function AdminTestimonialsPage() {
  const [items, setItems] = useState<TestimonialRow[] | null>(null);
  const [editing, setEditing] = useState<Partial<TestimonialRow> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loading = items === null;

  async function fetchItems(): Promise<TestimonialRow[]> {
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("sort_order");
    return error ? [] : ((data as TestimonialRow[]) ?? []);
  }

  useEffect(() => {
    fetchItems().then(setItems);
  }, []);

  async function getAccessToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  }

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    const accessToken = await getAccessToken();
    const formData = new FormData();
    formData.append("accessToken", accessToken ?? "");
    formData.append("file", file);

    const res = await fetch("/api/admin/testimonials/upload", { method: "POST", body: formData });
    const body = await res.json().catch(() => ({}));
    setUploading(false);

    if (res.ok) {
      setEditing((prev) => (prev ? { ...prev, image_url: body.url } : prev));
    } else {
      setError(body.error ?? "No se pudo subir la imagen.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este testimonio?")) return;
    const accessToken = await getAccessToken();
    const res = await fetch("/api/admin/testimonials", {
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

    const res = await fetch("/api/admin/testimonials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, testimonial: editing }),
    });

    setSaving(false);
    if (res.ok) {
      setEditing(null);
      fetchItems().then(setItems);
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "No se pudo guardar el testimonio.");
    }
  }

  async function toggleActive(item: TestimonialRow) {
    const accessToken = await getAccessToken();
    await fetch("/api/admin/testimonials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, testimonial: { ...item, active: !item.active } }),
    });
    fetchItems().then(setItems);
  }

  const itemList = items ?? [];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
            Testimonios
          </h1>
          <p className="mt-1 text-sm font-medium text-navy-700/60">
            Agrega, edita, elimina y activa/desactiva testimonios de hinchas.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditing({ ...emptyTestimonial, sort_order: itemList.length + 1 });
            setError(null);
          }}
        >
          Nuevo testimonio
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {loading ? (
          <p className="text-sm font-medium text-navy-700/60">Cargando...</p>
        ) : itemList.length === 0 ? (
          <p className="text-sm font-medium text-navy-700/60">Aún no hay testimonios.</p>
        ) : (
          itemList.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 rounded-3xl border border-navy-900/8 bg-white p-5 shadow-card"
            >
              {item.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="h-14 w-14 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-royal-100 font-display font-bold text-royal-500">
                  {item.name.slice(0, 1)}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display font-bold text-navy-950">{item.name}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      item.active ? "bg-emerald-100 text-emerald-700" : "bg-navy-900/5 text-navy-700/50"
                    }`}
                  >
                    {item.active ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-navy-700/70">{item.message}</p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleActive(item)}
                    className="text-xs font-semibold text-royal-500 hover:text-royal-600"
                  >
                    {item.active ? "Desactivar" : "Activar"}
                  </button>
                  <button
                    type="button"
                    aria-label="Editar"
                    onClick={() => {
                      setEditing(item);
                      setError(null);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-navy-700 hover:bg-royal-50"
                  >
                    <PencilIcon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Eliminar"
                    onClick={() => handleDelete(item.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-rose-600 hover:bg-rose-50"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-navy-900/8 bg-white p-6 shadow-soft sm:p-8">
            <h2 className="font-display text-xl font-bold tracking-tight text-navy-950">
              {editing.id ? "Editar testimonio" : "Nuevo testimonio"}
            </h2>

            <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="flex items-center gap-4">
                {editing.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={editing.image_url}
                    alt=""
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-royal-50" />
                )}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={<UploadIcon className="h-4 w-4" />}
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? "Subiendo..." : "Subir imagen"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                  }}
                />
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-navy-900/80">Nombre</span>
                <input
                  required
                  value={editing.name ?? ""}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="rounded-xl border border-navy-900/12 px-4 py-2.5 text-sm"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-navy-900/80">Testimonio</span>
                <textarea
                  required
                  rows={4}
                  value={editing.message ?? ""}
                  onChange={(e) => setEditing({ ...editing, message: e.target.value })}
                  className="rounded-xl border border-navy-900/12 px-4 py-2.5 text-sm"
                />
              </label>

              <label className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={editing.active ?? true}
                  onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                  className="h-4 w-4 rounded border-navy-900/25 text-royal-500"
                />
                <span className="text-sm font-medium text-navy-900/80">Activo (visible)</span>
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
