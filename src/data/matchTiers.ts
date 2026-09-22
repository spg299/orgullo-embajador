import { supabase } from "@/lib/supabase/client";
import type { Tier } from "@/data/tiers";

// Same shape as `Tier` on purpose, exactly like FemaleTier (data/femaleTiers.ts)
// — TierRow/OrderSummary/checkout components are reused unchanged by feeding
// them match_tiers rows typed as Tier.
export type MatchTier = Tier;

interface MatchTierRow {
  id: string;
  name: string;
  description: string;
  color: string;
  price: number;
  availability: Tier["availability"];
}

// Fetches the localidades configured exclusively for one match (managed from
// /admin/matches/[id]/precios). An empty array means this match has no
// custom pricing — callers should fall back to fetchTiers() (public.tiers),
// exactly as every match behaved before this table existed.
export async function fetchMatchTiers(matchId: string): Promise<MatchTier[]> {
  const { data, error } = await supabase
    .from("match_tiers")
    .select("id, name, description, color, price, availability")
    .eq("match_id", matchId)
    .order("sort_order");

  if (error || !data) return [];
  return data as MatchTierRow[];
}
