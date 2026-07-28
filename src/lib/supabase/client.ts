import { createClient } from "@supabase/supabase-js";

// Safe fallbacks let the app build and render before real Supabase
// credentials are configured. Real auth calls will simply fail until
// NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are set.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://demo.supabase.co";
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "demo-anon-key";

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
