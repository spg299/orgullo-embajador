import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdmin } from "@/lib/supabase/adminGuard";
import { isFinanceAdmin } from "@/lib/financeAccess";

interface ImportRow {
  advisorId: string;
  presupuesto: number | null;
  ingresos: number | null;
  gastos: number | null;
}

// Takes the rows the client already parsed and the admin already reviewed
// in the preview step — this route is the only place anything is actually
// written to Supabase. A budget's presupuesto_asignado is updated
// directly; ingresos/gastos become real movement rows (not a bypassed
// side-channel number), so the imported snapshot shows up correctly in
// the movement history, not just as an opaque total.
export async function POST(request: NextRequest) {
  const { accessToken, rows } = (await request.json()) as { accessToken: string; rows: ImportRow[] };

  const admin = await verifyAdmin(accessToken);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  if (!isFinanceAdmin(admin.email)) {
    return NextResponse.json(
      { error: "Solo el administrador financiero puede modificar esta información." },
      { status: 403 },
    );
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No hay filas para importar." }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);
  const movementsToInsert: Record<string, unknown>[] = [];

  for (const row of rows) {
    if (row.presupuesto !== null && !Number.isNaN(row.presupuesto)) {
      const { error } = await supabaseAdmin
        .from("budgets")
        .update({ presupuesto_asignado: row.presupuesto, updated_at: new Date().toISOString() })
        .eq("advisor_id", row.advisorId);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (row.ingresos !== null && !Number.isNaN(row.ingresos) && row.ingresos > 0) {
      movementsToInsert.push({
        advisor_id: row.advisorId,
        type: "ingreso",
        concept: "Importado desde Excel — Ingresos acumulados",
        amount: row.ingresos,
        movement_date: today,
        created_by: admin.id,
      });
    }

    if (row.gastos !== null && !Number.isNaN(row.gastos) && row.gastos > 0) {
      movementsToInsert.push({
        advisor_id: row.advisorId,
        type: "gasto",
        concept: "Importado desde Excel — Gastos acumulados",
        amount: row.gastos,
        movement_date: today,
        created_by: admin.id,
      });
    }
  }

  if (movementsToInsert.length > 0) {
    const { error } = await supabaseAdmin.from("budget_movements").insert(movementsToInsert);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, imported: rows.length, movements: movementsToInsert.length });
}
