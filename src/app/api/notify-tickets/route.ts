import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendTicketsAvailableEmail } from "@/lib/email/send";
import { SITE_URL } from "@/lib/email/config";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-admin-secret");
  if (!secret || secret !== process.env.ADMIN_NOTIFY_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { match, rival, date, stadium, matchId } = await request.json();

  if (!match || !rival || !date || !stadium) {
    return NextResponse.json(
      { error: "Missing match, rival, date or stadium" },
      { status: 400 },
    );
  }

  const buyUrl = matchId ? `${SITE_URL}/comprar?match=${matchId}` : `${SITE_URL}/comprar`;

  const { data: profiles, error } = await getSupabaseAdmin()
    .from("profiles")
    .select("email");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const emails = (profiles ?? [])
    .map((row) => row.email as string | null)
    .filter((email): email is string => Boolean(email));

  let sent = 0;
  let failed = 0;

  for (const email of emails) {
    try {
      await sendTicketsAvailableEmail(email, { match, rival, date, stadium, buyUrl });
      sent += 1;
    } catch (err) {
      console.error(`Failed to notify ${email}`, err);
      failed += 1;
    }
    await sleep(150);
  }

  return NextResponse.json({ total: emails.length, sent, failed });
}
