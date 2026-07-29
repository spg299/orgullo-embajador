import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_THRESHOLD = 5;

// Public route — it must work for unauthenticated and non-admin visitors
// too (that's exactly what it logs), so there's no verifyAdmin gate here.
// Identity, IP, and User-Agent are all resolved server-side from the
// request itself, never trusted from the client body, so a malicious
// client can't fabricate a fake "allowed" entry or spoof someone else's
// email into the log.
export async function POST(request: NextRequest) {
  const { path, accessToken } = await request.json().catch(() => ({ path: "unknown" }));

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = request.headers.get("user-agent");

  const supabaseAdmin = getSupabaseAdmin();

  let userId: string | null = null;
  let email: string | null = null;
  let result: "allowed" | "denied_unauthenticated" | "denied_not_admin" = "denied_unauthenticated";

  if (accessToken) {
    const { data: userData } = await supabaseAdmin.auth.getUser(accessToken);
    if (userData.user) {
      userId = userData.user.id;
      email = userData.user.email ?? null;
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single();
      result = profile?.role === "admin" ? "allowed" : "denied_not_admin";
    }
  }

  // Soft rate limit: too many non-allowed attempts from this IP recently.
  let blocked = false;
  if (result !== "allowed" && ip) {
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { count } = await supabaseAdmin
      .from("admin_access_logs")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .neq("result", "allowed")
      .gte("created_at", since);

    if ((count ?? 0) >= RATE_LIMIT_THRESHOLD) {
      blocked = true;
    }
  }

  await supabaseAdmin.from("admin_access_logs").insert({
    user_id: userId,
    email,
    path: typeof path === "string" ? path : "unknown",
    ip,
    user_agent: userAgent,
    result: blocked ? "rate_limited" : result,
  });

  return NextResponse.json({ result: blocked ? "rate_limited" : result, blocked });
}
