import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdmin } from "@/lib/supabase/adminGuard";

export async function POST(request: NextRequest) {
  const { accessToken, userId } = await request.json();

  const admin = await verifyAdmin(accessToken);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  if (!userId) return NextResponse.json({ error: "Falta el usuario a eliminar" }, { status: 400 });

  if (userId === admin.id) {
    return NextResponse.json({ error: "No puedes eliminar tu propia cuenta." }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

  // Belt and suspenders: the profiles FK is set to ON DELETE CASCADE by the
  // migration, but this covers projects where that constraint couldn't be
  // (re)created for some reason.
  await supabaseAdmin.from("profiles").delete().eq("id", userId);

  return NextResponse.json({ ok: true });
}
