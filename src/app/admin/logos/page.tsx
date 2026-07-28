"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { TrashIcon, UploadIcon } from "@/components/ui/Icons";
import { ConfirmDialog } from "@/components/ui/admin/ConfirmDialog";
import { Skeleton } from "@/components/ui/admin/Skeleton";
import { useToast } from "@/components/ui/admin/Toast";

type Folder = "site" | "millonarios" | "rivales";

const FOLDERS: { id: Folder; label: string; hint: string }[] = [
  { id: "site", label: "Logo Orgullo Embajador", hint: "El logo del sitio, usado en la barra de navegación." },
  { id: "millonarios", label: "Logo Millonarios FC", hint: "El escudo del equipo local." },
  { id: "rivales", label: "Logos de rivales", hint: "Escudos de los equipos visitantes." },
];

interface LogoItem {
  name: string;
  path: string;
  url: string;
}

export default function AdminLogosPage() {
  const toast = useToast();
  const [items, setItems] = useState<Record<Folder, LogoItem[]>>({
    site: [],
    millonarios: [],
    rivales: [],
  });
  const [loading, setLoading] = useState(true);
  const [uploadingFolder, setUploadingFolder] = useState<Folder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<LogoItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFolder = useRef<Folder>("rivales");

  async function fetchFolder(folder: Folder): Promise<LogoItem[]> {
    const { data, error } = await supabase.storage.from("logos").list(folder, {
      sortBy: { column: "created_at", order: "desc" },
    });
    if (error || !data) return [];
    return data
      .filter((file) => file.id)
      .map((file) => {
        const path = `${folder}/${file.name}`;
        const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
        return { name: file.name, path, url: urlData.publicUrl };
      });
  }

  async function fetchAll(): Promise<Record<Folder, LogoItem[]>> {
    const [site, millonarios, rivales] = await Promise.all([
      fetchFolder("site"),
      fetchFolder("millonarios"),
      fetchFolder("rivales"),
    ]);
    return { site, millonarios, rivales };
  }

  function refreshAll() {
    fetchAll().then((result) => {
      setItems(result);
      setLoading(false);
    });
  }

  useEffect(() => {
    fetchAll().then((result) => {
      setItems(result);
      setLoading(false);
    });
  }, []);

  function openUpload(folder: Folder) {
    pendingFolder.current = folder;
    fileInputRef.current?.click();
  }

  async function handleUpload(file: File) {
    const folder = pendingFolder.current;
    setUploadingFolder(folder);
    setError(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    const formData = new FormData();
    formData.append("accessToken", accessToken ?? "");
    formData.append("folder", folder);
    formData.append("file", file);

    const res = await fetch("/api/admin/logos/upload", { method: "POST", body: formData });
    const body = await res.json().catch(() => ({}));
    setUploadingFolder(null);

    if (res.ok) {
      refreshAll();
      toast.success("Logo subido correctamente.");
    } else {
      const message = body.error ?? "No se pudo subir el logo.";
      setError(message);
      toast.error(message);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    const res = await fetch("/api/admin/logos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, path: pendingDelete.path }),
    });

    setDeleting(false);
    if (res.ok) {
      refreshAll();
      toast.success("Logo eliminado.");
    } else {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "No se pudo eliminar el logo.");
    }
    setPendingDelete(null);
  }

  async function copyUrl(item: LogoItem) {
    await navigator.clipboard.writeText(item.url);
    setCopiedPath(item.path);
    setTimeout(() => setCopiedPath(null), 2000);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-admin-text">Logos</h1>
      <p className="mt-1 text-sm font-medium text-admin-text-muted">
        Sube y administra el logo del sitio, el escudo de Millonarios y los escudos de los
        rivales. Copia la URL para usarla en Partidos.
      </p>

      {error && <p className="mt-4 text-sm text-rose-500">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = "";
        }}
      />

      <div className="mt-6 flex flex-col gap-8">
        {FOLDERS.map((folder) => (
          <div key={folder.id}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold tracking-tight text-admin-text">
                  {folder.label}
                </h2>
                <p className="text-sm font-medium text-admin-text-muted">{folder.hint}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                icon={<UploadIcon className="h-4 w-4" />}
                disabled={uploadingFolder === folder.id}
                onClick={() => openUpload(folder.id)}
              >
                {uploadingFolder === folder.id ? "Subiendo..." : "Subir"}
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
              {loading ? (
                <>
                  <Skeleton className="h-28 w-full rounded-admin-lg" />
                  <Skeleton className="h-28 w-full rounded-admin-lg" />
                  <Skeleton className="h-28 w-full rounded-admin-lg" />
                </>
              ) : items[folder.id].length === 0 ? (
                <p className="text-sm font-medium text-admin-text-muted">Aún no hay logos aquí.</p>
              ) : (
                items[folder.id].map((item) => (
                  <div
                    key={item.path}
                    className="group relative flex flex-col items-center gap-2 rounded-admin-lg border border-admin-border bg-admin-surface p-3 shadow-admin-xs"
                  >
                    <button
                      type="button"
                      aria-label="Eliminar"
                      onClick={() => setPendingDelete(item)}
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-admin-surface text-rose-600 opacity-0 shadow-admin-xs transition-opacity group-hover:opacity-100"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                    {/* eslint-disable-next-line @next/next/no-img-element -- logo set is small and variable; next/image adds no real benefit here */}
                    <img
                      src={item.url}
                      alt={item.name}
                      className="h-16 w-16 object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => copyUrl(item)}
                      className="text-xs font-semibold text-royal-500 hover:text-royal-600"
                    >
                      {copiedPath === item.path ? "¡Copiado!" : "Copiar URL"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Eliminar logo"
        description="¿Eliminar este logo? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
