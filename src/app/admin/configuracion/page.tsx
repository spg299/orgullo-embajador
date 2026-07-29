"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import { UploadIcon, PencilIcon, TrashIcon, RefreshIcon } from "@/components/ui/Icons";
import { siteSettings as defaultSiteSettings, type SiteSettings } from "@/data/siteSettings";
import type { Advisor } from "@/data/advisors";
import { isMaintenanceAllowed } from "@/lib/maintenanceAccess";
import { Input } from "@/components/ui/admin/Input";
import { Select } from "@/components/ui/admin/Select";
import { Checkbox } from "@/components/ui/admin/Checkbox";
import { Skeleton, SkeletonCard } from "@/components/ui/admin/Skeleton";
import { Dialog } from "@/components/ui/admin/Dialog";
import { ConfirmDialog } from "@/components/ui/admin/ConfirmDialog";
import { Badge } from "@/components/ui/admin/Badge";
import { useToast } from "@/components/ui/admin/Toast";

interface AdvisorUser {
  id: string;
  full_name: string | null;
  email: string | null;
}

const emptyAdvisor: Omit<Advisor, "id" | "created_at"> = {
  profile_id: null,
  name: "",
  avatar_url: null,
  color: "#0f3fb0",
  active: true,
};

const FIELDS: { key: keyof SiteSettings; label: string; hint?: string }[] = [
  { key: "whatsapp_number", label: "Número de WhatsApp", hint: "Solo dígitos, con código de país. Ej. 573186319954" },
  { key: "whatsapp_support_label", label: "Número de WhatsApp (texto visible)", hint: "Ej. +57 318 631 9954" },
  { key: "instagram_url", label: "Instagram (URL)" },
  { key: "linkedin_url", label: "LinkedIn (URL)" },
  { key: "contact_address", label: "Dirección / ciudad" },
  { key: "copyright_text", label: "Texto de derechos de autor" },
];

const LOGO_FIELDS: { key: "site_logo_url" | "millonarios_crest_url"; label: string; folder: "site" | "millonarios" }[] = [
  { key: "site_logo_url", label: "Logo de Orgullo Embajador", folder: "site" },
  { key: "millonarios_crest_url", label: "Escudo de Millonarios FC", folder: "millonarios" },
];

export default function AdminConfiguracionPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingUpload = useRef<(typeof LOGO_FIELDS)[number] | null>(null);

  const [advisors, setAdvisors] = useState<Advisor[] | null>(null);
  const [advisorUsers, setAdvisorUsers] = useState<AdvisorUser[]>([]);
  const [editingAdvisor, setEditingAdvisor] = useState<Partial<Advisor> | null>(null);
  const [savingAdvisor, setSavingAdvisor] = useState(false);
  const [uploadingAdvisorAvatar, setUploadingAdvisorAvatar] = useState(false);
  const [advisorError, setAdvisorError] = useState<string | null>(null);
  const [pendingDeleteAdvisor, setPendingDeleteAdvisor] = useState<Advisor | null>(null);
  const [deletingAdvisor, setDeletingAdvisor] = useState(false);
  const advisorAvatarInputRef = useRef<HTMLInputElement>(null);
  const advisorsLoading = advisors === null;

  const [showRecalcConfirm, setShowRecalcConfirm] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const canRecalculate = isMaintenanceAllowed(user?.email);

  async function handleRecalculate() {
    setRecalculating(true);
    const accessToken = await getAdvisorsAccessToken();
    const res = await fetch("/api/admin/maintenance/recalculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken }),
    });
    setRecalculating(false);
    setShowRecalcConfirm(false);
    if (res.ok) {
      toast.success("Dashboard recalculado correctamente.");
    } else {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "No se pudo recalcular el Dashboard.");
    }
  }

  async function getAdvisorsAccessToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  }

  async function fetchAdvisorsList(): Promise<Advisor[]> {
    const accessToken = await getAdvisorsAccessToken();
    const res = await fetch("/api/admin/advisors/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken }),
    });
    const body = await res.json().catch(() => ({}));
    return res.ok ? (body.advisors as Advisor[]) : [];
  }

  function fetchAdvisors() {
    fetchAdvisorsList().then(setAdvisors);
  }

  useEffect(() => {
    fetchAdvisorsList().then(setAdvisors);

    async function loadUsers() {
      const accessToken = await getAdvisorsAccessToken();
      const res = await fetch("/api/admin/users/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) setAdvisorUsers(body.users as AdvisorUser[]);
    }
    loadUsers();
  }, []);

  async function handleAdvisorAvatarUpload(file: File) {
    setUploadingAdvisorAvatar(true);
    setAdvisorError(null);
    const accessToken = await getAdvisorsAccessToken();
    const formData = new FormData();
    formData.append("accessToken", accessToken ?? "");
    formData.append("file", file);

    const res = await fetch("/api/admin/advisors/upload", { method: "POST", body: formData });
    const body = await res.json().catch(() => ({}));
    setUploadingAdvisorAvatar(false);

    if (res.ok) {
      setEditingAdvisor((prev) => (prev ? { ...prev, avatar_url: body.url } : prev));
    } else {
      setAdvisorError(body.error ?? "No se pudo subir la imagen.");
    }
  }

  async function handleAdvisorSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editingAdvisor) return;
    setSavingAdvisor(true);
    setAdvisorError(null);
    const accessToken = await getAdvisorsAccessToken();

    const res = await fetch("/api/admin/advisors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, advisor: editingAdvisor }),
    });

    setSavingAdvisor(false);
    if (res.ok) {
      setEditingAdvisor(null);
      fetchAdvisors();
      toast.success("Asesor guardado correctamente.");
    } else {
      const body = await res.json().catch(() => ({}));
      const message = body.error ?? "No se pudo guardar el asesor.";
      setAdvisorError(message);
      toast.error(message);
    }
  }

  async function toggleAdvisorActive(advisor: Advisor) {
    const accessToken = await getAdvisorsAccessToken();
    const res = await fetch("/api/admin/advisors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, advisor: { ...advisor, active: !advisor.active } }),
    });
    fetchAdvisors();
    if (res.ok) toast.success(advisor.active ? "Asesor desactivado." : "Asesor activado.");
  }

  async function confirmDeleteAdvisor() {
    if (!pendingDeleteAdvisor) return;
    setDeletingAdvisor(true);
    const accessToken = await getAdvisorsAccessToken();
    const res = await fetch("/api/admin/advisors", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, id: pendingDeleteAdvisor.id }),
    });
    setDeletingAdvisor(false);
    if (res.ok) {
      fetchAdvisors();
      toast.success("Asesor eliminado.");
    } else {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "No se pudo eliminar el asesor.");
    }
    setPendingDeleteAdvisor(null);
  }

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from("site_settings").select("key, value");
      if (!error && data) {
        const merged = { ...defaultSiteSettings };
        for (const row of data as { key: string; value: string }[]) {
          if (row.key in merged) (merged as Record<string, string>)[row.key] = row.value;
        }
        setSettings(merged);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleLogoUpload(file: File) {
    const field = pendingUpload.current;
    if (!field) return;
    setUploadingKey(field.key);
    setError(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    const formData = new FormData();
    formData.append("accessToken", accessToken ?? "");
    formData.append("folder", field.folder);
    formData.append("file", file);

    const res = await fetch("/api/admin/logos/upload", { method: "POST", body: formData });
    const body = await res.json().catch(() => ({}));
    setUploadingKey(null);

    if (res.ok) {
      setSettings((prev) => ({ ...prev, [field.key]: body.url }));
      toast.success("Imagen subida correctamente.");
    } else {
      const message = body.error ?? "No se pudo subir la imagen.";
      setError(message);
      toast.error(message);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    const res = await fetch("/api/admin/site-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, settings }),
    });

    setSaving(false);
    if (res.ok) {
      setSaved(true);
      toast.success("Configuración guardada correctamente.");
      setTimeout(() => setSaved(false), 2500);
    } else {
      const body = await res.json().catch(() => ({}));
      const message = body.error ?? "No se pudo guardar la configuración.";
      setError(message);
      toast.error(message);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-admin-text">
        Configuración
      </h1>
      <p className="mt-1 text-sm font-medium text-admin-text-muted">
        Datos de contacto y redes que se muestran en todo el sitio (footer, botón de WhatsApp,
        checkout).
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleLogoUpload(file);
          e.target.value = "";
        }}
      />

      <div className="mt-6 rounded-admin-xl border border-admin-border bg-admin-surface p-6 shadow-admin-xs sm:p-8">
        {loading ? (
          <div className="flex flex-col gap-4 border-b border-admin-border pb-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-admin-md" />
              <Skeleton className="h-8 w-40" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-admin-md" />
              <Skeleton className="h-8 w-40" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 border-b border-admin-border pb-6">
            {LOGO_FIELDS.map((field) => (
              <div key={field.key} className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element -- admin-supplied URLs vary in host/size; next/image adds no real benefit here */}
                <img
                  src={settings[field.key]}
                  alt={field.label}
                  className="h-14 w-14 rounded-admin-md border border-admin-border object-contain"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-admin-text/80">{field.label}</p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="mt-1.5"
                    icon={<UploadIcon className="h-4 w-4" />}
                    disabled={uploadingKey === field.key}
                    onClick={() => {
                      pendingUpload.current = field;
                      fileInputRef.current?.click();
                    }}
                  >
                    {uploadingKey === field.key ? "Subiendo..." : "Subir imagen"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="mt-6 flex flex-col gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
            {FIELDS.map((field) => (
              <Input
                key={field.key}
                label={field.label}
                hint={field.hint}
                value={settings[field.key]}
                onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
              />
            ))}

            {error && <p className="text-sm text-rose-500">{error}</p>}

            <div className="mt-2 flex items-center gap-3">
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
              {saved && <span className="text-sm font-medium text-emerald-600">¡Guardado!</span>}
            </div>
          </form>
        )}
      </div>

      <div className="mt-8 rounded-admin-xl border border-admin-border bg-admin-surface p-6 shadow-admin-xs sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-admin-text">
              Asesores de ventas
            </h2>
            <p className="mt-1 text-sm font-medium text-admin-text-muted">
              Gestiona los asesores que pueden recibir ventas asignadas, sin tocar código.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            className="self-start sm:self-auto"
            onClick={() => {
              setEditingAdvisor({ ...emptyAdvisor });
              setAdvisorError(null);
            }}
          >
            Nuevo asesor
          </Button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {advisorsLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : advisors && advisors.length === 0 ? (
            <p className="text-sm font-medium text-admin-text-muted">Aún no hay asesores.</p>
          ) : (
            advisors?.map((advisor) => (
              <div
                key={advisor.id}
                className="flex gap-4 rounded-admin-xl border border-admin-border bg-admin-bg p-5"
              >
                {advisor.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={advisor.avatar_url}
                    alt={advisor.name}
                    className="h-14 w-14 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full font-display font-bold text-white"
                    style={{ backgroundColor: advisor.color }}
                  >
                    {advisor.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-display font-bold text-admin-text">{advisor.name}</p>
                    <Badge variant={advisor.active ? "success" : "neutral"}>
                      {advisor.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span
                      className="h-3 w-3 rounded-full border border-admin-border"
                      style={{ backgroundColor: advisor.color }}
                    />
                    <span className="text-xs font-medium text-admin-text-muted">
                      Desde {new Date(advisor.created_at).toLocaleDateString("es-CO")}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleAdvisorActive(advisor)}
                      className="text-xs font-semibold text-royal-500 hover:text-royal-600"
                    >
                      {advisor.active ? "Desactivar" : "Activar"}
                    </button>
                    <button
                      type="button"
                      aria-label="Editar"
                      onClick={() => {
                        setEditingAdvisor(advisor);
                        setAdvisorError(null);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-admin-text-muted transition-colors hover:bg-admin-border hover:text-admin-text"
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Eliminar"
                      onClick={() => setPendingDeleteAdvisor(advisor)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog
        open={editingAdvisor !== null}
        onClose={() => setEditingAdvisor(null)}
        title={editingAdvisor?.id ? "Editar asesor" : "Nuevo asesor"}
      >
        {editingAdvisor && (
          <form className="flex flex-col gap-4" onSubmit={handleAdvisorSubmit}>
            <div className="flex items-center gap-4">
              {editingAdvisor.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={editingAdvisor.avatar_url}
                  alt=""
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div
                  className="h-16 w-16 rounded-full"
                  style={{ backgroundColor: editingAdvisor.color ?? "#0f3fb0" }}
                />
              )}
              <div>
                <p className="mb-1.5 text-sm font-medium text-admin-text/80">Avatar (opcional)</p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={<UploadIcon className="h-4 w-4" />}
                  disabled={uploadingAdvisorAvatar}
                  onClick={() => advisorAvatarInputRef.current?.click()}
                >
                  {uploadingAdvisorAvatar ? "Subiendo..." : "Subir avatar"}
                </Button>
              </div>
              <input
                ref={advisorAvatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAdvisorAvatarUpload(file);
                }}
              />
            </div>

            <Input
              label="Nombre"
              required
              value={editingAdvisor.name ?? ""}
              onChange={(e) => setEditingAdvisor({ ...editingAdvisor, name: e.target.value })}
            />

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-admin-text/80">Color identificador</span>
              <input
                type="color"
                value={editingAdvisor.color ?? "#0f3fb0"}
                onChange={(e) => setEditingAdvisor({ ...editingAdvisor, color: e.target.value })}
                className="h-[42px] w-full rounded-admin-md border border-admin-border bg-admin-surface px-2 py-1"
              />
            </label>

            <Select
              label="Vincular a un usuario"
              hint="Permite que ese usuario use 'Asignarme' en Ventas."
              value={editingAdvisor.profile_id ?? ""}
              onChange={(e) =>
                setEditingAdvisor({ ...editingAdvisor, profile_id: e.target.value || null })
              }
            >
              <option value="">— Sin vincular —</option>
              {advisorUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name || u.email || u.id}
                </option>
              ))}
            </Select>

            <Checkbox
              label="Activo (disponible para asignar ventas)"
              checked={editingAdvisor.active ?? true}
              onChange={(e) => setEditingAdvisor({ ...editingAdvisor, active: e.target.checked })}
            />

            {advisorError && <p className="text-sm text-rose-500">{advisorError}</p>}

            <div className="mt-2 flex gap-3">
              <Button type="submit" variant="primary" className="flex-1" disabled={savingAdvisor}>
                {savingAdvisor ? "Guardando..." : "Guardar"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setEditingAdvisor(null)}>
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      <ConfirmDialog
        open={pendingDeleteAdvisor !== null}
        title="Eliminar asesor"
        description="¿Eliminar este asesor? Si tiene ventas asociadas, no se podrá eliminar — desactívalo en su lugar."
        confirmLabel="Eliminar"
        destructive
        loading={deletingAdvisor}
        onConfirm={confirmDeleteAdvisor}
        onCancel={() => setPendingDeleteAdvisor(null)}
      />

      {canRecalculate && (
        <div className="mt-8 rounded-admin-xl border border-rose-200 bg-rose-50/50 p-6 shadow-admin-xs dark:border-rose-500/20 dark:bg-rose-500/5 sm:p-8">
          <h2 className="font-display text-xl font-bold tracking-tight text-admin-text">
            Mantenimiento
          </h2>
          <p className="mt-1 text-sm font-medium text-admin-text-muted">
            Herramientas administrativas para recalcular estadísticas del sistema.
          </p>

          <Button
            variant="destructive"
            size="sm"
            className="mt-5"
            icon={<RefreshIcon className="h-4 w-4" />}
            onClick={() => setShowRecalcConfirm(true)}
          >
            Recalcular Dashboard
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={showRecalcConfirm}
        title="¿Recalcular estadísticas?"
        description="Esta acción volverá a calcular todas las métricas del Dashboard utilizando la información almacenada en la base de datos."
        confirmLabel="Recalcular"
        destructive
        loading={recalculating}
        onConfirm={handleRecalculate}
        onCancel={() => setShowRecalcConfirm(false)}
      />
    </div>
  );
}
