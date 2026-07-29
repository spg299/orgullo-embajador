import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdmin } from "@/lib/supabase/adminGuard";
import { isFinanceAdmin } from "@/lib/financeAccess";

// Second layer of enforcement on top of the RLS policy in migration 0012
// (which already blocks writes at the database level for anyone other
// than edfabian95@gmail.com) — belt and suspenders, consistent with how
// every other write route in this app double-checks server-side.
export async function POST(request: NextRequest) {
  const { accessToken, advisorId, presupuestoAsignado, observaciones } = await request.json();

  const admin = await verifyAdmin(accessToken);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  if (!isFinanceAdmin(admin.email)) {
    return NextResponse.json(
      { error: "Solo el administrador financiero puede modificar esta información." },
      { status: 403 },
    );
  }

  const { error } = await getSupabaseAdmin()
    .from("budgets")
    .update({
      presupuesto_asignado: presupuestoAsignado,
      observaciones,
      updated_at: new Date().toISOString(),
    })
    .eq("advisor_id", advisorId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
