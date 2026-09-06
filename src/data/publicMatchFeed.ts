import type { HomeMatch, MatchStatus } from "@/data/homeMatches";
import type { FemaleMatch } from "@/data/femaleMatches";

// Normalizes men's matches (data/homeMatches.ts, unchanged) and women's
// matches (data/femaleMatches.ts) into one shared shape so Hero and
// HomeMatchesCalendar can render both from a single list — this is a
// presentation-layer merge only. Neither source table/fetch function is
// touched; a men's-only feed maps to byte-identical output to before
// (homeLabel is always "Millonarios", the men's crest is always
// millonariosCrestUrl), so nothing about how existing matches look changes.
export interface PublicMatchFeedItem {
  id: string;
  homeLabel: string;
  homeInitial: string;
  homeCrest?: string;
  awayLabel: string;
  awayInitial: string;
  awayCrest?: string;
  date: string;
  time: string;
  stadium: string;
  status: MatchStatus;
  description?: string;
  imageUrl?: string;
  buyHref: string;
  isWomen: boolean;
  /** Only meaningful for women's matches — men's items are always undefined
   * here (men's pricing is per-tier, shown only inside /comprar). */
  price?: number;
}

export function buildPublicMatchFeed({
  menMatches,
  womenMatches,
  millonariosCrestUrl,
}: {
  menMatches: HomeMatch[];
  womenMatches: FemaleMatch[];
  millonariosCrestUrl: string;
}): PublicMatchFeedItem[] {
  const menItems: PublicMatchFeedItem[] = menMatches.map((m) => ({
    id: m.id,
    homeLabel: "Millonarios",
    homeInitial: "M",
    homeCrest: millonariosCrestUrl,
    awayLabel: m.rival,
    awayInitial: m.rivalInitial,
    awayCrest: m.rivalCrest,
    date: m.date,
    time: m.time,
    stadium: m.stadium,
    status: m.status,
    description: m.description,
    imageUrl: m.imageUrl,
    buyHref: m.buyLink ?? `/comprar?match=${m.id}`,
    isWomen: false,
  }));

  const womenItems: PublicMatchFeedItem[] = womenMatches.map((m) => ({
    id: m.id,
    homeLabel: m.homeTeam,
    homeInitial: m.homeTeamInitial,
    homeCrest: m.homeCrestUrl ?? millonariosCrestUrl,
    awayLabel: m.awayTeam,
    awayInitial: m.awayTeamInitial,
    awayCrest: m.awayCrestUrl,
    date: m.date,
    time: m.time,
    stadium: m.stadium,
    status: m.status,
    description: m.description,
    imageUrl: m.imageUrl,
    buyHref: `/comprar-femenino?match=${m.id}`,
    isWomen: true,
    price: m.price,
  }));

  return [...menItems, ...womenItems];
}
