import type { Credito, Obra, Persona } from "./types";

export function nombreCompleto(p: Pick<Persona, "Nombre" | "Apellidos">): string {
  return [p.Nombre, p.Apellidos].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

export function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function anio(v: unknown): string {
  if (v === undefined || v === null) return "";
  const s = String(v).trim();
  return s === "0" || s === "NaN" ? "" : s;
}

/** "2015 – actualidad", "2023 – 2024" o "2019" */
export function periodo(inicio: unknown, fin: unknown): string {
  const a = anio(inicio);
  const b = anio(fin);
  if (!a && !b) return "";
  if (a && !b) return `${a} – actualidad`;
  if (!a) return b;
  return a === b ? a : `${a} – ${b}`;
}

export function obraActiva(o: Obra): boolean {
  return !anio(o.anofin);
}

export function recortar(texto: string | undefined, max = 160): string {
  if (!texto) return "";
  const limpio = texto.replace(/\s+/g, " ").trim();
  if (limpio.length <= max) return limpio;
  return limpio.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}

// Carteles y retratos llenan un marco vertical 2:3. Si la imagen tiene otra
// proporción, se recorta: Cloudinary elige la zona importante (g_auto) o la cara (g_face).
export const PROPORCION = { ancho: 2, alto: 3, texto: "vertical 2:3", px: "1000 × 1500 px" };
export const T_CARTEL = "c_fill,g_auto,w_600,h_900,f_auto,q_auto";
export const T_RETRATO = "c_fill,g_face,w_600,h_900,f_auto,q_auto";
export const T_MINI = "c_fill,g_auto,w_68,h_102,f_auto,q_auto";
export const T_MINI_RETRATO = "c_fill,g_face,w_68,h_102,f_auto,q_auto";
export const T_LOGO = "c_pad,b_auto,w_480,h_480,f_auto,q_auto";
export const T_OG = "c_fill,g_auto,w_1200,h_630,f_jpg,q_auto"; // imagen para compartir en redes

/** Inserta una transformación en una URL de Cloudinary (recorte, tamaño, formato automático). */
export function cld(url: string | undefined, transform: string): string | undefined {
  // Las imágenes "por defecto" de la web antigua se tratan como si no hubiera foto
  if (!url || url.includes("/imagenesdefecto/")) return undefined;
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/${transform}/`);
}

export function instagramUrl(handle?: string): string | undefined {
  if (!handle) return undefined;
  const h = handle.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/^@/, "").replace(/\/$/, "");
  return /^[A-Za-z0-9._]{1,30}$/.test(h) ? `https://www.instagram.com/${h}` : undefined;
}

export function instagramHandle(handle?: string): string | undefined {
  const url = instagramUrl(handle);
  return url ? "@" + url.split("/").pop() : undefined;
}

/** Agrupa los créditos por departamento en un orden razonable. */
const ORDEN = ["Interpretación", "Dirección", "Dramaturgia", "Guion", "Ayudantía de dirección", "Producción", "Escenografía", "Iluminación", "Vestuario", "Sonido", "Música", "Coreografía", "Fotografía", "Diseño gráfico"];

export function departamento(c: Pick<Credito, "puesto">): string {
  const p = (c.puesto ?? "").trim();
  if (!p) return "Equipo";
  if (/actor|actriz|interpre|elenco|reparto|interpretación/i.test(p)) return "Interpretación";
  return p.charAt(0).toUpperCase() + p.slice(1);
}

export function agruparPorDepartamento<T extends Pick<Credito, "puesto">>(items: T[]): { dep: string; items: T[] }[] {
  const map = new Map<string, T[]>();
  for (const it of items) {
    const d = departamento(it);
    map.set(d, [...(map.get(d) ?? []), it]);
  }
  return [...map.entries()]
    .sort(([a], [b]) => {
      const ia = ORDEN.indexOf(a), ib = ORDEN.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b, "es");
    })
    .map(([dep, items]) => ({ dep, items }));
}

/** Color de cartel estable a partir del id, para cuando no hay imagen. */
const POSTERS = ["#8E1E24", "#24413B", "#2B2F4A", "#4A2E1E", "#3D3550", "#5A2A2E"];
export function colorCartel(id: string): string {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return POSTERS[h % POSTERS.length];
}

export const DEPARTAMENTOS = ["Interpretación", "Dirección", "Dramaturgia", "Ayudantía de dirección", "Producción", "Escenografía", "Iluminación", "Vestuario", "Sonido", "Música", "Coreografía", "Fotografía"];
export const GENEROS = ["Teatro", "Comedia", "Drama", "Monólogo", "Stand up", "Impro", "Musical", "Danza", "Circo", "Infantil", "Clásico", "Performance", "Títeres", "Ópera"];
export const ROLES = ["Interpretación", "Dirección", "Dramaturgia", "Producción", "Doblaje", "Danza", "Iluminación", "Escenografía", "Vestuario", "Música", "Técnica"];
