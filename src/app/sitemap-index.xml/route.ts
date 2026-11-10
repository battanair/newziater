import { generateSitemaps } from "../sitemap";
import { SITE_URL } from "@/lib/firebase-config";

export const revalidate = 3600;

/** Índice de sitemaps (se sirve también en /sitemap.xml): la dirección que se da a Google Search Console. */
export async function GET() {
  const trozos = await generateSitemaps();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${trozos.map((t) => `  <sitemap><loc>${SITE_URL}/sitemap/${t.id}.xml</loc></sitemap>`).join("\n")}
</sitemapindex>
`;
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8" } });
}
