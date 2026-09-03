import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
// Generous on purpose: many real visitors can legitimately share one IP
// (offices, campuses, carrier-grade NAT), and this only needs to stop
// bot-driven floods, not normal browsing.
const RATE_LIMIT_MAX = 30;

// Public, unauthenticated route — fired once per browsing session by
// VisitTracker.tsx. Never throws; a tracking failure must never surface
// to a visitor, mirrors /api/checkout's fire-and-forget contract.
export async function POST(request: NextRequest) {
  try {
    const { limited } = await checkRateLimit({
      route: "visit",
      identifier: clientIp(request),
      windowMs: RATE_LIMIT_WINDOW_MS,
      max: RATE_LIMIT_MAX,
    });
    if (limited) {
      return NextResponse.json({ ok: false }, { status: 429 });
    }

    const { visitorId, sessionId, path } = await request.json();
    if (!visitorId || !sessionId) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const { error } = await getSupabaseAdmin()
      .from("site_visits")
      .insert({ visitor_id: visitorId, session_id: sessionId, path: path ?? null });

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
