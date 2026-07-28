"use client";

import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { siteSettings as defaultSiteSettings, type SiteSettings } from "@/data/siteSettings";

const FIELDS: { key: keyof SiteSettings; label: string; hint?: string }[] = [
  { key: "whatsapp_number", label: "Número de WhatsApp", hint: "Solo dígitos, con código de país. Ej. 573186319954" },
  { key: "whatsapp_support_label", label: "Número de WhatsApp (texto visible)", hint: "Ej. +57 318 631 9954" },
  { key: "instagram_url", label: "Instagram (URL)" },
  { key: "linkedin_url", label: "LinkedIn (URL)" },
  { key: "contact_address", label: "Dirección / ciudad" },
  { key: "copyright_text", label: "Texto de derechos de autor" },
];

export default function AdminConfiguracionPage() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setTimeout(() => setSaved(false), 2500);
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "No se pudo guardar la configuración.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
        Configuración
      </h1>
      <p className="mt-1 text-sm font-medium text-navy-700/60">
        Datos de contacto y redes que se muestran en todo el sitio (footer, botón de WhatsApp,
        checkout).
      </p>

      <div className="mt-6 rounded-3xl border border-navy-900/8 bg-white p-6 shadow-card sm:p-8">
        {loading ? (
          <p className="text-sm font-medium text-navy-700/60">Cargando...</p>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {FIELDS.map((field) => (
              <label key={field.key} className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-navy-900/80">{field.label}</span>
                <input
                  value={settings[field.key]}
                  onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                  className="rounded-xl border border-navy-900/12 px-4 py-2.5 text-sm"
                />
                {field.hint && (
                  <span className="text-xs font-medium text-navy-700/50">{field.hint}</span>
                )}
              </label>
            ))}

            {error && <p className="text-sm text-rose-600">{error}</p>}

            <div className="mt-2 flex items-center gap-3">
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
              {saved && <span className="text-sm font-medium text-emerald-600">¡Guardado!</span>}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
