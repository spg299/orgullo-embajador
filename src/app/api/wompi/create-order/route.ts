import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { computeIntegritySignature } from "@/lib/wompi/signature";
import { calculateProcessingFee } from "@/lib/wompi/fees";
import { SITE_URL } from "@/lib/email/config";

const CURRENCY = "COP";

// Public, unauthenticated route: called from the checkout page right
// before redirecting to Wompi. Prices are never trusted from the client —
// only tierId + quantity are read from the request; unit price and tier
// name are always re-fetched live from `tiers`, the same table
// /admin/precios writes to, so the amount actually charged can never be
// tampered with client-side.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matchId, matchLabel, buyer, selections } = body as {
      matchId: string | null;
      matchLabel: string;
      buyer: { fullName: string; whatsapp: string; email: string };
      selections: { tierId: string; quantity: number }[];
    };

    if (
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

    const tierIds = [...new Set(selections.map((s) => s.tierId))];
    const { data: tierRows, error: tiersError } = await admin
      .from("tiers")
      .select("id, name, price")
      .in("id", tierIds);

    if (tiersError || !tierRows || tierRows.length === 0) {
      return NextResponse.json({ error: "No se pudieron validar las localidades" }, { status: 400 });
    }

    const tierById = new Map(tierRows.map((t) => [t.id as string, t]));
    const items = selections
      .map((s) => {
        const tier = tierById.get(s.tierId);
        if (!tier || !(s.quantity > 0)) return null;
        return { tier_id: tier.id as string, tier_name: tier.name as string, quantity: s.quantity, unit_price: tier.price as number };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    if (items.length === 0) {
      return NextResponse.json({ error: "Selección inválida" }, { status: 400 });
    }

    const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    const processingFee = calculateProcessingFee(subtotal);
    const total = subtotal + processingFee;

    const reference = `OE-${Date.now()}-${randomUUID().slice(0, 8)}`;

    const { data: order, error: orderError } = await admin
      .from("wompi_orders")
      .insert({
        reference,
        match_id: matchId,
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
      redirectUrl: `${SITE_URL}/comprar/resultado?ref=${encodeURIComponent(reference)}`,
      checkoutUrl: "https://checkout.wompi.co/p/",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
