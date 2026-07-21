export interface Tier {
  id: string;
  name: string;
  description: string;
  color: string;
  price: number;
  availability: "alta" | "media" | "baja";
}

export const tiers: Tier[] = [
  {
    id: "occidental-baja",
    name: "Occidental Baja",
    description: "Vista frontal, la más solicitada por la hinchada.",
    color: "#0f3fb0",
    price: 180000,
    availability: "media",
  },
  {
    id: "occidental-alta",
    name: "Occidental Alta",
    description: "Vista panorámica cubierta, excelente ángulo.",
    color: "#1a56d6",
    price: 140000,
    availability: "alta",
  },
  {
    id: "oriental",
    name: "Oriental",
    description: "Ambiente familiar, sol de la tarde.",
    color: "#cc9a2e",
    price: 120000,
    availability: "alta",
    },
  {
    id: "norte",
    name: "Norte",
    description: "La barra brava azul, pura pasión y color.",
    color: "#0a2f8c",
    price: 70000,
    availability: "baja",
  },
  {
    id: "sur",
    name: "Sur",
    description: "Hinchada visitante y ambiente popular.",
    color: "#4d7bea",
    price: 65000,
    availability: "alta",
  },
];

export const availabilityLabels: Record<Tier["availability"], string> = {
  alta: "Alta disponibilidad",
  media: "Disponibilidad media",
  baja: "Últimas boletas",
};
