import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdmin } from "@/lib/supabase/adminGuard";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const accessToken = formData.get("accessToken");
  const file = formData.get("file");

  const admin = await verifyAdmin(typeof accessToken === "string" ? accessToken : undefined);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo de imagen" }, { status: 400 });
  }

  const extension = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${extension}`;
  const bytes = await file.arrayBuffer();

  const supabaseAdmin = getSupabaseAdmin();
  const { error: uploadError } = await supabaseAdmin.storage
    .from("advisors")
    .upload(path, bytes, { contentType: file.type || "image/jpeg" });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 });
  }

  const { data } = supabaseAdmin.storage.from("advisors").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
