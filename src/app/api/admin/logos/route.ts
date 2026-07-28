import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdmin } from "@/lib/supabase/adminGuard";

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { accessToken, path } = body as { accessToken?: string; path?: string };

  const admin = await verifyAdmin(accessToken);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  if (!path) return NextResponse.json({ error: "Falta la ruta del archivo" }, { status: 400 });

  const { error } = await getSupabaseAdmin().storage.from("logos").remove([path]);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
