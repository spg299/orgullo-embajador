import { supabase } from "@/lib/supabase/client";

export type MatchStatus = "available" | "upcoming" | "sold_out";

export interface HomeMatch {
  id: string;
  rival: string;
  rivalInitial: string;
  /** Path under /public to the rival's official crest (PNG/SVG, transparent background). */
  rivalCrest?: string;
  date: string;
  time: string;
  stadium: string;
  status: MatchStatus;
  buyLink?: string;
  /** Controlled from /admin/hero. Defaults to true when absent. */
  showInHero?: boolean;
  /** Optional per-match price override, keyed by tier id (data/tiers.ts). */
  tierPrices?: Record<string, number> | null;
  /** Optional editorial description, set from /admin/matches. */
  description?: string;
  /** Optional banner image for the match, set from /admin/matches. */
  imageUrl?: string;
}

// Path to Millonarios' own crest — the same image is reused across every
// match card. Drop the file at public/images/crests/millonarios.png (see
// CRESTS_DIR below for the rest of the naming convention).
export const MILLONARIOS_CREST = "/images/crests/millonarios.png";

// Single source of truth for every match card on the site (Hero, calendar,
// and — via getMatchById in data/matches.ts — checkout). Edit this array to
// update a fixture: to open sales for a match, flip its status from
// "upcoming" to "available" (optionally add a buyLink); to close sales, flip
// it to "sold_out". No component code needs to change — Hero and the
// calendar both derive their button label/enabled state and badge from
// `status` alone (see MatchCtaButton).
//
// To add a new rival's crest: drop the image at
// public/images/crests/<slug>.png and set rivalCrest to that path. Until
// the file exists (or if it 404s), the UI falls back to the initials badge
// automatically — nothing else needs to change.
export const homeMatches: HomeMatch[] = [
  {
    id: "millonarios-vs-bucaramanga",
    rival: "Bucaramanga",
    rivalInitial: "B",
    rivalCrest: "/images/crests/bucaramanga.png",
    date: "Sábado, 25 de julio de 2026",
    time: "6:10 p.m.",
    stadium: "Estadio El Campín",
    status: "sold_out",
  },
  {
    id: "millonarios-vs-deportivo-pasto",
    rival: "Deportivo Pasto",
    rivalInitial: "DP",
    rivalCrest: "/images/crests/deportivo-pasto.png",
    date: "Martes, 4 de agosto de 2026",
    time: "8:20 p.m.",
    stadium: "Estadio El Campín",
    status: "available",
  },
  {
    id: "millonarios-vs-deportivo-cali",
    rival: "Deportivo Cali",
    rivalInitial: "DC",
    rivalCrest: "/images/crests/deportivo-cali.png",
    date: "Lunes, 17 de agosto de 2026",
    time: "6:10 p.m.",
    stadium: "Estadio El Campín",
    status: "upcoming",
  },
  {
    id: "millonarios-vs-inter-bogota",
    rival: "Inter de Bogotá",
    rivalInitial: "IB",
    rivalCrest: "/images/crests/inter-bogota.png",
    date: "Domingo, 30 de agosto de 2026",
    time: "6:15 p.m.",
    stadium: "Estadio El Campín",
    status: "upcoming",
  },
  {
    id: "millonarios-vs-boyaca-chico",
    rival: "Boyacá Chicó",
    rivalInitial: "BC",
    rivalCrest: "/images/crests/boyaca-chico.jpeg",
    date: "Sábado, 19 de septiembre de 2026",
    time: "8:15 p.m.",
    stadium: "Estadio El Campín",
    status: "upcoming",
  },
  {
    id: "millonarios-vs-once-caldas",
    rival: "Once Caldas",
    rivalInitial: "OC",
    rivalCrest: "/images/crests/once-caldas.png",
    date: "Martes, 13 de octubre de 2026",
    time: "8:00 p.m.",
    stadium: "Estadio El Campín",
    status: "upcoming",
  },
  {
    id: "millonarios-vs-jaguares",
    rival: "Jaguares",
    rivalInitial: "JG",
    rivalCrest: "/images/crests/jaguares.webp",
    date: "Sábado, 17 de octubre de 2026",
    time: "2:00 p.m.",
    stadium: "Estadio El Campín",
    status: "upcoming",
  },
  {
    id: "millonarios-vs-america-de-cali",
    rival: "América de Cali",
    rivalInitial: "AM",
    rivalCrest: "/images/crests/america-cali.png",
    date: "Lunes, 26 de octubre de 2026",
    time: "8:00 p.m.",
    stadium: "Estadio El Campín",
    status: "upcoming",
  },
  {
    id: "millonarios-vs-alianza-fc",
    rival: "Alianza FC",
    rivalInitial: "AF",
    rivalCrest: "/images/crests/alianza-fc.jpeg",
    date: "Domingo, 8 de noviembre de 2026",
    time: "3:30 p.m.",
    stadium: "Estadio El Campín",
    status: "upcoming",
  },
];

interface MatchRow {
  id: string;
  rival: string;
  rival_initial: string;
  rival_crest: string | null;
  match_date: string;
  match_time: string;
  stadium: string;
  status: MatchStatus;
  buy_link: string | null;
  show_in_hero: boolean;
  tier_prices: Record<string, number> | null;
  description: string | null;
  image_url: string | null;
}

function fromRow(row: MatchRow): HomeMatch {
  return {
    id: row.id,
    rival: row.rival,
    rivalInitial: row.rival_initial,
    rivalCrest: row.rival_crest ?? undefined,
    date: row.match_date,
    time: row.match_time,
    stadium: row.stadium,
    status: row.status,
    buyLink: row.buy_link ?? undefined,
    showInHero: row.show_in_hero,
    tierPrices: row.tier_prices,
    description: row.description ?? undefined,
    imageUrl: row.image_url ?? undefined,
  };
}

// Fetches the live fixture list from Supabase (managed from /admin/matches),
// ordered the same way the admin panel lets you sort them. Falls back to the
// static array above — unchanged, so nothing regresses — if the table
// doesn't exist yet (migration not run) or the request fails for any reason.
export async function fetchHomeMatches(): Promise<HomeMatch[]> {
  const { data, error } = await supabase
    .from("matches")
    .select(
      "id, rival, rival_initial, rival_crest, match_date, match_time, stadium, status, buy_link, show_in_hero, tier_prices, description, image_url",
    )
    .order("sort_order");

  if (error || !data || data.length === 0) return homeMatches;
  return (data as MatchRow[]).map(fromRow);
}

export async function fetchHomeMatchById(id: string): Promise<HomeMatch | null> {
  const { data, error } = await supabase
    .from("matches")
    .select(
      "id, rival, rival_initial, rival_crest, match_date, match_time, stadium, status, buy_link, show_in_hero, tier_prices, description, image_url",
    )
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return fromRow(data as MatchRow);
}
