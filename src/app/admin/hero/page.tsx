"use client";

import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { PencilIcon, TrashIcon } from "@/components/ui/Icons";
import { siteSettings as defaultSiteSettings } from "@/data/siteSettings";

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
  const [matches, setMatches] = useState<MatchRow[] | null>(null);
  const [videos, setVideos] = useState<VideoRow[] | null>(null);
  const [editingVideo, setEditingVideo] = useState<Partial<VideoRow> | null>(null);
  const [savingVideo, setSavingVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  const [content, setContent] = useState({
    hero_headline: defaultSiteSettings.hero_headline,
    hero_subtext: defaultSiteSettings.hero_subtext,
    hero_button_label: defaultSiteSettings.hero_button_label,
  });
  const [savingContent, setSavingContent] = useState(false);
  const [contentSaved, setContentSaved] = useState(false);

  const matchesLoading = matches === null;
  const videosLoading = videos === null;

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

  async function handleVideoDelete(id: string) {
    if (!confirm("¿Eliminar este video?")) return;
    const accessToken = await getAccessToken();
    const res = await fetch("/api/admin/hero-videos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, id }),
    });
    if (res.ok) fetchVideos().then(setVideos);
    else {
      const body = await res.json().catch(() => ({}));
      alert(body.error ?? "No se pudo eliminar.");
    }
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
    } else {
      const body = await res.json().catch(() => ({}));
      setVideoError(body.error ?? "No se pudo guardar el video.");
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
      setTimeout(() => setContentSaved(false), 2500);
    } else {
      const body = await res.json().catch(() => ({}));
      alert(body.error ?? "No se pudo guardar el contenido del Hero.");
    }
  }

  const matchList = matches ?? [];
  const videoList = videos ?? [];
  const selectedCount = matchList.filter((m) => m.show_in_hero && m.status !== "sold_out").length;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">Hero</h1>
      <p className="mt-1 text-sm font-medium text-navy-700/60">
        Administra los videos de fondo, el texto y el botón del Hero, y qué partidos aparecen en
        el carrusel.
      </p>

      {/* Texto y botón */}
      <div className="mt-8 rounded-3xl border border-navy-900/8 bg-white p-6 shadow-card sm:p-8">
        <h2 className="font-display text-lg font-bold tracking-tight text-navy-950">
          Texto y botón
        </h2>
        <form className="mt-4 flex flex-col gap-4" onSubmit={handleContentSubmit}>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-navy-900/80">Título</span>
            <input
              value={content.hero_headline}
              onChange={(e) => setContent({ ...content, hero_headline: e.target.value })}
              className="rounded-xl border border-navy-900/12 px-4 py-2.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-navy-900/80">Subtítulo</span>
            <textarea
              rows={2}
              value={content.hero_subtext}
              onChange={(e) => setContent({ ...content, hero_subtext: e.target.value })}
              className="rounded-xl border border-navy-900/12 px-4 py-2.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-navy-900/80">
              Texto del botón (cuando hay boletas disponibles)
            </span>
            <input
              value={content.hero_button_label}
              onChange={(e) => setContent({ ...content, hero_button_label: e.target.value })}
              className="w-64 rounded-xl border border-navy-900/12 px-4 py-2.5 text-sm"
            />
          </label>
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
          <h2 className="font-display text-lg font-bold tracking-tight text-navy-950">
            Videos de fondo
          </h2>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingVideo({ ...emptyVideo, sort_order: videoList.length + 1 });
              setVideoError(null);
            }}
          >
            Nuevo video
          </Button>
        </div>

        <div className="mt-4 overflow-hidden rounded-3xl border border-navy-900/8 bg-white shadow-card">
          {videosLoading ? (
            <p className="p-6 text-sm font-medium text-navy-700/60">Cargando...</p>
          ) : videoList.length === 0 ? (
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
                {videoList.map((item) => (
                  <tr key={item.id}>
                    <td className="max-w-xs truncate px-5 py-3 font-medium text-navy-950">
                      {item.url}
                    </td>
                    <td className="px-5 py-3 text-navy-700/70">{item.sort_order}</td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => toggleVideoActive(item)}
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
                            setEditingVideo(item);
                            setVideoError(null);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-navy-700 hover:bg-royal-50"
                        >
                          <PencilIcon />
                        </button>
                        <button
                          type="button"
                          aria-label="Eliminar"
                          onClick={() => handleVideoDelete(item.id)}
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
      </div>

      {/* Partidos en el carrusel */}
      <div className="mt-8">
        <h2 className="font-display text-lg font-bold tracking-tight text-navy-950">
          Partidos en el carrusel
        </h2>
        <p className="mt-1 text-sm font-medium text-navy-700/60">
          El sitio muestra hasta 3, en orden de fecha, excluyendo los agotados. Actualmente hay{" "}
          {selectedCount} partido(s) elegible(s).
        </p>

        <div className="mt-4 overflow-hidden rounded-3xl border border-navy-900/8 bg-white shadow-card">
          {matchesLoading ? (
            <p className="p-6 text-sm font-medium text-navy-700/60">Cargando...</p>
          ) : (
            <ul className="divide-y divide-navy-900/5">
              {matchList.map((match) => (
                <li key={match.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <p className="font-semibold text-navy-950">Millonarios vs {match.rival}</p>
                    <p className="text-sm text-navy-700/60">
                      {match.match_date} · {match.match_time}
                      {match.status === "sold_out" && " · Agotado (no se muestra en el Hero)"}
                    </p>
                  </div>
                  <label className="flex shrink-0 items-center gap-2">
                    <input
                      type="checkbox"
                      checked={match.show_in_hero}
                      disabled={match.status === "sold_out"}
                      onChange={() => toggleMatch(match)}
                      className="h-5 w-5 rounded border-navy-900/25 text-royal-500 disabled:opacity-30"
                    />
                    <span className="text-sm font-medium text-navy-800">Mostrar</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {editingVideo && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-navy-900/8 bg-white p-6 shadow-soft sm:p-8">
            <h2 className="font-display text-xl font-bold tracking-tight text-navy-950">
              {editingVideo.id ? "Editar video" : "Nuevo video"}
            </h2>

            <form className="mt-6 flex flex-col gap-4" onSubmit={handleVideoSubmit}>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-navy-900/80">
                  URL del video (ej. /videos/mi-video.mp4)
                </span>
                <input
                  required
                  value={editingVideo.url ?? ""}
                  onChange={(e) => setEditingVideo({ ...editingVideo, url: e.target.value })}
                  className="rounded-xl border border-navy-900/12 px-4 py-2.5 text-sm"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-navy-900/80">Orden</span>
                <input
                  type="number"
                  value={editingVideo.sort_order ?? 0}
                  onChange={(e) =>
                    setEditingVideo({ ...editingVideo, sort_order: Number(e.target.value) })
                  }
                  className="w-32 rounded-xl border border-navy-900/12 px-4 py-2.5 text-sm"
                />
              </label>

              <label className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={editingVideo.active ?? true}
                  onChange={(e) => setEditingVideo({ ...editingVideo, active: e.target.checked })}
                  className="h-4 w-4 rounded border-navy-900/25 text-royal-500"
                />
                <span className="text-sm font-medium text-navy-900/80">Activo</span>
              </label>

              {videoError && <p className="text-sm text-rose-600">{videoError}</p>}

              <div className="mt-2 flex gap-3">
                <Button type="submit" variant="primary" className="flex-1" disabled={savingVideo}>
                  {savingVideo ? "Guardando..." : "Guardar"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setEditingVideo(null)}>
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
