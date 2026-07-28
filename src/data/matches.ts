import { homeMatches, MILLONARIOS_CREST, type HomeMatch } from "./homeMatches";

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
}

// homeMatches (data/homeMatches.ts) is the single source of truth for every
// fixture — Hero, the calendar, and checkout (via getMatchById below) all
// read from it, so editing a match's status/name/date/crest there updates
// every view with no other code changes.
function toMatch(homeMatch: HomeMatch): Match {
  return {
    id: homeMatch.id,
    home: "Millonarios",
    away: homeMatch.rival,
    homeInitial: "M",
    awayInitial: homeMatch.rivalInitial,
    homeCrest: MILLONARIOS_CREST,
    awayCrest: homeMatch.rivalCrest,
    competition: "Liga BetPlay Dimayor",
    date: homeMatch.date,
    time: homeMatch.time,
    stadium: homeMatch.stadium,
    city: "Bogotá D.C.",
  };
}

export function getMatchById(id: string | undefined): Match {
  const homeMatch = homeMatches.find((match) => match.id === id) ?? homeMatches[0];
  return toMatch(homeMatch);
}
