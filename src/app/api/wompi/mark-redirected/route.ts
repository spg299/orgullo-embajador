import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

// Public, unauthenticated — called once by /comprar/resultado right before
// it auto-opens WhatsApp, so a page reload never re-triggers the redirect.
// Requires the same per-order access_token as order-status (migration
// 0019) — a reference alone is no longer enough for a third party to
// pre-mark someone else's order and suppress their real auto-redirect.
// The compound filter (status='paid' AND whatsapp_redirected_at is null)
// makes this a no-op beyond that too: it can't mark a non-paid order, and
// calling it twice for the same order only ever sets the timestamp once.
export async function POST(request: NextRequest) {
  const { reference, token } = await request.json();
  if (!reference || !token) {
    return NextResponse.json({ error: "Falta la referencia" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("wompi_orders")
    .update({ whatsapp_redirected_at: new Date().toISOString() })
    .eq("reference", reference)
    .eq("access_token", token)
    .eq("status", "paid")
    .is("whatsapp_redirected_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
