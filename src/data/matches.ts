export interface Match {
  id: string;
  home: string;
  away: string;
  homeInitial: string;
  awayInitial: string;
  competition: string;
  date: string;
  time: string;
  stadium: string;
  city: string;
  featured?: boolean;
}

export const matches: Match[] = [
  {
    id: "millonarios-vs-bucaramanga",
    home: "Millonarios",
    away: "Bucaramanga",
    homeInitial: "M",
    awayInitial: "B",
    competition: "Liga BetPlay Dimayor",
    date: "Domingo, 9 de agosto de 2026",
    time: "4:00 p.m.",
    stadium: "Estadio El Campín",
    city: "Bogotá D.C.",
    featured: true,
  },
  {
    id: "millonarios-vs-nacional",
    home: "Millonarios",
    away: "Atlético Nacional",
    homeInitial: "M",
    awayInitial: "N",
    competition: "Liga BetPlay Dimayor",
    date: "Sábado, 16 de agosto de 2026",
    time: "6:15 p.m.",
    stadium: "Estadio El Campín",
    city: "Bogotá D.C.",
    featured: true,
  },
  {
    id: "millonarios-vs-junior",
    home: "Millonarios",
    away: "Junior",
    homeInitial: "M",
    awayInitial: "J",
    competition: "Liga BetPlay Dimayor",
    date: "Sábado, 23 de agosto de 2026",
    time: "8:00 p.m.",
    stadium: "Estadio El Campín",
    city: "Bogotá D.C.",
    featured: true,
  },
  {
    id: "millonarios-vs-tolima",
    home: "Millonarios",
    away: "Deportes Tolima",
    homeInitial: "M",
    awayInitial: "T",
    competition: "Liga BetPlay Dimayor",
    date: "Domingo, 30 de agosto de 2026",
    time: "2:30 p.m.",
    stadium: "Estadio El Campín",
    city: "Bogotá D.C.",
  },
];

export const featuredMatches = matches.filter((match) => match.featured);
export const upcomingMatches = matches.slice(0, 3);

export function getMatchById(id: string | undefined): Match {
  return matches.find((match) => match.id === id) ?? matches[0];
}
