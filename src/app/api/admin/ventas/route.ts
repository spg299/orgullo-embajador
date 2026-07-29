import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdmin } from "@/lib/supabase/adminGuard";
import type { SaleStatus } from "@/data/sales";

const TIMESTAMP_FIELD: Partial<Record<SaleStatus, string>> = {
  confirmada: "confirmed_at",
  cancelada: "cancelled_at",
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { accessToken, id, status, advisor_id, delivered } = body;

  const admin = await verifyAdmin(accessToken);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  if (!id) return NextResponse.json({ error: "Falta el id de la venta" }, { status: 400 });

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (status !== undefined) {
    update.status = status;
    const timestampField = TIMESTAMP_FIELD[status as SaleStatus];
    if (timestampField) update[timestampField] = new Date().toISOString();
  }

  if (advisor_id !== undefined) {
    update.advisor_id = advisor_id;
  }

  // Delivery is independent of status — it's just a timestamp on the sale
  // (set/unset here), never a status value of its own.
  if (delivered !== undefined) {
    update.delivered_at = delivered ? new Date().toISOString() : null;
  }

  const { error } = await getSupabaseAdmin().from("sales").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
