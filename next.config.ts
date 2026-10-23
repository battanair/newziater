import type { NextConfig } from "next";

// Política de seguridad de contenidos: solo se permiten los servicios que usa Ziater.
const csp = [
  "default-src 'self'",
  // Next.js necesita 'unsafe-inline' para sus scripts de hidratación; Google para el login con popup
  "script-src 'self' 'unsafe-inline' https://apis.google.com https://www.gstatic.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com https://api.cloudinary.com",
  "frame-src https://*.firebaseapp.com https://accounts.google.com https://www.instagram.com https://www.youtube-nocookie.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Necesario para que funcione el popup de login de Google
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    // Cloudinary ya optimiza (f_auto, q_auto): así no se gasta la cuota de imágenes de Vercel
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/dk0vvcpyn/**" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Solo se indexa el dominio oficial; ziater.vercel.app y las vistas previas no compiten con él
      { source: "/:path*", missing: [{ type: "host", value: "ziater.com" }], headers: [{ key: "X-Robots-Tag", value: "noindex" }] },
    ];
  },
  async redirects() {
    // Mantiene vivas las URLs antiguas que Google ya tiene indexadas
    return [
      { source: "/todoelequipo/:id", destination: "/obra/:id#equipo", permanent: true },
      { source: "/dashboard", destination: "/panel", permanent: true },
      { source: "/dashboard/editar", destination: "/panel/ficha", permanent: true },
      { source: "/dashboard/cuenta", destination: "/panel/cuenta", permanent: true },
      { source: "/artistas", destination: "/personas", permanent: true },
    ];
  },
};

export default nextConfig;
