import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

const MAX_QUANTITY_PER_TIER = 20;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 8;

interface CheckoutSelection {
  tierId: string;
  quantity: number;
}

// Public, unauthenticated route — the women's-match equivalent of
// /api/checkout. Writes into the SAME sales/sale_items tables (their
// match_id/tier_id FKs are nullable — see migration 0008/0016), tagging
// the row with female_match_id (migration 0021) instead; tier_id always
// stays null since female_tiers isn't the table tier_id references
// (public.tiers) — the tier name is snapshotted into tier_name instead,
// same as every other sale_item. Price is never trusted from the client:
// only tierId + quantity are read per selection, and the real price is
// always re-fetched live from public.female_tiers (the table
// /admin/precios/femeninos writes to) — same principle as /api/checkout.
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
      selections: CheckoutSelection[];
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

    const admin = getSupabaseAdmin();

    const { data: femaleMatch, error: matchError } = await admin
      .from("female_matches")
      .select("id, active")
      .eq("id", femaleMatchId)
      .eq("active", true)
      .single();

    if (matchError || !femaleMatch) {
      return NextResponse.json({ ok: false, error: "No se pudo validar el partido" }, { status: 400 });
    }

    const tierIds = [...new Set(selections.map((s) => s.tierId))];
    const { data: tierRows, error: tiersError } = await admin
      .from("female_tiers")
      .select("id, name, price")
      .in("id", tierIds);

    if (tiersError || !tierRows || tierRows.length === 0) {
      return NextResponse.json({ ok: false, error: "No se pudieron validar las localidades" }, { status: 400 });
    }

    const tierById = new Map(tierRows.map((t) => [t.id as string, t]));
    const items = selections
      .map((s) => {
        const tier = tierById.get(s.tierId);
        const quantity = Math.trunc(s.quantity);
        if (!tier || !Number.isFinite(quantity) || quantity <= 0 || quantity > MAX_QUANTITY_PER_TIER) return null;
        return {
          tier_id: null,
          tier_name: `${tier.name as string} (Femenino)`,
          quantity,
          unit_price: tier.price as number,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    if (items.length === 0) {
      return NextResponse.json({ ok: false, error: "Selección inválida" }, { status: 400 });
    }

    const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    const total = subtotal;
    const quantity = items.reduce((sum, item) => sum + item.quantity, 0);

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
        quantity,
      })
      .select("id")
      .single();

    if (saleError || !sale) {
      return NextResponse.json({ ok: false, error: saleError?.message }, { status: 400 });
    }

    const { error: itemsError } = await admin
      .from("sale_items")
      .insert(items.map((item) => ({ sale_id: sale.id, ...item })));

    if (itemsError) {
      return NextResponse.json({ ok: false, error: itemsError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, saleId: sale.id });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
