"use client";

import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { PencilIcon, TrashIcon } from "@/components/ui/Icons";
import { siteSettings as defaultSiteSettings } from "@/data/siteSettings";
import { DataTable, type DataTableColumn } from "@/components/ui/admin/DataTable";
import { useDataTable } from "@/components/ui/admin/useDataTable";
import { Dialog } from "@/components/ui/admin/Dialog";
import { ConfirmDialog } from "@/components/ui/admin/ConfirmDialog";
import { Input } from "@/components/ui/admin/Input";
import { Textarea } from "@/components/ui/admin/Textarea";
import { Checkbox } from "@/components/ui/admin/Checkbox";
import { Badge } from "@/components/ui/admin/Badge";
import { useToast } from "@/components/ui/admin/Toast";

type MatchStatus = "available" | "upcoming" | "sold_out";

interface MatchRow {
  id: string;
  rival: string;
  match_date: string;
  match_time: string;
  status: MatchStatus;
  show_in_hero: boolean;
}

interface VideoRow {
  id: string;
  url: string;
  active: boolean;
  sort_order: number;
}

const emptyVideo: Omit<VideoRow, "id"> = { url: "", active: true, sort_order: 0 };

export default function AdminHeroPage() {
  const toast = useToast();
  const [matches, setMatches] = useState<MatchRow[] | null>(null);
  const [videos, setVideos] = useState<VideoRow[] | null>(null);
  const [editingVideo, setEditingVideo] = useState<Partial<VideoRow> | null>(null);
  const [savingVideo, setSavingVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [pendingVideoDelete, setPendingVideoDelete] = useState<VideoRow | null>(null);
  const [deletingVideo, setDeletingVideo] = useState(false);

  const [content, setContent] = useState({
    hero_headline: defaultSiteSettings.hero_headline,
    hero_subtext: defaultSiteSettings.hero_subtext,
    hero_button_label: defaultSiteSettings.hero_button_label,
  });
  const [savingContent, setSavingContent] = useState(false);
  const [contentSaved, setContentSaved] = useState(false);

  const matchesLoading = matches === null;
  const videosLoading = videos === null;

  const videoTable = useDataTable<VideoRow>({
    data: videos ?? [],
    searchableFields: ["url"],
    initialSort: { field: "sort_order", direction: "asc" },
  });

  async function fetchMatches(): Promise<MatchRow[]> {
    const { data, error } = await supabase
      .from("matches")
      .select("id, rival, match_date, match_time, status, show_in_hero")
      .order("sort_order");
    return error ? [] : ((data as MatchRow[]) ?? []);
  }

  async function fetchVideos(): Promise<VideoRow[]> {
    const { data, error } = await supabase.from("hero_videos").select("*").order("sort_order");
    return error ? [] : ((data as VideoRow[]) ?? []);
  }

  async function fetchContent(): Promise<typeof content> {
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["hero_headline", "hero_subtext", "hero_button_label"]);
    if (error || !data) return content;
    const merged = { ...content };
    for (const row of data as { key: string; value: string }[]) {
      if (row.key in merged) (merged as Record<string, string>)[row.key] = row.value;
    }
    return merged;
  }

  useEffect(() => {
    fetchMatches().then(setMatches);
    fetchVideos().then(setVideos);
    fetchContent().then(setContent);
  }, []);

  async function getAccessToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  }

  async function toggleMatch(match: MatchRow) {
    const accessToken = await getAccessToken();
    await fetch("/api/admin/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accessToken,
        match: { ...match, show_in_hero: !match.show_in_hero },
      }),
    });
    fetchMatches().then(setMatches);
  }

  async function confirmVideoDelete() {
    if (!pendingVideoDelete) return;
    setDeletingVideo(true);
    const accessToken = await getAccessToken();
    const res = await fetch("/api/admin/hero-videos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, id: pendingVideoDelete.id }),
    });
    setDeletingVideo(false);
    if (res.ok) {
      fetchVideos().then(setVideos);
      toast.success("Video eliminado.");
    } else {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "No se pudo eliminar.");
    }
    setPendingVideoDelete(null);
  }

  async function handleVideoSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editingVideo) return;
    setSavingVideo(true);
    setVideoError(null);
    const accessToken = await getAccessToken();

    const res = await fetch("/api/admin/hero-videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, video: editingVideo }),
    });

    setSavingVideo(false);
    if (res.ok) {
      setEditingVideo(null);
      fetchVideos().then(setVideos);
      toast.success("Video guardado correctamente.");
    } else {
      const body = await res.json().catch(() => ({}));
      const message = body.error ?? "No se pudo guardar el video.";
      setVideoError(message);
      toast.error(message);
    }
  }

  async function toggleVideoActive(item: VideoRow) {
    const accessToken = await getAccessToken();
    await fetch("/api/admin/hero-videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, video: { ...item, active: !item.active } }),
    });
    fetchVideos().then(setVideos);
  }

  async function handleContentSubmit(e: FormEvent) {
    e.preventDefault();
    setSavingContent(true);
    setContentSaved(false);
    const accessToken = await getAccessToken();

    const res = await fetch("/api/admin/site-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, settings: content }),
    });

    setSavingContent(false);
    if (res.ok) {
      setContentSaved(true);
      toast.success("Contenido del Hero guardado.");
      setTimeout(() => setContentSaved(false), 2500);
    } else {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "No se pudo guardar el contenido del Hero.");
    }
  }

  const matchList = matches ?? [];
  const selectedCount = matchList.filter((m) => m.show_in_hero && m.status !== "sold_out").length;

  const videoColumns: DataTableColumn<VideoRow>[] = [
    {
      key: "url",
      header: "URL",
      render: (item) => <span className="block max-w-xs truncate font-medium text-admin-text">{item.url}</span>,
    },
    { key: "sort_order", header: "Orden", sortable: true },
    {
      key: "active",
      header: "Estado",
      sortable: true,
      render: (item) => (
        <button type="button" onClick={() => toggleVideoActive(item)}>
          <Badge variant={item.active ? "success" : "neutral"}>{item.active ? "Activo" : "Inactivo"}</Badge>
        </button>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-admin-text">Hero</h1>
      <p className="mt-1 text-sm font-medium text-admin-text-muted">
        Administra los videos e imágenes de fondo, el texto y el botón del Hero, y qué partidos
        aparecen en el carrusel.
      </p>

      {/* Texto y botón */}
      <div className="mt-8 rounded-admin-xl border border-admin-border bg-admin-surface p-6 shadow-admin-xs sm:p-8">
        <h2 className="font-display text-lg font-bold tracking-tight text-admin-text">
          Texto y botón
        </h2>
        <form className="mt-4 flex flex-col gap-4" onSubmit={handleContentSubmit}>
          <Input
            label="Título"
            value={content.hero_headline}
            onChange={(e) => setContent({ ...content, hero_headline: e.target.value })}
          />
          <Textarea
            label="Subtítulo"
            rows={2}
            value={content.hero_subtext}
            onChange={(e) => setContent({ ...content, hero_subtext: e.target.value })}
          />
          <Input
            label="Texto del botón (cuando hay boletas disponibles)"
            value={content.hero_button_label}
            onChange={(e) => setContent({ ...content, hero_button_label: e.target.value })}
            className="w-64"
          />
          <div className="flex items-center gap-3">
            <Button type="submit" variant="primary" size="sm" disabled={savingContent}>
              {savingContent ? "Guardando..." : "Guardar cambios"}
            </Button>
            {contentSaved && (
              <span className="text-sm font-medium text-emerald-600">¡Guardado!</span>
            )}
          </div>
        </form>
      </div>

      {/* Videos */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold tracking-tight text-admin-text">
            Videos e imágenes de fondo
          </h2>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingVideo({ ...emptyVideo, sort_order: (videos?.length ?? 0) + 1 });
              setVideoError(null);
            }}
          >
            Nuevo video
          </Button>
        </div>

        <div className="mt-4">
          <DataTable
            table={videoTable}
            keyField="id"
            loading={videosLoading}
            emptyMessage="Aún no hay videos."
            searchPlaceholder="Buscar por URL..."
            columns={videoColumns}
            renderActions={(item) => (
              <>
                <button
                  type="button"
                  aria-label="Editar"
                  onClick={() => {
                    setEditingVideo(item);
                    setVideoError(null);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-admin-text-muted transition-colors hover:bg-admin-bg hover:text-admin-text"
                >
                  <PencilIcon />
                </button>
                <button
                  type="button"
                  aria-label="Eliminar"
                  onClick={() => setPendingVideoDelete(item)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10"
                >
                  <TrashIcon />
                </button>
              </>
            )}
          />
        </div>
      </div>

      {/* Partidos en el carrusel */}
      <div className="mt-8">
        <h2 className="font-display text-lg font-bold tracking-tight text-admin-text">
          Partidos en el carrusel
        </h2>
        <p className="mt-1 text-sm font-medium text-admin-text-muted">
          El sitio muestra hasta 3, en orden de fecha, excluyendo los agotados. Actualmente hay{" "}
          {selectedCount} partido(s) elegible(s).
        </p>

        <div className="mt-4 overflow-hidden rounded-admin-xl border border-admin-border bg-admin-surface shadow-admin-xs">
          {matchesLoading ? (
            <p className="p-6 text-sm font-medium text-admin-text-muted">Cargando...</p>
          ) : (
            <ul className="divide-y divide-admin-border">
              {matchList.map((match) => (
                <li key={match.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <p className="font-semibold text-admin-text">Millonarios vs {match.rival}</p>
                    <p className="text-sm text-admin-text-muted">
                      {match.match_date} · {match.match_time}
                      {match.status === "sold_out" && " · Agotado (no se muestra en el Hero)"}
                    </p>
                  </div>
                  <Checkbox
                    label="Mostrar"
                    checked={match.show_in_hero}
                    disabled={match.status === "sold_out"}
                    onChange={() => toggleMatch(match)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Dialog
        open={editingVideo !== null}
        onClose={() => setEditingVideo(null)}
        title={editingVideo?.id ? "Editar video" : "Nuevo video"}
      >
        {editingVideo && (
          <form className="flex flex-col gap-4" onSubmit={handleVideoSubmit}>
            <Input
              label="URL del video o imagen (ej. /videos/mi-video.mp4 o https://.../foto.jpg)"
              required
              value={editingVideo.url ?? ""}
              onChange={(e) => setEditingVideo({ ...editingVideo, url: e.target.value })}
            />

            <Input
              label="Orden"
              type="number"
              value={editingVideo.sort_order ?? 0}
              onChange={(e) => setEditingVideo({ ...editingVideo, sort_order: Number(e.target.value) })}
              className="w-32"
            />

            <Checkbox
              label="Activo"
              checked={editingVideo.active ?? true}
              onChange={(e) => setEditingVideo({ ...editingVideo, active: e.target.checked })}
            />

            {videoError && <p className="text-sm text-rose-500">{videoError}</p>}

            <div className="mt-2 flex gap-3">
              <Button type="submit" variant="primary" className="flex-1" disabled={savingVideo}>
                {savingVideo ? "Guardando..." : "Guardar"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setEditingVideo(null)}>
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      <ConfirmDialog
        open={pendingVideoDelete !== null}
        title="Eliminar video"
        description="¿Eliminar este video? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        loading={deletingVideo}
        onConfirm={confirmVideoDelete}
        onCancel={() => setPendingVideoDelete(null)}
      />
    </div>
  );
}
