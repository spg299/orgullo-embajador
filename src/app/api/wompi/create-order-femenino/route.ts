import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { computeIntegritySignature } from "@/lib/wompi/signature";
import { calculateProcessingFee } from "@/lib/wompi/fees";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";
import { SITE_URL } from "@/lib/email/config";

const CURRENCY = "COP";
const MAX_QUANTITY_PER_TIER = 20;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 8;

interface CreateOrderSelection {
  tierId: string;
  quantity: number;
}

// Public, unauthenticated route — the women's-match equivalent of
// /api/wompi/create-order. Same security model exactly: price is re-fetched
// live per selected locality from public.female_tiers (never trusted from
// the client), the integrity signature is computed server-side only, and
// the order is written into the SAME wompi_orders/wompi_order_items tables
// (nullable match_id/tier_id, tagged with female_match_id — migration
// 0021). webhook/order-status/mark-redirected are untouched and already
// handle this order the same way they handle a men's one, keyed by reference.
export async function POST(request: NextRequest) {
  try {
    const { limited } = await checkRateLimit({
      route: "wompi-create-order-femenino",
      identifier: clientIp(request),
      windowMs: RATE_LIMIT_WINDOW_MS,
      max: RATE_LIMIT_MAX,
    });
    if (limited) {
      return NextResponse.json({ error: "Demasiadas solicitudes. Inténtalo de nuevo en unos minutos." }, { status: 429 });
    }

    const body = await request.json();
    const { femaleMatchId, matchLabel, buyer, selections } = body as {
      femaleMatchId: string;
      matchLabel: string;
      buyer: { fullName: string; whatsapp: string; email: string };
      selections: CreateOrderSelection[];
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
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    const { data: femaleMatch, error: matchError } = await admin
      .from("female_matches")
      .select("id, active")
      .eq("id", femaleMatchId)
      .eq("active", true)
      .single();

    if (matchError || !femaleMatch) {
      return NextResponse.json({ error: "No se pudo validar el partido" }, { status: 400 });
    }

    const tierIds = [...new Set(selections.map((s) => s.tierId))];
    const { data: tierRows, error: tiersError } = await admin
      .from("female_tiers")
      .select("id, name, price")
      .in("id", tierIds);

    if (tiersError || !tierRows || tierRows.length === 0) {
      return NextResponse.json({ error: "No se pudieron validar las localidades" }, { status: 400 });
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
      return NextResponse.json({ error: "Selección inválida" }, { status: 400 });
    }

    const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    // Same 3.5% Wompi processing-fee pass-through as the men's card flow
    // (src/lib/wompi/fees.ts) — it's a per-transaction cost, not tied to a
    // specific match, and FemaleCardCheckoutBox.tsx already displays it to
    // the buyer, so the server must charge exactly what was shown.
    const processingFee = calculateProcessingFee(subtotal);
    const total = subtotal + processingFee;

    const reference = `OEF-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const accessToken = randomUUID();

    const { data: order, error: orderError } = await admin
      .from("wompi_orders")
      .insert({
        reference,
        access_token: accessToken,
        match_id: null,
        female_match_id: femaleMatchId,
        match_label: matchLabel,
        buyer_full_name: buyer.fullName,
        buyer_email: buyer.email,
        buyer_whatsapp: buyer.whatsapp,
        subtotal,
        processing_fee: processingFee,
        total,
        currency: CURRENCY,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: orderError?.message ?? "No se pudo crear la orden" }, { status: 400 });
    }

    const { error: itemsError } = await admin
      .from("wompi_order_items")
      .insert(items.map((item) => ({ order_id: order.id, ...item })));

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 400 });
    }

    const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;
    const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;

    if (!publicKey || !integritySecret) {
      return NextResponse.json({ error: "Wompi no está configurado" }, { status: 500 });
    }

    const amountInCents = Math.round(total * 100);
    const signature = computeIntegritySignature({
      reference,
      amountInCents,
      currency: CURRENCY,
      integritySecret,
    });

    return NextResponse.json({
      reference,
      amountInCents,
      currency: CURRENCY,
      signature,
      publicKey,
      redirectUrl: `${SITE_URL}/comprar/resultado?ref=${encodeURIComponent(reference)}&token=${encodeURIComponent(accessToken)}`,
      checkoutUrl: "https://checkout.wompi.co/p/",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
