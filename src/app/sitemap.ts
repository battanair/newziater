import type { MetadataRoute } from "next";
import { listObras, listPersonas, listProductoras } from "@/lib/data";
import { SITE_URL } from "@/lib/firebase-config";

// Mapa del sitio para Google con todas las fichas. Se regenera cada hora.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [obras, personas, prods] = await Promise.all([listObras(), listPersonas(), listProductoras()]);
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/obras`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/personas`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/companias`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    ...obras.map((o) => ({ url: `${SITE_URL}/obra/${o.id}`, changeFrequency: "weekly" as const, priority: 0.9, images: o.cartel ? [o.cartel] : undefined })),
    ...personas.map((p) => ({ url: `${SITE_URL}/persona/${p.id}`, changeFrequency: "weekly" as const, priority: 0.9, images: p.foto ? [p.foto] : undefined })),
    ...prods.map((p) => ({ url: `${SITE_URL}/compania/${p.id}`, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
