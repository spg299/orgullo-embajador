// Delivery is intentionally not a status — see Sale.delivered_at below.
// "pago_pendiente" (Nequi only, migration 0024) sits between solicitud and
// confirmada: the buyer claims to have paid, but nothing here is trusted as
// proof — only an admin moving it to "confirmada" from /admin/ventas counts.
export type SaleStatus = "solicitud" | "pago_pendiente" | "confirmada" | "cancelada";

export const SALE_STATUSES: SaleStatus[] = ["solicitud", "pago_pendiente", "confirmada", "cancelada"];

export const STATUS_LABELS: Record<SaleStatus, string> = {
  solicitud: "Solicitud",
  pago_pendiente: "Pago pendiente de verificación",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
};

export const STATUS_BADGE_VARIANT: Record<SaleStatus, "success" | "neutral" | "warning" | "danger" | "info"> = {
  solicitud: "info",
  pago_pendiente: "warning",
  confirmada: "success",
  cancelada: "danger",
};

// Used by the Dashboard donut chart and any other raw-color chart context
// (Recharts needs hex/rgb values, not Tailwind classes, for SVG fill/stroke).
export const STATUS_CHART_COLORS: Record<SaleStatus, string> = {
  solicitud: "#3b82f6",
  pago_pendiente: "#d69e2e",
  confirmada: "#10b981",
  cancelada: "#ef4444",
};

export type SalePaymentMethod = "whatsapp" | "nequi";

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
  female_match_id: string | null;
  match_label: string;
  buyer_full_name: string;
  buyer_document_number: string | null;
  buyer_whatsapp: string;
  buyer_email: string;
  status: SaleStatus;
  payment_method: SalePaymentMethod;
  advisor_id: string | null;
  subtotal: number;
  total: number;
  quantity: number;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  confirmed_by: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  sale_items: SaleItem[];
  advisors: SaleAdvisorRef | null;
}
