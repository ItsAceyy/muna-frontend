import type { NextConfig } from "next";
import { API_URL } from "./lib/api-url";

const isDev = process.env.NODE_ENV === "development";
// Vercel's preview toolbar (comments on preview deployments) loads from vercel.live.
// Production does not need it, so it is allowed on previews only.
const isPreview = process.env.VERCEL_ENV === "preview";
const vercelLive = isPreview ? " https://vercel.live" : "";
const apiOrigin = new URL(API_URL).origin;

// Content-Security-Policy, without nonces: nonces would force every page to
// render per request, and this app's pages are static. 'unsafe-inline' scripts
// are the price of that, so the value here is everything around them:
//   - connect-src: the session token lives in localStorage, so a script that got
//     in could read it - but it can only send it to this site or the Muna API.
//   - img-src: no image beacons to anywhere else either.
//   - frame-ancestors / form-action / base-uri / object-src: no clickjacking,
//     form hijacking, base-tag injection or plugins.
// Photos come from Supabase Storage. React needs 'unsafe-eval' in development
// only. See node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${vercelLive}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self' data:",
  `connect-src 'self' ${apiOrigin}${vercelLive}${isPreview ? " wss://ws-us3.pusher.com" : ""}`,
  "media-src 'self' blob:",
  `frame-src 'self'${vercelLive}`,
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // The guard console and the guest check-in page take photos, so the
          // camera stays available to this origin and nothing else.
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
