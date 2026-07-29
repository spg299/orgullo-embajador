import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdmin } from "@/lib/supabase/adminGuard";

export async function POST(request: NextRequest) {
  const { accessToken } = await request.json();

  const admin = await verifyAdmin(accessToken);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from("sales")
    .select("*, sale_items(*), advisors(id, name, color)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data: myAdvisor } = await supabaseAdmin
    .from("advisors")
    .select("id")
    .eq("profile_id", admin.id)
    .eq("active", true)
    .maybeSingle();

  return NextResponse.json({ sales: data, me: { advisorId: myAdvisor?.id ?? null } });
}
