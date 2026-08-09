import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

// Public, unauthenticated — called once by /comprar/resultado right before
// it auto-opens WhatsApp, so a page reload never re-triggers the redirect.
// The compound filter (status='paid' AND whatsapp_redirected_at is null)
// makes this a no-op for anything else: it can't mark a non-paid order,
// and calling it twice for the same order only ever sets the timestamp
// once.
export async function POST(request: NextRequest) {
  const { reference } = await request.json();
  if (!reference) {
    return NextResponse.json({ error: "Falta la referencia" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("wompi_orders")
    .update({ whatsapp_redirected_at: new Date().toISOString() })
    .eq("reference", reference)
    .eq("status", "paid")
    .is("whatsapp_redirected_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
