import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { sendWelcomeEmail } from "@/lib/email/send";

export async function POST(request: NextRequest) {
  const { idToken, name } = await request.json();

  if (!idToken || !name) {
    return NextResponse.json({ error: "Missing idToken or name" }, { status: 400 });
  }

  let decoded;
  try {
    decoded = await getAdminAuth().verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const { uid, email } = decoded;
  if (!email) {
    return NextResponse.json({ error: "Account has no email" }, { status: 400 });
  }

  const userRef = getAdminDb().collection("users").doc(uid);
  const existing = await userRef.get();

  if (!existing.exists) {
    await userRef.set({
      name,
      email,
      createdAt: FieldValue.serverTimestamp(),
    });

    try {
      await sendWelcomeEmail(email, name);
    } catch (error) {
      console.error("Failed to send welcome email", error);
    }
  }

  return NextResponse.json({ ok: true });
}
