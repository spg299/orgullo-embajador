import { supabase } from "@/lib/supabase/client";

// Static fallback — used until fetchHeroVideos() resolves, and if the
// hero_videos table doesn't exist yet or the request fails for any reason.
export const heroVideos = [
  "/videos/hero-stadium.mp4",
  "/videos/pasion-1.mp4",
  "/videos/pasion-2.mp4",
];

interface HeroVideoRow {
  url: string;
}

export async function fetchHeroVideos(): Promise<string[]> {
  const { data, error } = await supabase
    .from("hero_videos")
    .select("url")
    .eq("active", true)
    .order("sort_order");

  if (error || !data || data.length === 0) return heroVideos;
  return (data as HeroVideoRow[]).map((row) => row.url);
}
