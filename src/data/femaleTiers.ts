import { supabase } from "@/lib/supabase/client";
import type { Tier } from "@/data/tiers";

// Same shape as `Tier` (data/tiers.ts) on purpose — TierRow and OrderSummary
// (both built for the men's system) are reused unchanged by feeding them
// FemaleTier rows typed as Tier, exactly like the men's tiers themselves.
// A separate table (public.female_tiers) from public.tiers means women's
// localities/prices never mix with or affect men's ones.
export type FemaleTier = Tier;

interface FemaleTierRow {
  id: string;
  name: string;
  description: string;
  color: string;
  price: number;
  availability: Tier["availability"];
}

// Fetches the live locality list from Supabase (managed from
// /admin/precios/femeninos). No static fallback — unlike public.tiers,
// there's no pre-existing fixture to fall back to; an empty/failed fetch
// just means no localities render yet.
export async function fetchFemaleTiers(): Promise<FemaleTier[]> {
  const { data, error } = await supabase
    .from("female_tiers")
    .select("id, name, description, color, price, availability")
    .order("sort_order");

  if (error || !data) return [];
  return data as FemaleTierRow[];
}
