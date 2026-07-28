import type { NextConfig } from "next";

// Resolve the public site URL once, at build time, so email/auth redirect
// links always point at the right place without anyone having to remember
// to set NEXT_PUBLIC_SITE_URL by hand:
// - An explicit NEXT_PUBLIC_SITE_URL always wins (manual override).
// - On Vercel's Production environment, use the stable production domain.
// - On any other Vercel deployment (preview branches), use that deployment's
//   own URL, so preview links don't accidentally point at production.
// - Outside Vercel entirely (local `next dev`), fall back to localhost.
const resolvedSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SITE_URL: resolvedSiteUrl,
  },
};

export default nextConfig;
