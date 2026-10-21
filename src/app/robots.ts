import type { MetadataRoute } from "next";
import { generateSitemaps } from "./sitemap";
import { SITE_URL } from "@/lib/firebase-config";

export const revalidate = 3600;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const trozos = await generateSitemaps();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/panel", "/api/", "/login", "/signup", "/reclamar", "/buscar"] }],
    // Un archivo por tramo de 5.000 fichas (Next.js los sirve en /sitemap/N.xml)
    sitemap: trozos.map((t) => `${SITE_URL}/sitemap/${t.id}.xml`),
    host: SITE_URL,
  };
}
