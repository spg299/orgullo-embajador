import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdmin } from "@/lib/supabase/adminGuard";
import { isFinanceAdmin } from "@/lib/financeAccess";

export async function POST(request: NextRequest) {
  const { accessToken, movement } = await request.json();

  const admin = await verifyAdmin(accessToken);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  if (!isFinanceAdmin(admin.email)) {
    return NextResponse.json(
      { error: "Solo el administrador financiero puede modificar esta información." },
      { status: 403 },
    );
  }

  const { error } = await getSupabaseAdmin()
    .from("budget_movements")
    .upsert({ ...movement, created_by: movement.id ? movement.created_by : admin.id });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const { accessToken, id } = await request.json();

  const admin = await verifyAdmin(accessToken);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  if (!isFinanceAdmin(admin.email)) {
    return NextResponse.json(
      { error: "Solo el administrador financiero puede modificar esta información." },
      { status: 403 },
    );
  }

  const { error } = await getSupabaseAdmin().from("budget_movements").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
