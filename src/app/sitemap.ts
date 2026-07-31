import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/email/config";

// Public, content pages only — /admin/* and auth-flow pages like
// /reset-password are deliberately excluded (nothing there is meant to be
// indexed). This is a single-page site: Partidos/Testimonios/etc. are all
// sections of "/", not separate routes, so there's currently only one URL
// worth listing. /comprar is left out too — it's a transactional checkout
// page keyed by a ?match= query param, not stable content to index.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
