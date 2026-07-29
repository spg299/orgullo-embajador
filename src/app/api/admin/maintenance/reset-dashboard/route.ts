import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdmin } from "@/lib/supabase/adminGuard";
import { isMaintenanceAllowed } from "@/lib/maintenanceAccess";

const RESET_PASSWORD = process.env.DASHBOARD_RESET_PASSWORD ?? "1214";

// Permanently wipes test data before going to production. Scope is
// deliberate and limited to what's listed as "test data" — it must NOT
// touch admin users, site configuration, auth accounts, or roles:
//
// - sales (cascades to sale_items): ventas, solicitudes, historial de
//   ventas, actividad reciente (all derived live from this table).
// - budget_movements: ingresos, gastos, movimientos, historial financiero.
// - budgets: rows are kept (they're structurally tied to real advisors,
//   not "test data"), but presupuesto_asignado/observaciones reset to 0/null.
// - site_visits: visitantes registrados.
//
// Every Dashboard KPI/chart/report is recomputed live from these tables on
// every load (no cache layer exists), so once they're empty the Dashboard
// is automatically empty too — nothing extra to "recalculate".
//
// Deliberately untouched: profiles/auth.users (usuarios administradores,
// cuentas de acceso, roles y permisos), site_settings/matches/tiers/
// testimonials/advisors (configuración del sistema), admin_access_logs
// (security audit trail, not test data).
export async function POST(request: NextRequest) {
  const { accessToken, password } = await request.json();

  const admin = await verifyAdmin(accessToken);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  if (!isMaintenanceAllowed(admin.email)) {
    return NextResponse.json({ error: "No tienes permisos para realizar esta acción." }, { status: 403 });
  }

  if (password !== RESET_PASSWORD) {
    return NextResponse.json({ error: "Contraseña incorrecta." }, { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  const { error: salesError } = await supabaseAdmin
    .from("sales")
    .delete()
    .not("id", "is", null);
  if (salesError) return NextResponse.json({ error: salesError.message }, { status: 400 });

  const { error: movementsError } = await supabaseAdmin
    .from("budget_movements")
    .delete()
    .not("id", "is", null);
  if (movementsError) return NextResponse.json({ error: movementsError.message }, { status: 400 });

  const { error: budgetsError } = await supabaseAdmin
    .from("budgets")
    .update({ presupuesto_asignado: 0, observaciones: null })
    .not("id", "is", null);
  if (budgetsError) return NextResponse.json({ error: budgetsError.message }, { status: 400 });

  const { error: visitsError } = await supabaseAdmin
    .from("site_visits")
    .delete()
    .not("id", "is", null);
  if (visitsError) return NextResponse.json({ error: visitsError.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
