import type { MetadataRoute } from "next";
import { URLS_POR_SITEMAP, contar, idsPagina } from "@/lib/data";
import { SITE_URL } from "@/lib/firebase-config";
import { GENEROS } from "@/lib/format";

// Sitemaps troceados: /sitemap/0.xml, /sitemap/1.xml… con 5.000 fichas cada uno.
// robots.txt lista todos los tramos para Google. Se regeneran cada hora.
export const revalidate = 3600;

const COLS = [
  { col: "obra" as const, ruta: "obra", prioridad: 0.9 },
  { col: "persona" as const, ruta: "persona", prioridad: 0.9 },
  { col: "productoras" as const, ruta: "compania", prioridad: 0.6 },
];

export async function generateSitemaps() {
  const trozos: { id: number }[] = [{ id: 0 }]; // el 0 lleva las páginas generales
  let id = 1;
  for (const c of COLS) {
    const n = await contar(c.col);
    for (let i = 0; i < Math.max(1, Math.ceil(n / URLS_POR_SITEMAP)); i++) trozos.push({ id: id++ });
  }
  return trozos;
}

export default async function sitemap({ id }: { id: number | Promise<number> }): Promise<MetadataRoute.Sitemap> {
  const n = Number(await id);
  if (n === 0) {
    const now = new Date();
    const generales = ["", "/obras", "/personas", "/companias"].map((p) => ({ url: `${SITE_URL}${p}`, lastModified: now, changeFrequency: "daily" as const, priority: p ? 0.8 : 1 }));
    // Una página por género («obras de comedia», «obras de danza»…): misma URL que su canonical
    const generos = GENEROS.map((g) => ({ url: `${SITE_URL}/obras?genero=${encodeURIComponent(g)}`, changeFrequency: "weekly" as const, priority: 0.6 }));
    return [...generales, ...generos];
  }
  // Localiza qué colección y qué tramo corresponde a este número
  let resto = n - 1;
  for (const c of COLS) {
    const trozos = Math.max(1, Math.ceil((await contar(c.col)) / URLS_POR_SITEMAP));
    if (resto < trozos) {
      const ids = await idsPagina(c.col, resto);
      return ids.map((i) => ({ url: `${SITE_URL}/${c.ruta}/${i}`, changeFrequency: "weekly" as const, priority: c.prioridad }));
    }
    resto -= trozos;
  }
  return [];
}
