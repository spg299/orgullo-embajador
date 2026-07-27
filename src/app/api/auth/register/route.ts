import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendWelcomeEmail } from "@/lib/email/send";

export async function POST(request: NextRequest) {
  const { accessToken } = await request.json();

  if (!accessToken) {
    return NextResponse.json({ error: "Missing accessToken" }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin().auth.getUser(accessToken);

  if (error || !data.user?.email) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const name = (data.user.user_metadata?.full_name as string | undefined) ?? "";

  try {
    await sendWelcomeEmail(data.user.email, name);
  } catch (err) {
    console.error("Failed to send welcome email", err);
  }

  return NextResponse.json({ ok: true });
}
