import { getSupabaseAdmin } from "@/lib/supabase/admin";

// Shared by every /api/admin/* route: verifies the caller's Supabase access
// token belongs to a signed-in user whose profiles.role is "admin". Uses the
// service-role client so it can read any profile regardless of RLS.
export async function verifyAdmin(accessToken: string | undefined) {
  if (!accessToken) return null;

  const admin = getSupabaseAdmin();
  const { data: userData, error: userError } = await admin.auth.getUser(accessToken);
  if (userError || !userData.user) return null;

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", userData.user.id)
    .single();

  if (profileError || profile?.role !== "admin") return null;

  return userData.user;
}
