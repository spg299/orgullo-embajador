"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { PencilIcon, TrashIcon, UploadIcon, SearchIcon, ChatIcon } from "@/components/ui/Icons";
import { useDataTable } from "@/components/ui/admin/useDataTable";
import { Dialog } from "@/components/ui/admin/Dialog";
import { ConfirmDialog } from "@/components/ui/admin/ConfirmDialog";
import { Input } from "@/components/ui/admin/Input";
import { Textarea } from "@/components/ui/admin/Textarea";
import { Checkbox } from "@/components/ui/admin/Checkbox";
import { Badge } from "@/components/ui/admin/Badge";
import { SkeletonCard } from "@/components/ui/admin/Skeleton";
import { useToast } from "@/components/ui/admin/Toast";
import StarRating from "@/components/ui/StarRating";

interface TestimonialRow {
  id: string;
  name: string;
  message: string;
  image_url: string | null;
  screenshot_url: string | null;
  rating: number;
  active: boolean;
  sort_order: number;
}

type UploadField = "image_url" | "screenshot_url";

const emptyTestimonial: Omit<TestimonialRow, "id"> = {
  name: "",
  message: "",
  image_url: "",
  screenshot_url: "",
  rating: 5,
  active: true,
  sort_order: 0,
};

export default function AdminTestimonialsPage() {
  const toast = useToast();
  const [items, setItems] = useState<TestimonialRow[] | null>(null);
  const [editing, setEditing] = useState<Partial<TestimonialRow> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<UploadField | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TestimonialRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [viewingScreenshot, setViewingScreenshot] = useState<TestimonialRow | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const loading = items === null;

  const table = useDataTable<TestimonialRow>({
    data: items ?? [],
    searchableFields: ["name", "message"],
    initialSort: { field: "sort_order", direction: "asc" },
  });

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

  async function handleUpload(file: File, field: UploadField) {
    setUploadingField(field);
    setError(null);
    const accessToken = await getAccessToken();
    const formData = new FormData();
    formData.append("accessToken", accessToken ?? "");
    formData.append("file", file);

    const res = await fetch("/api/admin/testimonials/upload", { method: "POST", body: formData });
    const body = await res.json().catch(() => ({}));
    setUploadingField(null);

    if (res.ok) {
      setEditing((prev) => (prev ? { ...prev, [field]: body.url } : prev));
    } else {
      setError(body.error ?? "No se pudo subir la imagen.");
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    const accessToken = await getAccessToken();
    const res = await fetch("/api/admin/testimonials", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, id: pendingDelete.id }),
    });
    setDeleting(false);
    if (res.ok) {
      fetchItems().then(setItems);
      toast.success("Testimonio eliminado.");
    } else {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "No se pudo eliminar.");
    }
    setPendingDelete(null);
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
      toast.success("Testimonio guardado correctamente.");
    } else {
      const body = await res.json().catch(() => ({}));
      const message = body.error ?? "No se pudo guardar el testimonio.";
      setError(message);
      toast.error(message);
    }
  }

  async function toggleActive(item: TestimonialRow) {
    const accessToken = await getAccessToken();
    const res = await fetch("/api/admin/testimonials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, testimonial: { ...item, active: !item.active } }),
    });
    fetchItems().then(setItems);
    if (res.ok) toast.success(item.active ? "Testimonio desactivado." : "Testimonio activado.");
  }

  const itemList = table.filteredData;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-admin-text">
            Testimonios
          </h1>
          <p className="mt-1 text-sm font-medium text-admin-text-muted">
            Agrega, edita, elimina y activa/desactiva testimonios de hinchas.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          className="self-start sm:self-auto"
          onClick={() => {
            setEditing({ ...emptyTestimonial, sort_order: (items?.length ?? 0) + 1 });
            setError(null);
          }}
        >
          Nuevo testimonio
        </Button>
      </div>

      <div className="relative mt-6 max-w-xs">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-text-muted" />
        <input
          value={table.search}
          onChange={(e) => table.setSearch(e.target.value)}
          placeholder="Buscar por nombre o mensaje..."
          className="w-full rounded-admin-md border border-admin-border bg-admin-surface py-2 pl-9 pr-3 text-sm text-admin-text placeholder:text-admin-text-muted/60 focus:border-royal-400 focus:outline-none focus:ring-2 focus:ring-royal-400/40"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : itemList.length === 0 ? (
          <p className="text-sm font-medium text-admin-text-muted">Aún no hay testimonios.</p>
        ) : (
          itemList.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 rounded-admin-xl border border-admin-border bg-admin-surface p-5 shadow-admin-xs"
            >
              {item.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="h-14 w-14 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-royal-100 font-display font-bold text-royal-500 dark:bg-royal-400/15">
                  {item.name.slice(0, 1)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display font-bold text-admin-text">{item.name}</p>
                  <Badge variant={item.active ? "success" : "neutral"}>
                    {item.active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                <StarRating value={item.rating} size="h-3.5 w-3.5" className="mt-1" />
                <p className="mt-1 text-sm text-admin-text-muted">{item.message}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
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
                    className="flex h-7 w-7 items-center justify-center rounded-full text-admin-text-muted transition-colors hover:bg-admin-bg hover:text-admin-text"
                  >
                    <PencilIcon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Eliminar"
                    onClick={() => setPendingDelete(item)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>

                  <span className="ml-auto">
                    {item.screenshot_url ? (
                      <button
                        type="button"
                        onClick={() => setViewingScreenshot(item)}
                        className="flex items-center gap-1.5 rounded-full bg-royal-50 px-3 py-1.5 text-xs font-semibold text-royal-600 transition-colors hover:bg-royal-100 dark:bg-royal-400/10 dark:hover:bg-royal-400/20"
                      >
                        <ChatIcon className="h-3.5 w-3.5" />
                        Ver conversación
                      </button>
                    ) : (
                      <Badge variant="neutral">Sin captura</Badge>
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Editar testimonio" : "Nuevo testimonio"}
      >
        {editing && (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex items-center gap-4">
              {editing.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={editing.image_url} alt="" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-royal-50 dark:bg-royal-400/10" />
              )}
              <div>
                <p className="mb-1.5 text-sm font-medium text-admin-text/80">Foto de perfil</p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={<UploadIcon className="h-4 w-4" />}
                  disabled={uploadingField !== null}
                  onClick={() => avatarInputRef.current?.click()}
                >
                  {uploadingField === "image_url" ? "Subiendo..." : "Subir foto"}
                </Button>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file, "image_url");
                }}
              />
            </div>

            <div className="flex items-center gap-4 rounded-admin-md border border-dashed border-admin-border p-4">
              {editing.screenshot_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={editing.screenshot_url}
                  alt=""
                  className="h-16 w-16 rounded-admin-sm object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-admin-sm bg-admin-bg text-admin-text-muted">
                  <ChatIcon className="h-6 w-6" />
                </div>
              )}
              <div>
                <p className="mb-1.5 text-sm font-medium text-admin-text/80">
                  Captura de la conversación
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={<UploadIcon className="h-4 w-4" />}
                  disabled={uploadingField !== null}
                  onClick={() => screenshotInputRef.current?.click()}
                >
                  {uploadingField === "screenshot_url" ? "Subiendo..." : "Subir captura"}
                </Button>
              </div>
              <input
                ref={screenshotInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file, "screenshot_url");
                }}
              />
            </div>

            <Input
              label="Nombre"
              required
              value={editing.name ?? ""}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />

            <Textarea
              label="Testimonio"
              required
              rows={4}
              value={editing.message ?? ""}
              onChange={(e) => setEditing({ ...editing, message: e.target.value })}
            />

            <div>
              <p className="mb-1.5 text-sm font-medium text-admin-text/80">Calificación</p>
              <StarRating
                value={editing.rating ?? 5}
                onChange={(rating) => setEditing({ ...editing, rating })}
                size="h-6 w-6"
              />
            </div>

            <Checkbox
              label="Activo (visible)"
              checked={editing.active ?? true}
              onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
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

      <Dialog
        open={viewingScreenshot !== null}
        onClose={() => setViewingScreenshot(null)}
        title={viewingScreenshot ? `Conversación con ${viewingScreenshot.name}` : ""}
        maxWidth="sm"
      >
        {viewingScreenshot?.screenshot_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={viewingScreenshot.screenshot_url}
            alt={`Conversación con ${viewingScreenshot.name}`}
            className="max-h-[70vh] w-full rounded-admin-md object-contain"
          />
        )}
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Eliminar testimonio"
        description="¿Eliminar este testimonio? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
