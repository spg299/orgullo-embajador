import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdmin } from "@/lib/supabase/adminGuard";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { accessToken, settings } = body as { accessToken?: string; settings?: Record<string, string> };

  const admin = await verifyAdmin(accessToken);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  if (!settings || typeof settings !== "object") {
    return NextResponse.json({ error: "Faltan los ajustes a guardar" }, { status: 400 });
  }

  const rows = Object.entries(settings).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await getSupabaseAdmin().from("site_settings").upsert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
