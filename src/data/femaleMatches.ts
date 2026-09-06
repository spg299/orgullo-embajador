import { supabase } from "@/lib/supabase/client";

export type FemaleMatchStatus = "available" | "upcoming" | "sold_out";

export interface FemaleMatch {
  id: string;
  homeTeam: string;
  homeTeamInitial: string;
  homeCrestUrl?: string;
  awayTeam: string;
  awayTeamInitial: string;
  awayCrestUrl?: string;
  date: string;
  time: string;
  stadium: string;
  imageUrl?: string;
  description?: string;
  /** Single flat price per ticket, in whole COP pesos — independent per match. */
  price: number;
  status: FemaleMatchStatus;
  /** Independent from `status` — whether this match is offered at all. */
  active: boolean;
}

interface FemaleMatchRow {
  id: string;
  home_team: string;
  home_team_initial: string;
  home_crest_url: string | null;
  away_team: string;
  away_team_initial: string;
  away_crest_url: string | null;
  match_date: string;
  match_time: string;
  stadium: string;
  image_url: string | null;
  description: string | null;
  price: number;
  status: FemaleMatchStatus;
  active: boolean;
}

function fromRow(row: FemaleMatchRow): FemaleMatch {
  return {
    id: row.id,
    homeTeam: row.home_team,
    homeTeamInitial: row.home_team_initial,
    homeCrestUrl: row.home_crest_url ?? undefined,
    awayTeam: row.away_team,
    awayTeamInitial: row.away_team_initial,
    awayCrestUrl: row.away_crest_url ?? undefined,
    date: row.match_date,
    time: row.match_time,
    stadium: row.stadium,
    imageUrl: row.image_url ?? undefined,
    description: row.description ?? undefined,
    price: row.price,
    status: row.status,
    active: row.active,
  };
}

const SELECT_COLUMNS =
  "id, home_team, home_team_initial, home_crest_url, away_team, away_team_initial, away_crest_url, match_date, match_time, stadium, image_url, description, price, status, active";

// Only active matches — inactive ones are hidden from the public site
// entirely (Hero/calendar/checkout) but stay manageable from the admin
// panel. Independent from data/homeMatches.ts / the `matches` table.
export async function fetchFemaleMatches(): Promise<FemaleMatch[]> {
  const { data, error } = await supabase
    .from("female_matches")
    .select(SELECT_COLUMNS)
    .eq("active", true)
    .order("sort_order");

  if (error || !data) return [];
  return (data as FemaleMatchRow[]).map(fromRow);
}

export async function fetchFemaleMatchById(id: string): Promise<FemaleMatch | null> {
  const { data, error } = await supabase
    .from("female_matches")
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .eq("active", true)
    .single();

  if (error || !data) return null;
  return fromRow(data as FemaleMatchRow);
}
