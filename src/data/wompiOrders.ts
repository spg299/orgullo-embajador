export type WompiOrderStatus = "pending_payment" | "paid" | "declined" | "voided" | "error";

export const WOMPI_STATUS_LABELS: Record<WompiOrderStatus, string> = {
  pending_payment: "Pendiente",
  paid: "Aprobado",
  declined: "Rechazado",
  voided: "Anulado",
  error: "Error",
};

export const WOMPI_STATUS_BADGE_VARIANT: Record<
  WompiOrderStatus,
  "success" | "neutral" | "warning" | "danger" | "info"
> = {
  pending_payment: "warning",
  paid: "success",
  declined: "danger",
  voided: "danger",
  error: "danger",
};

export interface WompiOrderItem {
  id: string;
  order_id: string;
  tier_id: string | null;
  tier_name: string;
  quantity: number;
  unit_price: number;
}

export interface WompiOrder {
  id: string;
  reference: string;
  match_id: string | null;
  match_label: string;
  buyer_full_name: string;
  buyer_email: string;
  buyer_whatsapp: string;
  subtotal: number;
  processing_fee: number;
  total: number;
  currency: string;
  payment_method: string;
  status: WompiOrderStatus;
  wompi_transaction_id: string | null;
  wompi_status: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  wompi_order_items: WompiOrderItem[];
}
