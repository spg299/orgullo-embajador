import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdmin } from "@/lib/supabase/adminGuard";

interface MatchTierInput {
  id?: string;
  name: string;
  description: string;
  color: string;
  price: number;
  availability: "disponible" | "baja" | "agotado";
  sort_order: number;
}

// Admin-only CRUD for one match's own localidades (public.match_tiers).
// matchId always comes from the request body, never from `tier` itself, and
// every write is additionally scoped `.eq("match_id", matchId)` so an admin
// session can never edit/delete a row belonging to a different match through
// this route. Same auth model as /api/admin/tiers and /api/admin/female-tiers.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, matchId, tier } = body as { accessToken?: string; matchId?: string; tier?: MatchTierInput };

    const admin = await verifyAdmin(accessToken);
    if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    if (!matchId || !tier?.name) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const row = {
      match_id: matchId,
      name: tier.name,
      description: tier.description ?? "",
      color: tier.color ?? "#0f3fb0",
      price: tier.price ?? 0,
      availability: tier.availability ?? "disponible",
      sort_order: tier.sort_order ?? 0,
    };

    if (tier.id) {
      const { error } = await supabaseAdmin
        .from("match_tiers")
        .update(row)
        .eq("id", tier.id)
        .eq("match_id", matchId);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    } else {
      const { error } = await supabaseAdmin.from("match_tiers").insert(row);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, matchId, id } = body as { accessToken?: string; matchId?: string; id?: string };

    const admin = await verifyAdmin(accessToken);
    if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    if (!matchId || !id) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const { error } = await getSupabaseAdmin()
      .from("match_tiers")
      .delete()
      .eq("id", id)
      .eq("match_id", matchId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
