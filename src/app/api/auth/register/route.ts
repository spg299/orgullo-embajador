import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendWelcomeEmail } from "@/lib/email/send";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

const RATE_LIMIT_WINDOW_MS = 30 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

export async function POST(request: NextRequest) {
  const { limited } = await checkRateLimit({
    route: "auth-register",
    identifier: clientIp(request),
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX,
  });
  if (limited) {
    return NextResponse.json({ error: "Demasiados intentos. Inténtalo de nuevo más tarde." }, { status: 429 });
  }

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
