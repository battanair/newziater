// Idiomas de Ziater. El español es el idioma base: los textos se escriben en español
// en el código, y t("…") los cambia por su traducción (lib/en.ts) cuando la página está en inglés.
// Las direcciones en inglés llevan delante /en (ziater.com/en/obra/…); las de español, nada.
import { EN } from "./en";

export const IDIOMAS = ["es", "en"] as const;
export type Idioma = (typeof IDIOMAS)[number];
export const NOMBRE_IDIOMA: Record<Idioma, string> = { es: "Español", en: "English" };
export const LOCALE: Record<Idioma, string> = { es: "es-ES", en: "en-GB" };
export const OG_LOCALE: Record<Idioma, string> = { es: "es_ES", en: "en_GB" };
export const COOKIE_IDIOMA = "ziater-idioma";

export function esIdioma(v: unknown): v is Idioma {
  return v === "es" || v === "en";
}
export function idiomaDe(v: unknown): Idioma {
  return esIdioma(v) ? v : "es";
}

export type Variables = Record<string, string | number | undefined | null>;
export type T = (texto: string, vars?: Variables) => string;

function rellenar(texto: string, vars?: Variables): string {
  if (!vars) return texto;
  return texto.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k] ?? "") : m));
}

/** Devuelve la función t() de un idioma. Si falta una traducción, se queda el español. */
export function traductor(lang: Idioma): T {
  if (lang === "es") return rellenar;
  return (texto, vars) => rellenar(EN[texto] ?? texto, vars);
}

/** «/obra/abc» → «/en/obra/abc» en inglés. Las direcciones externas o de la API no cambian. */
export function ruta(lang: Idioma, href: string): string {
  if (lang === "es" || !href.startsWith("/") || href.startsWith("//") || href.startsWith("/api/") || href.startsWith("/en/") || href === "/en") return href;
  if (href === "/") return "/en";
  if (href.startsWith("/?") || href.startsWith("/#")) return "/en" + href.slice(1);
  return "/en" + href;
}

/** Quita el prefijo de idioma: «/en/obra/abc» → «/obra/abc». */
export function sinIdioma(path: string): string {
  if (path === "/en") return "/";
  return path.startsWith("/en/") ? path.slice(3) : path;
}

/** Número con los separadores del idioma (8,5 / 8.5). */
export function numero(lang: Idioma, n: number, decimales = 1): string {
  return n.toLocaleString(LOCALE[lang], { maximumFractionDigits: decimales });
}

/** canonical + hreflang de una página: la versión de cada idioma apunta a la otra. */
export function alternos(lang: Idioma, path: string) {
  const en = path === "/" ? "/en" : path.startsWith("/?") ? "/en" + path.slice(1) : "/en" + path;
  return { canonical: lang === "en" ? en : path, languages: { es: path, en, "x-default": path } };
}

/** Marca un texto para traducir más tarde (se pinta con t(texto)). No cambia nada. */
export const m = (texto: string) => texto;
