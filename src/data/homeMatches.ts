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
    date: "Domingo, 9 de agosto de 2026",
    time: "4:00 p.m.",
    stadium: "Estadio El Campín",
    status: "agotado",
  },
  {
    id: "millonarios-vs-boyaca-chico",
    rival: "Boyacá Chicó",
    rivalInitial: "BC",
    date: "Por confirmar",
    time: "Por confirmar",
    stadium: "Estadio El Campín",
    status: "proximamente",
  },
  {
    id: "millonarios-vs-deportivo-cali",
    rival: "Deportivo Cali",
    rivalInitial: "DC",
    date: "Por confirmar",
    time: "Por confirmar",
    stadium: "Estadio El Campín",
    status: "proximamente",
  },
  {
    id: "millonarios-vs-fortaleza",
    rival: "Fortaleza",
    rivalInitial: "F",
    date: "Por confirmar",
    time: "Por confirmar",
    stadium: "Estadio El Campín",
    status: "proximamente",
  },
  {
    id: "millonarios-vs-bogota-fc",
    rival: "Bogotá FC",
    rivalInitial: "BF",
    date: "Por confirmar",
    time: "Por confirmar",
    stadium: "Estadio El Campín",
    status: "proximamente",
  },
  {
    id: "millonarios-vs-once-caldas",
    rival: "Once Caldas",
    rivalInitial: "OC",
    date: "Por confirmar",
    time: "Por confirmar",
    stadium: "Estadio El Campín",
    status: "proximamente",
  },
  {
    id: "millonarios-vs-union-magdalena",
    rival: "Unión Magdalena",
    rivalInitial: "UM",
    date: "Por confirmar",
    time: "Por confirmar",
    stadium: "Estadio El Campín",
    status: "proximamente",
  },
  {
    id: "millonarios-vs-aguilas-doradas",
    rival: "Águilas Doradas",
    rivalInitial: "AD",
    date: "Por confirmar",
    time: "Por confirmar",
    stadium: "Estadio El Campín",
    status: "proximamente",
  },
  {
    id: "millonarios-vs-america-de-cali",
    rival: "América de Cali",
    rivalInitial: "AM",
    date: "Por confirmar",
    time: "Por confirmar",
    stadium: "Estadio El Campín",
    status: "proximamente",
  },
  {
    id: "millonarios-vs-deportes-tolima",
    rival: "Deportes Tolima",
    rivalInitial: "T",
    date: "Por confirmar",
    time: "Por confirmar",
    stadium: "Estadio El Campín",
    status: "proximamente",
  },
];
