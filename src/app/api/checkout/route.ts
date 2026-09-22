import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";
import { resolveTierRows } from "@/lib/pricing/resolveTierRows";
import { resolvePaymentMethod } from "@/lib/payments/resolvePaymentMethod";

const MAX_QUANTITY_PER_TIER = 20;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 8;

interface CheckoutSelection {
  tierId: string;
  quantity: number;
}

// Public, unauthenticated route: fired best-effort by the WhatsApp checkout
// box right before it opens wa.me. Never throws — a buyer's purchase intent
// must never be blocked by a DB write failing. Uses the service-role client
// since sales/sale_items have no RLS policies at all (see migration 0008).
//
// Price/quantity are never trusted from the client — only tierId + quantity
// are read from the request; unit price and tier name are always re-fetched
// live via resolveTierRows (public.match_tiers if this match has its own
// locality list, else the general `tiers` table /admin/precios writes to),
// exactly the same pattern already used by /api/wompi/create-order. This is a reporting
// record for Ventas/Dashboard, not itself a live payment, but a tampered
// price here would still corrupt real business figures.
export async function POST(request: NextRequest) {
  try {
    const { limited } = await checkRateLimit({
      route: "checkout",
      identifier: clientIp(request),
      windowMs: RATE_LIMIT_WINDOW_MS,
      max: RATE_LIMIT_MAX,
    });
    if (limited) {
      return NextResponse.json({ ok: false, error: "Demasiadas solicitudes. Inténtalo de nuevo en unos minutos." }, { status: 429 });
    }

    const body = await request.json();
    const { matchId, matchLabel, buyer, selections, paymentMethod } = body as {
      matchId: string | null;
      matchLabel: string;
      buyer: { fullName: string; whatsapp: string; email: string };
      selections: { tierId: string; quantity: number }[];
      paymentMethod?: string;
    };

    if (
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

    const {
      method: resolvedPaymentMethod,
      status: initialStatus,
      error: paymentMethodError,
    } = await resolvePaymentMethod(admin, paymentMethod);
    if (paymentMethodError) {
      return NextResponse.json({ ok: false, error: paymentMethodError }, { status: 400 });
    }

    const tierIds = [...new Set((selections as CheckoutSelection[]).map((s) => s.tierId))];
    const { rows: tierRows, matchSpecific, error: tiersError } = await resolveTierRows(admin, matchId, tierIds);

    if (tiersError || tierRows.length === 0) {
      return NextResponse.json({ ok: false, error: "No se pudieron validar las localidades" }, { status: 400 });
    }

    const tierById = new Map(tierRows.map((t) => [t.id, t]));
    const items = (selections as CheckoutSelection[])
      .map((s) => {
        const tier = tierById.get(s.tierId);
        const quantity = Math.trunc(s.quantity);
        if (!tier || !Number.isFinite(quantity) || quantity <= 0 || quantity > MAX_QUANTITY_PER_TIER) return null;
        return {
          // Localidades propias de un partido (match_tiers) no viven en
          // public.tiers, así que su id no es un tier_id válido para el FK
          // nullable de sale_items — mismo patrón que el flujo femenino.
          tier_id: matchSpecific ? null : tier.id,
          tier_name: tier.name,
          quantity,
          unit_price: tier.price,
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
        match_id: matchId,
        match_label: matchLabel,
        buyer_full_name: buyer.fullName,
        buyer_whatsapp: buyer.whatsapp,
        buyer_email: buyer.email,
        subtotal,
        total,
        quantity,
        payment_method: resolvedPaymentMethod,
        status: initialStatus,
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
