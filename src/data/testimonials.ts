import { supabase } from "@/lib/supabase/client";

export interface Testimonial {
  id: string;
  name: string;
  message: string;
  imageUrl: string | null;
  screenshotUrl: string | null;
  rating: number;
}

interface TestimonialRow {
  id: string;
  name: string;
  message: string;
  image_url: string | null;
  screenshot_url?: string | null;
  rating?: number | null;
}

// No static fallback content: testimonials are entirely admin-authored from
// /admin/testimonials, so an empty result just means none have been added
// (or activated) yet — the section hides itself rather than showing fakes.
//
// Uses select("*") rather than an explicit column list: PostgREST rejects
// the entire query if any named column isn't in its schema cache yet (e.g.
// screenshot_url/rating right after their migration runs, before the cache
// reloads), which would otherwise hide every testimonial instead of just
// degrading the fields that aren't ready yet.
export async function fetchTestimonials(): Promise<Testimonial[]> {
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .eq("active", true)
    .order("sort_order");
  if (error || !data) return [];

  return (data as TestimonialRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    message: row.message,
    imageUrl: row.image_url,
    screenshotUrl: row.screenshot_url ?? null,
    rating: row.rating ?? 5,
  }));
}
