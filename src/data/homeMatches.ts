export type MatchStatus = "agotado" | "proximamente" | "disponible";

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

// Edit this array to update the home-match calendar. To open sales for a
// match, flip its status from "proximamente" to "disponible" (add a
// buyLink); to close sales, flip it to "agotado". No component code needs
// to change.
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
    status: "agotado",
  },
  {
    id: "millonarios-vs-deportivo-pasto",
    rival: "Deportivo Pasto",
    rivalInitial: "DP",
    rivalCrest: "/images/crests/deportivo-pasto.png",
    date: "Martes, 4 de agosto de 2026",
    time: "8:20 p.m.",
    stadium: "Estadio El Campín",
    status: "proximamente",
  },
  {
    id: "millonarios-vs-deportivo-cali",
    rival: "Deportivo Cali",
    rivalInitial: "DC",
    rivalCrest: "/images/crests/deportivo-cali.png",
    date: "Lunes, 17 de agosto de 2026",
    time: "6:10 p.m.",
    stadium: "Estadio El Campín",
    status: "proximamente",
  },
  {
    id: "millonarios-vs-inter-bogota",
    rival: "Inter de Bogotá",
    rivalInitial: "IB",
    rivalCrest: "/images/crests/inter-bogota.png",
    date: "Domingo, 30 de agosto de 2026",
    time: "6:15 p.m.",
    stadium: "Estadio El Campín",
    status: "proximamente",
  },
  {
    id: "millonarios-vs-boyaca-chico",
    rival: "Boyacá Chicó",
    rivalInitial: "BC",
    rivalCrest: "/images/crests/boyaca-chico.png",
    date: "Sábado, 19 de septiembre de 2026",
    time: "8:15 p.m.",
    stadium: "Estadio El Campín",
    status: "proximamente",
  },
  {
    id: "millonarios-vs-once-caldas",
    rival: "Once Caldas",
    rivalInitial: "OC",
    rivalCrest: "/images/crests/once-caldas.png",
    date: "Martes, 13 de octubre de 2026",
    time: "8:00 p.m.",
    stadium: "Estadio El Campín",
    status: "proximamente",
  },
  {
    id: "millonarios-vs-jaguares",
    rival: "Jaguares",
    rivalInitial: "JG",
    rivalCrest: "/images/crests/jaguares.png",
    date: "Sábado, 17 de octubre de 2026",
    time: "2:00 p.m.",
    stadium: "Estadio El Campín",
    status: "proximamente",
  },
  {
    id: "millonarios-vs-america-de-cali",
    rival: "América de Cali",
    rivalInitial: "AM",
    rivalCrest: "/images/crests/america-cali.png",
    date: "Lunes, 26 de octubre de 2026",
    time: "8:00 p.m.",
    stadium: "Estadio El Campín",
    status: "proximamente",
  },
  {
    id: "millonarios-vs-deportivo-pasto-nov",
    rival: "Deportivo Pasto",
    rivalInitial: "DP",
    rivalCrest: "/images/crests/deportivo-pasto.png",
    date: "Domingo, 8 de noviembre de 2026",
    time: "3:30 p.m.",
    stadium: "Estadio El Campín",
    status: "proximamente",
  },
];
