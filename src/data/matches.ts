import { homeMatches, fetchHomeMatchById, type HomeMatch } from "./homeMatches";
import { fetchSiteSettings } from "./siteSettings";

export interface Match {
  id: string;
  home: string;
  away: string;
  homeInitial: string;
  awayInitial: string;
  /** Path under /public to each team's official crest (PNG/SVG). */
  homeCrest?: string;
  awayCrest?: string;
  competition: string;
  date: string;
  time: string;
  stadium: string;
  city: string;
  description?: string;
  imageUrl?: string;
}

// homeMatches (data/homeMatches.ts, backed by the Supabase "matches" table
// managed from /admin/matches) is the single source of truth for every
// fixture — Hero, the calendar, and checkout (via getMatchById below) all
// read from it, so editing a match in the admin panel updates every view
// with no other code changes.
function toMatch(homeMatch: HomeMatch, millonariosCrest: string): Match {
  return {
    id: homeMatch.id,
    home: "Millonarios",
    away: homeMatch.rival,
    homeInitial: "M",
    awayInitial: homeMatch.rivalInitial,
    homeCrest: millonariosCrest,
    awayCrest: homeMatch.rivalCrest,
    competition: "Liga BetPlay Dimayor",
    date: homeMatch.date,
    time: homeMatch.time,
    stadium: homeMatch.stadium,
    city: "Bogotá D.C.",
    description: homeMatch.description,
    imageUrl: homeMatch.imageUrl,
  };
}

export async function getMatchById(id: string | undefined): Promise<Match> {
  const settings = await fetchSiteSettings();

  if (id) {
    const fromDb = await fetchHomeMatchById(id);
    if (fromDb) return toMatch(fromDb, settings.millonarios_crest_url);
  }

  const fallback = homeMatches.find((match) => match.id === id) ?? homeMatches[0];
  return toMatch(fallback, settings.millonarios_crest_url);
}
