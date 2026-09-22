import type { SupabaseClient } from "@supabase/supabase-js";

export interface PriceableTierRow {
  id: string;
  name: string;
  price: number;
}

interface ResolveTierRowsResult {
  rows: PriceableTierRow[];
  /** true when these rows came from match_tiers (this match has its own locality list). */
  matchSpecific: boolean;
  error: string | null;
}

// Shared by /api/checkout and /api/wompi/create-order: the one place that
// decides whether a match uses its own localidades (public.match_tiers) or
// the general list (public.tiers), and re-fetches price/name for the
// requested tierIds live from whichever table applies. Never trusts a price
// from the client — only tierIds are ever read from the request body.
//
// Security-relevant: when a match HAS rows in match_tiers, resolution is
// exclusive to that table — a tierId belonging to public.tiers (or to a
// different match) simply won't be found and that selection is rejected as
// invalid by the caller, exactly like an unknown id is today. This is what
// stops a buyer from requesting a cheaper general-tiers id for a match that
// has its own pricing configured.
export async function resolveTierRows(
  admin: SupabaseClient,
  matchId: string | null,
  tierIds: string[],
): Promise<ResolveTierRowsResult> {
  if (matchId) {
    const { data: existsRows, error: existsError } = await admin
      .from("match_tiers")
      .select("id")
      .eq("match_id", matchId)
      .limit(1);

    if (existsError) {
      return { rows: [], matchSpecific: false, error: existsError.message };
    }

    if (existsRows && existsRows.length > 0) {
      const { data, error } = await admin
        .from("match_tiers")
        .select("id, name, price")
        .eq("match_id", matchId)
        .in("id", tierIds);

      if (error) return { rows: [], matchSpecific: true, error: error.message };
      return { rows: (data ?? []) as PriceableTierRow[], matchSpecific: true, error: null };
    }
  }

  const { data, error } = await admin.from("tiers").select("id, name, price").in("id", tierIds);
  if (error) return { rows: [], matchSpecific: false, error: error.message };
  return { rows: (data ?? []) as PriceableTierRow[], matchSpecific: false, error: null };
}
