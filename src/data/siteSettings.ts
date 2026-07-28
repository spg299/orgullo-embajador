import { supabase } from "@/lib/supabase/client";

export interface SiteSettings {
  whatsapp_number: string;
  whatsapp_support_label: string;
  instagram_url: string;
  linkedin_url: string;
  copyright_text: string;
  contact_address: string;
  hero_headline: string;
  hero_subtext: string;
  hero_button_label: string;
  site_logo_url: string;
  millonarios_crest_url: string;
}

// Static fallback — identical to what's already hardcoded across the site
// today, so the first paint (and any environment where the migration hasn't
// run yet) looks exactly the same as before. Managed live from
// /admin/configuracion once the migration has run.
export const siteSettings: SiteSettings = {
  whatsapp_number: "573186319954",
  whatsapp_support_label: "+57 318 631 9954",
  instagram_url: "https://www.instagram.com/orgullo.embajador/?hl=es",
  linkedin_url: "https://www.linkedin.com/in/santiago-perdomo-gonzalez-68b4663b6/?locale=en",
  copyright_text: "© 2026 Orgullo Embajador. Todos los derechos reservados.",
  contact_address: "Bogotá D.C., Colombia",
  hero_headline: "Compra tus boletas",
  hero_subtext:
    "Vive la pasión azul junto a Millonarios. Consigue tu puesto en El Campín en minutos.",
  hero_button_label: "Comprar ahora",
  site_logo_url: "/images/logo-orgullo-embajador.png",
  millonarios_crest_url: "/images/crests/millonarios.png",
};

interface SettingRow {
  key: string;
  value: string;
}

// Fetches the live settings from Supabase (managed from /admin/configuracion).
// Falls back to the static defaults above — key by key — if the table
// doesn't exist yet or the request fails for any reason.
export async function fetchSiteSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase.from("site_settings").select("key, value");
  if (error || !data || data.length === 0) return siteSettings;

  const rows = data as SettingRow[];
  const merged = { ...siteSettings };
  for (const row of rows) {
    if (row.key in merged) {
      (merged as Record<string, string>)[row.key] = row.value;
    }
  }
  return merged;
}
