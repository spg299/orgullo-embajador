import type { SupabaseClient } from "@supabase/supabase-js";

export type SalePaymentMethod = "whatsapp" | "nequi";

interface ResolvePaymentMethodResult {
  method: SalePaymentMethod;
  status: "solicitud" | "pago_pendiente";
  error: string | null;
}

// Shared by /api/checkout and /api/checkout-femenino. Whitelists the
// client-supplied paymentMethod (never trusts it blindly — anything other
// than the literal "nequi" falls back to "whatsapp") and, for Nequi,
// re-checks server-side that it's actually enabled in site_settings, so a
// disabled method can't be used via a direct API call even if the UI
// correctly hides the option. The returned status is NEVER "confirmada" —
// pressing "Ya realicé el pago" is never, by itself, proof that the money
// was received; only an admin moving the sale to "confirmada" from
// /admin/ventas does that.
export async function resolvePaymentMethod(
  admin: SupabaseClient,
  requested: unknown,
): Promise<ResolvePaymentMethodResult> {
  if (requested !== "nequi") {
    return { method: "whatsapp", status: "solicitud", error: null };
  }

  const { data, error } = await admin
    .from("site_settings")
    .select("value")
    .eq("key", "nequi_enabled")
    .maybeSingle();

  if (error) return { method: "nequi", status: "pago_pendiente", error: error.message };
  if (data?.value !== "true") {
    return { method: "nequi", status: "pago_pendiente", error: "Nequi no está disponible en este momento." };
  }
  return { method: "nequi", status: "pago_pendiente", error: null };
}
