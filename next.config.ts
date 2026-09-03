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

// Origin-only (no path) — used in the CSP below for both API calls
// (connect-src) and Storage-hosted images (img-src). Supabase URLs are
// always plain https origins, so this is safe even if the env var is
// unset in a given environment (falls back to an empty, harmless string).
const supabaseOrigin = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const isDev = process.env.NODE_ENV === "development";

// Deliberately the simpler next.config.ts headers() approach (no
// nonce/middleware) — Next.js's own docs present this as the supported
// path for apps that don't need nonce-level strictness, and a nonce-based
// CSP requires forcing every page to dynamic rendering (killing this app's
// existing static optimization on / and most of /admin) plus a new
// proxy/middleware file, neither of which this remediation pass should
// introduce.
//
// 'unsafe-inline' is kept ONLY on script-src and style-src, and only
// because removing it would break real, in-use behavior — not left in out
// of laziness:
//   - script-src: Next.js's own App Router injects inline <script> tags on
//     every page carrying the RSC/hydration payload (framework-generated,
//     not ours) — unavoidable without the nonce+middleware approach above.
//     Also covers our one inline script, the admin theme FOUC-prevention
//     snippet in AdminThemeContext.tsx (a fixed string, no user data).
//   - style-src: this app renders many DB-driven colors via React's
//     `style={{...}}` prop (tier colors, advisor colors, status badges,
//     chart series) across dozens of components — all inline `style`
//     attributes, which style-src governs. Refactoring all of those to a
//     nonce/class-based scheme is a real, unrelated refactor, out of scope
//     for a security-headers pass.
// 'unsafe-eval' is intentionally NOT included — production Next.js/React
// don't need it (only next dev's error-overlay does), so it's dev-only.
const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data:${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
  "font-src 'self'",
  `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin} ${supabaseOrigin.replace("https://", "wss://")}` : ""}`,
  // Wompi's checkout is a real GET <form> navigation (CardCheckoutBox.tsx),
  // never a fetch/XHR — governed by form-action, not connect-src.
  "form-action 'self' https://checkout.wompi.co",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
]
  .join("; ")
  .trim();

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspDirectives },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SITE_URL: resolvedSiteUrl,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
