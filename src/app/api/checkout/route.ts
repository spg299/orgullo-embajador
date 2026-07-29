import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

interface CheckoutSelection {
  tierId: string;
  tierName: string;
  quantity: number;
  unitPrice: number;
}

// Public, unauthenticated route: fired best-effort by the WhatsApp checkout
// box right before it opens wa.me. Never throws — a buyer's purchase intent
// must never be blocked by a DB write failing. Uses the service-role client
// since sales/sale_items have no RLS policies at all (see migration 0008).
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matchId, matchLabel, buyer, selections, subtotal, total } = body as {
      matchId: string | null;
      matchLabel: string;
      buyer: {
        fullName: string;
        documentNumber: string;
        whatsapp: string;
        email: string;
      };
      selections: CheckoutSelection[];
      subtotal: number;
      total: number;
    };

    if (!matchLabel || !buyer || !Array.isArray(selections) || selections.length === 0) {
      return NextResponse.json({ ok: false, error: "Datos incompletos" }, { status: 400 });
    }

    const quantity = selections.reduce((sum, s) => sum + s.quantity, 0);
    const supabaseAdmin = getSupabaseAdmin();

    const { data: sale, error: saleError } = await supabaseAdmin
      .from("sales")
      .insert({
        match_id: matchId,
        match_label: matchLabel,
        buyer_full_name: buyer.fullName,
        buyer_document_number: buyer.documentNumber,
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

    const { error: itemsError } = await supabaseAdmin.from("sale_items").insert(
      selections.map((s) => ({
        sale_id: sale.id,
        tier_id: s.tierId,
        tier_name: s.tierName,
        quantity: s.quantity,
        unit_price: s.unitPrice,
      })),
    );

    if (itemsError) {
      return NextResponse.json({ ok: false, error: itemsError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, saleId: sale.id });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
