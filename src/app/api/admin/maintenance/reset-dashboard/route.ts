import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/supabase/adminGuard";
import { isMaintenanceAllowed } from "@/lib/maintenanceAccess";

const RESET_PASSWORD = process.env.DASHBOARD_RESET_PASSWORD ?? "1214";

// The Dashboard has no cache or materialized-stats layer — every load
// already recomputes everything live from Supabase (sales, users,
// visits, etc.). So there is nothing to actually delete here: no
// statistics table, no KPI cache, no chart cache exists to clear. This
// route exists to give the password + confirmation flow a real,
// permission-gated destination, but it is a verified no-op by
// necessity — it never touches sales/users/solicitudes/matches/tiers/
// configuración/budgets/financial records, exactly as required, because
// there is no separate "Dashboard data" store to touch in the first
// place. The password is re-checked here (not just in the earlier
// verify step) since this action must never trust a prior client claim.
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

  return NextResponse.json({ ok: true });
}
