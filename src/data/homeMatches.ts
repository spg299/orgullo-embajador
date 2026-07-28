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
