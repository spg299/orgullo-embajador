import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

// Public, unauthenticated route — fired once per browsing session by
// VisitTracker.tsx. Never throws; a tracking failure must never surface
// to a visitor, mirrors /api/checkout's fire-and-forget contract.
export async function POST(request: NextRequest) {
  try {
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
