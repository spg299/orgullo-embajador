import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdmin } from "@/lib/supabase/adminGuard";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { accessToken, advisor } = body;

  const admin = await verifyAdmin(accessToken);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { error } = await getSupabaseAdmin().from("advisors").upsert(advisor);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { accessToken, id } = body;

  const admin = await verifyAdmin(accessToken);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const supabaseAdmin = getSupabaseAdmin();

  const { count, error: countError } = await supabaseAdmin
    .from("sales")
    .select("id", { count: "exact", head: true })
    .eq("advisor_id", id);

  if (countError) return NextResponse.json({ error: countError.message }, { status: 400 });

  if (count && count > 0) {
    return NextResponse.json(
      {
        error: `No se puede eliminar: este asesor tiene ${count} venta${count === 1 ? "" : "s"} asociada${count === 1 ? "" : "s"}. Desactívalo en su lugar.`,
      },
      { status: 400 },
    );
  }

  const { error } = await supabaseAdmin.from("advisors").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
