import { supabase } from "@/lib/supabase/client";

export interface HeroMedia {
  url: string;
  type: "video" | "image";
}

const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif|avif)$/i;

// A single "hero_videos" table backs both videos and static images: the type
// is inferred from the file extension so no schema change (or admin field)
// is needed — just paste a video or image URL in /admin/hero.
export function inferHeroMediaType(url: string): HeroMedia["type"] {
  return IMAGE_EXTENSIONS.test(url) ? "image" : "video";
}

// Static fallback — used until fetchHeroVideos() resolves, and if the
// hero_videos table doesn't exist yet or the request fails for any reason.
export const heroVideos: HeroMedia[] = [
  { url: "/videos/hero-stadium.mp4", type: "video" },
  { url: "/videos/pasion-1.mp4", type: "video" },
  { url: "/videos/pasion-2.mp4", type: "video" },
];

interface HeroVideoRow {
  url: string;
}

export async function fetchHeroVideos(): Promise<HeroMedia[]> {
  const { data, error } = await supabase
    .from("hero_videos")
    .select("url")
    .eq("active", true)
    .order("sort_order");

  if (error || !data || data.length === 0) return heroVideos;
  return (data as HeroVideoRow[]).map((row) => ({
    url: row.url,
    type: inferHeroMediaType(row.url),
  }));
}
