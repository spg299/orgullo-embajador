import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

// Public, unauthenticated route — polled by /comprar/resultado. Since there
// is no auth on this endpoint, it deliberately returns only what a buyer
// watching their own payment status needs, never buyer PII or internal IDs.
// The status itself only ever reflects what the webhook (POST
// /api/wompi/webhook) has already verified and written — this route never
// reads or trusts anything from the request other than the reference.
export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference");
  if (!reference) {
    return NextResponse.json({ error: "Falta la referencia" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data: order, error } = await admin
    .from("wompi_orders")
    .select("status, match_label, total, wompi_order_items(tier_name, quantity)")
    .eq("reference", reference)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  const items = (order.wompi_order_items ?? []) as { tier_name: string; quantity: number }[];

  return NextResponse.json({
    status: order.status,
    matchLabel: order.match_label,
    total: order.total,
    items: items.map((item) => ({ tierName: item.tier_name, quantity: item.quantity })),
  });
}
