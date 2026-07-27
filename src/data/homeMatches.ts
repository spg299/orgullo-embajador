export type MatchStatus = "agotado" | "proximamente" | "disponible";

export interface HomeMatch {
  id: string;
  rival: string;
  rivalInitial: string;
  date: string;
  time: string;
  stadium: string;
  status: MatchStatus;
  buyLink?: string;
}

// Edit this array to update the home-match calendar. To open sales for a
// match, flip its status from "proximamente" to "disponible" (add a
// buyLink); to close sales, flip it to "agotado". No component code needs
// to change.
export const homeMatches: HomeMatch[] = [
  {
    id: "millonarios-vs-bucaramanga",
    rival: "Bucaramanga",
    rivalInitial: "B",
    date: "Sábado, 25 de julio de 2026",
    time: "6:10 p.m.",
    stadium: "Estadio El Campín",
    status: "agotado",
  },
  {
    id: "millonarios-vs-deportivo-pasto",
    rival: "Deportivo Pasto",
    rivalInitial: "DP",
    date: "Martes, 4 de agosto de 2026",
    time: "8:20 p.m.",
    stadium: "Estadio El Campín",
    status: "proximamente",
  },
  {
    id: "millonarios-vs-deportivo-cali",
    rival: "Deportivo Cali",
    rivalInitial: "DC",
    date: "Lunes, 17 de agosto de 2026",
    time: "6:10 p.m.",
    stadium: "Estadio El Campín",
    status: "proximamente",
  },
  {
    id: "millonarios-vs-inter-bogota",
    rival: "Inter de Bogotá",
    rivalInitial: "IB",
    date: "Domingo, 30 de agosto de 2026",
    time: "6:15 p.m.",
    stadium: "Estadio El Campín",
    status: "proximamente",
  },
  {
    id: "millonarios-vs-boyaca-chico",
    rival: "Boyacá Chicó",
    rivalInitial: "BC",
    date: "Sábado, 19 de septiembre de 2026",
    time: "8:15 p.m.",
    stadium: "Estadio El Campín",
    status: "proximamente",
  },
  {
    id: "millonarios-vs-once-caldas",
    rival: "Once Caldas",
    rivalInitial: "OC",
    date: "Martes, 13 de octubre de 2026",
    time: "8:00 p.m.",
    stadium: "Estadio El Campín",
    status: "proximamente",
  },
  {
    id: "millonarios-vs-jaguares",
    rival: "Jaguares",
    rivalInitial: "JG",
    date: "Sábado, 17 de octubre de 2026",
    time: "2:00 p.m.",
    stadium: "Estadio El Campín",
    status: "proximamente",
  },
  {
    id: "millonarios-vs-america-de-cali",
    rival: "América de Cali",
    rivalInitial: "AM",
    date: "Lunes, 26 de octubre de 2026",
    time: "8:00 p.m.",
    stadium: "Estadio El Campín",
    status: "proximamente",
  },
  {
    id: "millonarios-vs-deportivo-pasto-nov",
    rival: "Deportivo Pasto",
    rivalInitial: "DP",
    date: "Domingo, 8 de noviembre de 2026",
    time: "3:30 p.m.",
    stadium: "Estadio El Campín",
    status: "proximamente",
  },
];
