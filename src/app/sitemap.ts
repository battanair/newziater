import type { MetadataRoute } from "next";
import { URLS_POR_SITEMAP, cartelera, contar, idsPagina } from "@/lib/data";
import { SITE_URL } from "@/lib/firebase-config";
import { GENEROS, hoyES } from "@/lib/format";

// Sitemaps troceados: /sitemap/0.xml, /sitemap/1.xml… con 5.000 fichas cada uno.
// robots.txt lista todos los tramos para Google. Se regeneran cada hora.
export const revalidate = 3600;

const COLS = [
  { col: "obra" as const, ruta: "obra", prioridad: 0.9 },
  { col: "persona" as const, ruta: "persona", prioridad: 0.9 },
  { col: "productoras" as const, ruta: "compania", prioridad: 0.6 },
  { col: "salas" as const, ruta: "sala", prioridad: 0.7 },
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

type Entrada = MetadataRoute.Sitemap[number];
/** Cada página en español y en inglés, enlazadas entre sí (hreflang) para que Google muestre la de cada idioma. */
function dosIdiomas(p: string, extra: Omit<Entrada, "url">): MetadataRoute.Sitemap {
  const es = `${SITE_URL}${p}`;
  const en = `${SITE_URL}/en${p.startsWith("/?") ? p.slice(1) : p}`;
  const alternates = { languages: { es, en, "x-default": es } };
  return [{ url: es, ...extra, alternates }, { url: en, ...extra, alternates }];
}

export default async function sitemap({ id }: { id: number | Promise<number> }): Promise<MetadataRoute.Sitemap> {
  const n = Number(await id);
  if (n === 0) {
    const now = new Date();
    const generales = ["", "/cartelera", "/obras", "/personas", "/companias", "/salas", "/colaboradores", "/politica-de-privacidad", "/terminos-de-uso", "/politica-de-cookies", "/aviso-legal"].flatMap((p) => dosIdiomas(p, { lastModified: now, changeFrequency: "daily", priority: p ? 0.8 : 1 }));
    // Una página por género («obras de comedia», «obras de danza»…): misma URL que su canonical
    const generos = GENEROS.flatMap((g) => dosIdiomas(`/obras?genero=${encodeURIComponent(g)}`, { changeFrequency: "weekly", priority: 0.6 }));
    const ciudades = (await cartelera(hoyES())).ciudades.flatMap((c) => dosIdiomas(`/cartelera/${c.slug}`, { lastModified: now, changeFrequency: "daily", priority: 0.7 }));
    return [...generales, ...generos, ...ciudades];
  }
  // Localiza qué colección y qué tramo corresponde a este número
  let resto = n - 1;
  for (const c of COLS) {
    const trozos = Math.max(1, Math.ceil((await contar(c.col)) / URLS_POR_SITEMAP));
    if (resto < trozos) {
      const ids = await idsPagina(c.col, resto);
      return ids.flatMap((i) => dosIdiomas(`/${c.ruta}/${i}`, { changeFrequency: "weekly", priority: c.prioridad }));
    }
    resto -= trozos;
  }
  return [];
}
