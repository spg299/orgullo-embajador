import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdmin } from "@/lib/supabase/adminGuard";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, tier } = body;

    const admin = await verifyAdmin(accessToken);
    if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const { error } = await getSupabaseAdmin().from("tiers").upsert(tier);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Without this, any exception thrown before the code above returns JSON
    // (e.g. getSupabaseAdmin() throwing on a missing env var, or a malformed
    // request body) surfaces to the client as a non-JSON 500 — the frontend's
    // res.json() then fails silently and falls back to a generic message,
    // hiding the real cause. Always return JSON with the actual message.
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, id } = body;

    const admin = await verifyAdmin(accessToken);
    if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const { error } = await getSupabaseAdmin().from("tiers").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
