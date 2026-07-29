export type SaleStatus = "solicitud" | "en_proceso" | "confirmada" | "entregada" | "cancelada";

export const SALE_STATUSES: SaleStatus[] = [
  "solicitud",
  "en_proceso",
  "confirmada",
  "entregada",
  "cancelada",
];

export const STATUS_LABELS: Record<SaleStatus, string> = {
  solicitud: "Solicitud",
  en_proceso: "En proceso",
  confirmada: "Confirmada",
  entregada: "Entregada",
  cancelada: "Cancelada",
};

export const STATUS_BADGE_VARIANT: Record<SaleStatus, "success" | "neutral" | "warning" | "danger" | "info"> = {
  solicitud: "info",
  en_proceso: "warning",
  confirmada: "success",
  entregada: "success",
  cancelada: "danger",
};

// Used by the Dashboard donut chart and any other raw-color chart context
// (Recharts needs hex/rgb values, not Tailwind classes, for SVG fill/stroke).
export const STATUS_CHART_COLORS: Record<SaleStatus, string> = {
  solicitud: "#3b82f6",
  en_proceso: "#f59e0b",
  confirmada: "#10b981",
  entregada: "#059669",
  cancelada: "#ef4444",
};

export interface SaleItem {
  id: string;
  sale_id: string;
  tier_id: string | null;
  tier_name: string;
  quantity: number;
  unit_price: number;
}

export interface SaleAdvisorRef {
  id: string;
  name: string;
  color: string;
}

export interface Sale {
  id: string;
  match_id: string | null;
  match_label: string;
  buyer_full_name: string;
  buyer_document_number: string;
  buyer_whatsapp: string;
  buyer_email: string;
  status: SaleStatus;
  advisor_id: string | null;
  subtotal: number;
  total: number;
  quantity: number;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  sale_items: SaleItem[];
  advisors: SaleAdvisorRef | null;
}
