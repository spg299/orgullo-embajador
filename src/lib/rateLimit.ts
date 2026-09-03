import { getSupabaseAdmin } from "@/lib/supabase/admin";

// Durable, cross-instance rate limiting backed by public.rate_limit_events
// (migration 0020) — deliberately NOT an in-memory counter, since Vercel's
// serverless functions run as multiple independent instances with no
// shared memory; an in-process counter would silently under-count. Mirrors
// the pattern already proven in /api/admin/access-log/route.ts.
export async function checkRateLimit({
  route,
  identifier,
  windowMs,
  max,
}: {
  route: string;
  identifier: string;
  windowMs: number;
  max: number;
}): Promise<{ limited: boolean }> {
  const admin = getSupabaseAdmin();
  const key = `${route}:${identifier}`;
  const since = new Date(Date.now() - windowMs).toISOString();

  const { count } = await admin
    .from("rate_limit_events")
    .select("id", { count: "exact", head: true })
    .eq("key", key)
    .gte("created_at", since);

  if ((count ?? 0) >= max) {
    return { limited: true };
  }

  await admin.from("rate_limit_events").insert({ key });
  return { limited: false };
}

// x-forwarded-for can carry a comma-separated chain (client, proxy1, proxy2…);
// the first entry is the original client. Falls back to a constant bucket
// (better than throwing) if the header is ever absent — e.g. local dev.
export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
