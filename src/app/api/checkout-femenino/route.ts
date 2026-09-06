import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

const MAX_QUANTITY = 20;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 8;

// Public, unauthenticated route — the women's-match equivalent of
// /api/checkout. Writes into the SAME sales/sale_items tables (their
// match_id/tier_id FKs are nullable — see migration 0008/0016), tagging
// the row with female_match_id (migration 0021) instead. Price is never
// trusted from the client: only femaleMatchId + a quantity are read from
// the request, and the real price is re-fetched live from
// public.female_matches (the same table /admin/matches/femeninos writes
// to) — same principle as /api/checkout and /api/wompi/create-order.
export async function POST(request: NextRequest) {
  try {
    const { limited } = await checkRateLimit({
      route: "checkout-femenino",
      identifier: clientIp(request),
      windowMs: RATE_LIMIT_WINDOW_MS,
      max: RATE_LIMIT_MAX,
    });
    if (limited) {
      return NextResponse.json({ ok: false, error: "Demasiadas solicitudes. Inténtalo de nuevo en unos minutos." }, { status: 429 });
    }

    const body = await request.json();
    const { femaleMatchId, matchLabel, buyer, selections } = body as {
      femaleMatchId: string;
      matchLabel: string;
      buyer: { fullName: string; whatsapp: string; email: string };
      selections: { quantity: number }[];
    };

    if (
      !femaleMatchId ||
      !matchLabel ||
      !buyer?.fullName ||
      !buyer?.email ||
      !buyer?.whatsapp ||
      !Array.isArray(selections) ||
      selections.length === 0
    ) {
      return NextResponse.json({ ok: false, error: "Datos incompletos" }, { status: 400 });
    }

    const requestedQuantity = selections.reduce((sum, s) => sum + Math.trunc(s.quantity || 0), 0);
    if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0 || requestedQuantity > MAX_QUANTITY) {
      return NextResponse.json({ ok: false, error: "Cantidad inválida" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    const { data: femaleMatch, error: matchError } = await admin
      .from("female_matches")
      .select("id, home_team, away_team, price, active")
      .eq("id", femaleMatchId)
      .eq("active", true)
      .single();

    if (matchError || !femaleMatch) {
      return NextResponse.json({ ok: false, error: "No se pudo validar el partido" }, { status: 400 });
    }

    const unitPrice = femaleMatch.price as number;
    const subtotal = unitPrice * requestedQuantity;
    const total = subtotal;

    const { data: sale, error: saleError } = await admin
      .from("sales")
      .insert({
        match_id: null,
        female_match_id: femaleMatchId,
        match_label: matchLabel,
        buyer_full_name: buyer.fullName,
        buyer_whatsapp: buyer.whatsapp,
        buyer_email: buyer.email,
        subtotal,
        total,
        quantity: requestedQuantity,
      })
      .select("id")
      .single();

    if (saleError || !sale) {
      return NextResponse.json({ ok: false, error: saleError?.message }, { status: 400 });
    }

    const { error: itemsError } = await admin.from("sale_items").insert({
      sale_id: sale.id,
      tier_id: null,
      tier_name: "Boletería general (Femenino)",
      quantity: requestedQuantity,
      unit_price: unitPrice,
    });

    if (itemsError) {
      return NextResponse.json({ ok: false, error: itemsError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, saleId: sale.id });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
