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
import { formatCOP } from "@/lib/format";

type FemaleMatchStatus = "available" | "upcoming" | "sold_out";

interface FemaleMatchRow {
  id: string;
  home_team: string;
  home_team_initial: string;
  home_crest_url: string | null;
  away_team: string;
  away_team_initial: string;
  away_crest_url: string | null;
  match_date: string;
  match_time: string;
  stadium: string;
  image_url: string | null;
  description: string | null;
  price: number;
  status: FemaleMatchStatus;
  active: boolean;
  sort_order: number;
}

const emptyMatch: FemaleMatchRow = {
  id: "",
  home_team: "Millonarios",
  home_team_initial: "M",
  home_crest_url: "",
  away_team: "",
  away_team_initial: "",
  away_crest_url: "",
  match_date: "",
  match_time: "",
  stadium: "Estadio El Campín",
  image_url: "",
  description: "",
  price: 0,
  status: "upcoming",
  active: true,
  sort_order: 0,
};

const statusLabels: Record<FemaleMatchStatus, string> = {
  available: "Disponible",
  upcoming: "Próximamente",
  sold_out: "Agotado",
};

const statusBadge: Record<FemaleMatchStatus, "success" | "info" | "danger"> = {
  available: "success",
  upcoming: "info",
  sold_out: "danger",
};

export default function AdminFemaleMatchesPage() {
  const toast = useToast();
  const [matches, setMatches] = useState<FemaleMatchRow[] | null>(null);
  const [editing, setEditing] = useState<FemaleMatchRow | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingHomeCrest, setUploadingHomeCrest] = useState(false);
  const [uploadingAwayCrest, setUploadingAwayCrest] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<FemaleMatchRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const homeCrestInputRef = useRef<HTMLInputElement>(null);
  const awayCrestInputRef = useRef<HTMLInputElement>(null);
  const loading = matches === null;

  const table = useDataTable<FemaleMatchRow>({
    data: matches ?? [],
    searchableFields: ["home_team", "away_team", "stadium"],
    initialSort: { field: "sort_order", direction: "asc" },
  });

  async function fetchMatches(): Promise<FemaleMatchRow[]> {
    const { data, error } = await supabase.from("female_matches").select("*").order("sort_order");
    return error ? [] : ((data as FemaleMatchRow[]) ?? []);
  }

  async function getAccessToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  }

  async function handleCrestUpload(file: File, side: "home" | "away") {
    const setUploading = side === "home" ? setUploadingHomeCrest : setUploadingAwayCrest;
    setUploading(true);
    setError(null);
    const accessToken = await getAccessToken();
    const formData = new FormData();
    formData.append("accessToken", accessToken ?? "");
    formData.append("folder", "femenino");
    formData.append("file", file);

    const res = await fetch("/api/admin/logos/upload", { method: "POST", body: formData });
    const body = await res.json().catch(() => ({}));
    setUploading(false);

    if (res.ok) {
      const field = side === "home" ? "home_crest_url" : "away_crest_url";
      setEditing((prev) => (prev ? { ...prev, [field]: body.url } : prev));
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

  function openEdit(match: FemaleMatchRow) {
    setEditing({ ...match });
    setIsNew(false);
    setError(null);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    const accessToken = await getAccessToken();
    const res = await fetch("/api/admin/female-matches", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, id: pendingDelete.id }),
    });
    setDeleting(false);
    if (res.ok) {
      fetchMatches().then(setMatches);
      toast.success("Partido femenino eliminado.");
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

    const accessToken = await getAccessToken();
    const res = await fetch("/api/admin/female-matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, match: editing }),
    });

    setSaving(false);
    if (res.ok) {
      setEditing(null);
      fetchMatches().then(setMatches);
      toast.success("Partido femenino guardado correctamente.");
    } else {
      const body = await res.json().catch(() => ({}));
      const message = body.error ?? "No se pudo guardar el partido.";
      setError(message);
      toast.error(message);
    }
  }

  const columns: DataTableColumn<FemaleMatchRow>[] = [
    {
      key: "home_team",
      header: "Partido",
      sortable: true,
      render: (m) => (
        <span className="font-semibold text-admin-text">
          {m.home_team} vs {m.away_team}
        </span>
      ),
    },
    {
      key: "match_date",
      header: "Fecha",
      render: (m) => `${m.match_date} · ${m.match_time}`,
    },
    {
      key: "price",
      header: "Precio",
      sortable: true,
      render: (m) => formatCOP(m.price),
    },
    {
      key: "status",
      header: "Estado",
      sortable: true,
      render: (m) => <Badge variant={statusBadge[m.status]}>{statusLabels[m.status]}</Badge>,
    },
    {
      key: "active",
      header: "Activo",
      render: (m) => (m.active ? "Sí" : "No"),
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
            Partidos femeninos
          </h1>
          <p className="mt-1 text-sm font-medium text-admin-text-muted">
            Gestión independiente de los partidos masculinos — cada uno con su propio precio.
            Cuando estén activos aparecen en el sitio público junto a los demás partidos, marcados
            como fútbol femenino.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={openNew} className="self-start sm:self-auto">
          Nuevo partido femenino
        </Button>
      </div>

      <div className="mt-6">
        <DataTable
          table={table}
          keyField="id"
          loading={loading}
          emptyMessage="Aún no hay partidos femeninos. Crea el primero."
          searchPlaceholder="Buscar por equipo o estadio..."
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
        title={isNew ? "Nuevo partido femenino" : `Editar: ${editing?.home_team ?? ""} vs ${editing?.away_team ?? ""}`}
        maxWidth="lg"
      >
        {editing && (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {isNew && (
              <Input
                label="ID (slug único, ej. millonarios-vs-nacional-femenino)"
                required
                value={editing.id}
                onChange={(e) => setEditing({ ...editing, id: e.target.value })}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Equipo local"
                required
                value={editing.home_team}
                onChange={(e) => setEditing({ ...editing, home_team: e.target.value })}
              />
              <Input
                label="Inicial (local)"
                required
                value={editing.home_team_initial}
                onChange={(e) => setEditing({ ...editing, home_team_initial: e.target.value })}
              />
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-admin-text/80">Escudo local (opcional)</span>
              <div className="flex gap-2">
                <Input
                  value={editing.home_crest_url ?? ""}
                  onChange={(e) => setEditing({ ...editing, home_crest_url: e.target.value })}
                  placeholder="/images/crests/millonarios.png"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={<UploadIcon className="h-4 w-4" />}
                  disabled={uploadingHomeCrest}
                  onClick={() => homeCrestInputRef.current?.click()}
                >
                  {uploadingHomeCrest ? "Subiendo..." : "Subir"}
                </Button>
                <input
                  ref={homeCrestInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCrestUpload(file, "home");
                  }}
                />
              </div>
            </label>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Equipo visitante"
                required
                value={editing.away_team}
                onChange={(e) => setEditing({ ...editing, away_team: e.target.value })}
              />
              <Input
                label="Inicial (visitante)"
                required
                value={editing.away_team_initial}
                onChange={(e) => setEditing({ ...editing, away_team_initial: e.target.value })}
              />
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-admin-text/80">Escudo visitante (opcional)</span>
              <div className="flex gap-2">
                <Input
                  value={editing.away_crest_url ?? ""}
                  onChange={(e) => setEditing({ ...editing, away_crest_url: e.target.value })}
                  placeholder="/images/crests/rival.png"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={<UploadIcon className="h-4 w-4" />}
                  disabled={uploadingAwayCrest}
                  onClick={() => awayCrestInputRef.current?.click()}
                >
                  {uploadingAwayCrest ? "Subiendo..." : "Subir"}
                </Button>
                <input
                  ref={awayCrestInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCrestUpload(file, "away");
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

            <Input
              label="Precio por boleta (COP)"
              type="number"
              min={0}
              required
              value={editing.price}
              onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
            />

            <Select
              label="Estado"
              value={editing.status}
              onChange={(e) => setEditing({ ...editing, status: e.target.value as FemaleMatchStatus })}
            >
              <option value="available">Disponible</option>
              <option value="upcoming">Próximamente</option>
              <option value="sold_out">Agotado</option>
            </Select>

            <Checkbox
              label="Activo (visible en el sitio público)"
              checked={editing.active}
              onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
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
        title="Eliminar partido femenino"
        description={
          pendingDelete
            ? `¿Eliminar "${pendingDelete.home_team} vs ${pendingDelete.away_team}"? Esta acción no se puede deshacer.`
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
