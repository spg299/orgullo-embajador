"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { PencilIcon, TrashIcon, UploadIcon } from "@/components/ui/Icons";
import { DataTable, type DataTableColumn } from "@/components/ui/admin/DataTable";
import { useDataTable } from "@/components/ui/admin/useDataTable";
import { Dialog } from "@/components/ui/admin/Dialog";
import { ConfirmDialog } from "@/components/ui/admin/ConfirmDialog";
import { Input } from "@/components/ui/admin/Input";
import { Textarea } from "@/components/ui/admin/Textarea";
import { Select } from "@/components/ui/admin/Select";
import { Checkbox } from "@/components/ui/admin/Checkbox";
import { Badge } from "@/components/ui/admin/Badge";
import { useToast } from "@/components/ui/admin/Toast";

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
  sort_order: number;
  description: string | null;
  image_url: string | null;
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
  sort_order: 0,
  description: "",
  image_url: "",
};

const statusLabels: Record<MatchStatus, string> = {
  available: "Disponible",
  upcoming: "Próximamente",
  sold_out: "Agotado",
};

const statusBadge: Record<MatchStatus, "success" | "info" | "danger"> = {
  available: "success",
  upcoming: "info",
  sold_out: "danger",
};

export default function AdminMatchesPage() {
  const toast = useToast();
  const [matches, setMatches] = useState<MatchRow[] | null>(null);
  const [editing, setEditing] = useState<MatchRow | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingCrest, setUploadingCrest] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<MatchRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const crestInputRef = useRef<HTMLInputElement>(null);
  const loading = matches === null;

  const table = useDataTable<MatchRow>({
    data: matches ?? [],
    searchableFields: ["rival", "stadium"],
    initialSort: { field: "sort_order", direction: "asc" },
  });

  async function fetchMatches(): Promise<MatchRow[]> {
    const { data, error } = await supabase.from("matches").select("*").order("sort_order");
    return error ? [] : ((data as MatchRow[]) ?? []);
  }

  async function getAccessToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  }

  async function handleCrestUpload(file: File) {
    setUploadingCrest(true);
    setError(null);
    const accessToken = await getAccessToken();
    const formData = new FormData();
    formData.append("accessToken", accessToken ?? "");
    formData.append("folder", "rivales");
    formData.append("file", file);

    const res = await fetch("/api/admin/logos/upload", { method: "POST", body: formData });
    const body = await res.json().catch(() => ({}));
    setUploadingCrest(false);

    if (res.ok) {
      setEditing((prev) => (prev ? { ...prev, rival_crest: body.url } : prev));
    } else {
      setError(body.error ?? "No se pudo subir el escudo.");
    }
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

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    const res = await fetch("/api/admin/matches", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, id: pendingDelete.id }),
    });
    setDeleting(false);
    if (res.ok) {
      fetchMatches().then(setMatches);
      toast.success("Partido eliminado.");
    } else {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "No se pudo eliminar el partido.");
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

    const res = await fetch("/api/admin/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, match: editing }),
    });

    setSaving(false);
    if (res.ok) {
      setEditing(null);
      fetchMatches().then(setMatches);
      toast.success("Partido guardado correctamente.");
    } else {
      const body = await res.json().catch(() => ({}));
      const message = body.error ?? "No se pudo guardar el partido.";
      setError(message);
      toast.error(message);
    }
  }

  const columns: DataTableColumn<MatchRow>[] = [
    {
      key: "rival",
      header: "Rival",
      sortable: true,
      render: (m) => <span className="font-semibold text-admin-text">{m.rival}</span>,
    },
    {
      key: "match_date",
      header: "Fecha",
      render: (m) => `${m.match_date} · ${m.match_time}`,
    },
    {
      key: "status",
      header: "Estado",
      sortable: true,
      render: (m) => <Badge variant={statusBadge[m.status]}>{statusLabels[m.status]}</Badge>,
    },
    {
      key: "show_in_hero",
      header: "Hero",
      render: (m) => (m.show_in_hero ? "Sí" : "No"),
    },
    {
      key: "sort_order",
      header: "Orden",
      sortable: true,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-admin-text">
            Partidos
          </h1>
          <p className="mt-1 text-sm font-medium text-admin-text-muted">
            Crea, edita y elimina los partidos del calendario.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={openNew} className="self-start sm:self-auto">
          Nuevo partido
        </Button>
      </div>

      <div className="mt-6">
        <DataTable
          table={table}
          keyField="id"
          loading={loading}
          emptyMessage="Aún no hay partidos. Crea el primero, o ejecuta la migración SQL para importar los existentes."
          searchPlaceholder="Buscar por rival o estadio..."
          columns={columns}
          renderActions={(match) => (
            <>
              <button
                type="button"
                aria-label="Editar"
                onClick={() => openEdit(match)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-admin-text-muted transition-colors hover:bg-admin-bg hover:text-admin-text"
              >
                <PencilIcon />
              </button>
              <button
                type="button"
                aria-label="Eliminar"
                onClick={() => setPendingDelete(match)}
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
        title={isNew ? "Nuevo partido" : `Editar: ${editing?.rival ?? ""}`}
        maxWidth="lg"
      >
        {editing && (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {isNew && (
              <Input
                label="ID (slug único, ej. millonarios-vs-rival)"
                required
                value={editing.id}
                onChange={(e) => setEditing({ ...editing, id: e.target.value })}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Rival"
                required
                value={editing.rival}
                onChange={(e) => setEditing({ ...editing, rival: e.target.value })}
              />
              <Input
                label="Inicial"
                required
                value={editing.rival_initial}
                onChange={(e) => setEditing({ ...editing, rival_initial: e.target.value })}
              />
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-admin-text/80">Escudo del rival</span>
              <div className="flex gap-2">
                <Input
                  value={editing.rival_crest ?? ""}
                  onChange={(e) => setEditing({ ...editing, rival_crest: e.target.value })}
                  placeholder="/images/crests/rival.png"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={<UploadIcon className="h-4 w-4" />}
                  disabled={uploadingCrest}
                  onClick={() => crestInputRef.current?.click()}
                >
                  {uploadingCrest ? "Subiendo..." : "Subir"}
                </Button>
                <input
                  ref={crestInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCrestUpload(file);
                  }}
                />
              </div>
            </label>

            <Textarea
              label="Descripción (opcional)"
              rows={3}
              value={editing.description ?? ""}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              placeholder="Texto editorial sobre el partido, si quieres agregar contexto."
            />

            <Input
              label="Imagen del partido (URL, opcional)"
              value={editing.image_url ?? ""}
              onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
              placeholder="https://..."
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Fecha"
                required
                value={editing.match_date}
                onChange={(e) => setEditing({ ...editing, match_date: e.target.value })}
                placeholder="Martes, 4 de agosto de 2026"
              />
              <Input
                label="Hora"
                required
                value={editing.match_time}
                onChange={(e) => setEditing({ ...editing, match_time: e.target.value })}
                placeholder="8:20 p.m."
              />
            </div>

            <Input
              label="Estadio"
              required
              value={editing.stadium}
              onChange={(e) => setEditing({ ...editing, stadium: e.target.value })}
            />

            <Select
              label="Estado"
              value={editing.status}
              onChange={(e) => setEditing({ ...editing, status: e.target.value as MatchStatus })}
            >
              <option value="available">Disponible</option>
              <option value="upcoming">Próximamente</option>
              <option value="sold_out">Agotado</option>
            </Select>

            <Input
              label="Enlace de compra (opcional, si vacío usa /comprar?match=id)"
              value={editing.buy_link ?? ""}
              onChange={(e) => setEditing({ ...editing, buy_link: e.target.value })}
            />

            <Checkbox
              label="Mostrar en el Hero"
              checked={editing.show_in_hero}
              onChange={(e) => setEditing({ ...editing, show_in_hero: e.target.checked })}
            />

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
        title="Eliminar partido"
        description={
          pendingDelete
            ? `¿Eliminar el partido "${pendingDelete.rival}"? Esta acción no se puede deshacer.`
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
