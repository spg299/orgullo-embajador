import { supabase } from "@/lib/supabase/client";

export interface Tier {
  id: string;
  name: string;
  description: string;
  color: string;
  price: number;
  availability: "disponible" | "baja" | "agotado";
}

// Static fallback — used until fetchTiers() resolves, and if the tiers
// table doesn't exist yet or the request fails for any reason. Managed live
// from /admin/precios once the migration has run.
export const tiers: Tier[] = [
  {
    id: "occidental-baja",
    name: "Occidental Baja",
    description: "Vista frontal, la más solicitada por la hinchada.",
    color: "#0f3fb0",
    price: 180000,
    availability: "disponible",
  },
  {
    id: "occidental-alta",
    name: "Occidental Alta",
    description: "Vista panorámica cubierta, excelente ángulo.",
    color: "#1a56d6",
    price: 140000,
    availability: "disponible",
  },
  {
    id: "oriental",
    name: "Oriental",
    description: "Ambiente familiar, sol de la tarde.",
    color: "#cc9a2e",
    price: 120000,
    availability: "disponible",
    },
  {
    id: "norte",
    name: "Norte",
    description: "La barra brava azul, pura pasión y color.",
    color: "#0a2f8c",
    price: 70000,
    availability: "baja",
  },
  {
    id: "sur",
    name: "Sur",
    description: "Hinchada visitante y ambiente popular.",
    color: "#4d7bea",
    price: 65000,
    availability: "disponible",
  },
];

export const availabilityLabels: Record<Tier["availability"], string> = {
  disponible: "Disponible",
  baja: "Últimas boletas",
  agotado: "Agotado",
};

interface TierRow {
  id: string;
  name: string;
  description: string;
  color: string;
  price: number;
  availability: Tier["availability"];
}

// Fetches the live tier list from Supabase (managed from /admin/precios).
// Falls back to the static array above — unchanged, so nothing regresses —
// if the table doesn't exist yet (migration not run) or the request fails.
export async function fetchTiers(): Promise<Tier[]> {
  const { data, error } = await supabase
    .from("tiers")
    .select("id, name, description, color, price, availability")
    .order("sort_order");

  if (error || !data || data.length === 0) return tiers;
  return data as TierRow[];
}
