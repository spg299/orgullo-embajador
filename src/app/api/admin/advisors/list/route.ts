import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdmin } from "@/lib/supabase/adminGuard";

export async function POST(request: NextRequest) {
  const { accessToken } = await request.json();

  const admin = await verifyAdmin(accessToken);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { data, error } = await getSupabaseAdmin()
    .from("advisors")
    .select("id, profile_id, name, avatar_url, color, active, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ advisors: data, meProfileId: admin.id });
}
