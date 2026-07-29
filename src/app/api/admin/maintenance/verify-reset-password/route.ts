import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/supabase/adminGuard";
import { isMaintenanceAllowed } from "@/lib/maintenanceAccess";

// Falls back to "1214" only if DASHBOARD_RESET_PASSWORD isn't set in the
// environment — never hardcoded on the client, and changeable later via
// a Vercel env var without touching any code.
const RESET_PASSWORD = process.env.DASHBOARD_RESET_PASSWORD ?? "1214";

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
