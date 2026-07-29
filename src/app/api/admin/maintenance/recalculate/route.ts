import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdmin } from "@/lib/supabase/adminGuard";
import { isMaintenanceAllowed } from "@/lib/maintenanceAccess";

// The Dashboard has no cache/materialized-stats layer — every load already
// recomputes everything live from Supabase. This route can't "invalidate"
// something that doesn't exist; it's a permission-gated, read-only trigger
// that re-runs the aggregation path and confirms it succeeds. Zero writes,
// zero deletions, zero status changes.
export async function POST(request: NextRequest) {
  const { accessToken } = await request.json();

  const admin = await verifyAdmin(accessToken);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  if (!isMaintenanceAllowed(admin.email)) {
    return NextResponse.json({ error: "No tienes permisos para realizar esta acción." }, { status: 403 });
  }

  const { error } = await getSupabaseAdmin().from("sales").select("id", { count: "exact", head: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
