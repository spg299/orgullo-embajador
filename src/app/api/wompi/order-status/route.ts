import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { fetchSiteSettings } from "@/data/siteSettings";
import { formatCOP } from "@/lib/format";

interface OrderItem {
  tier_name: string;
  quantity: number;
}

function buildWhatsAppMessage({
  reference,
  buyerFullName,
  buyerWhatsapp,
  buyerEmail,
  matchLabel,
  items,
  total,
}: {
  reference: string;
  buyerFullName: string;
  buyerWhatsapp: string;
  buyerEmail: string;
  matchLabel: string;
  items: OrderItem[];
  total: number;
}): string {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const localidad = items.map((item) => `${item.tier_name} x${item.quantity}`).join(", ");

  return [
    "Hola, quiero confirmar mi compra de boletas.",
    `Factura: ${reference}`,
    `Nombre: ${buyerFullName}`,
    `WhatsApp: ${buyerWhatsapp}`,
    `Correo: ${buyerEmail}`,
    `Partido: ${matchLabel}`,
    `Localidad: ${localidad}`,
    `Cantidad: ${totalQuantity} boleta${totalQuantity === 1 ? "" : "s"}`,
    `Total pagado: ${formatCOP(total)}`,
  ].join("\n");
}

// Public, unauthenticated route — polled by /comprar/resultado. Requires
// BOTH `reference` (sent to Wompi, moderately guessable — a timestamp
// prefix + 8 hex chars) AND `token` (a separate 122-bit secret, never sent
// to Wompi, only ever carried in our own redirect-url back to the buyer's
// browser) — knowing/guessing a reference alone is no longer enough to
// read another buyer's order or the PII embedded in their whatsappUrl.
// "Not found" and "wrong token" return the identical 404, so this can't be
// used as an oracle to confirm a reference exists.
//
// The status (and everything derived from it) only ever reflects what
// /api/wompi/webhook already verified and wrote — this route never treats
// the buyer's return from Wompi as proof of anything on its own.
export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference");
  const token = request.nextUrl.searchParams.get("token");
  if (!reference || !token) {
    return NextResponse.json({ error: "Falta la referencia" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data: order, error } = await admin
    .from("wompi_orders")
    .select(
      "status, match_label, total, buyer_full_name, buyer_whatsapp, buyer_email, access_token, whatsapp_redirected_at, wompi_order_items(tier_name, quantity)",
    )
    .eq("reference", reference)
    .single();

  if (error || !order || order.access_token !== token) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  const items = (order.wompi_order_items ?? []) as OrderItem[];

  const response: {
    status: string;
    matchLabel: string;
    total: number;
    whatsappRedirected: boolean;
    whatsappUrl?: string;
  } = {
    status: order.status,
    matchLabel: order.match_label,
    total: order.total,
    whatsappRedirected: Boolean(order.whatsapp_redirected_at),
  };

  // Only built once the DB says 'paid' — a fact only /api/wompi/webhook can
  // establish, after verifying Wompi's signature. Buyer PII is embedded in
  // this URL (unavoidable — the message shows the buyer their own name/
  // WhatsApp/email) but is never returned as separate JSON fields, and this
  // whole response now requires the access_token above to be reachable.
  if (order.status === "paid") {
    const settings = await fetchSiteSettings();
    const message = buildWhatsAppMessage({
      reference,
      buyerFullName: order.buyer_full_name,
      buyerWhatsapp: order.buyer_whatsapp,
      buyerEmail: order.buyer_email,
      matchLabel: order.match_label,
      items,
      total: order.total,
    });
    response.whatsappUrl = `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(message)}`;
  }

  return NextResponse.json(response);
}
