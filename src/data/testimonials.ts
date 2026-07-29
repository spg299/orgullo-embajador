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
  screenshot_url: string | null;
  rating: number;
}

// No static fallback content: testimonials are entirely admin-authored from
// /admin/testimonials, so an empty result just means none have been added
// (or activated) yet — the section hides itself rather than showing fakes.
export async function fetchTestimonials(): Promise<Testimonial[]> {
  const { data, error } = await supabase
    .from("testimonials")
    .select("id, name, message, image_url, screenshot_url, rating")
    .eq("active", true)
    .order("sort_order");
  if (error || !data) return [];

  return (data as TestimonialRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    message: row.message,
    imageUrl: row.image_url,
    screenshotUrl: row.screenshot_url,
    rating: row.rating,
  }));
}
