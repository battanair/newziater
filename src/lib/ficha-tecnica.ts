// Ficha técnica ampliada de una obra: campos opcionales que rellena quien la gestiona.
import type { Obra } from "./types";

export const EDADES = ["Todos los públicos", "Infantil (0-3 años)", "Infantil (3-6 años)", "Infantil (+6 años)", "Familiar", "+12", "+16", "+18"];
export const ACCESIBILIDAD = ["Subtítulos", "Sobretítulos en otro idioma", "Audiodescripción", "Lengua de signos", "Bucle magnético", "Función relajada", "Accesible en silla de ruedas"];
export const AVISOS = ["Luces estroboscópicas", "Humo o niebla", "Ruidos fuertes", "Desnudos", "Violencia", "Lenguaje explícito", "Temas sensibles", "Interacción con el público"];

export interface FichaTecnica {
  edad: string;
  basada_en: string;
  basada_autor: string;
  estreno_fecha: string; // AAAA-MM-DD
  estreno_lugar: string;
  accesibilidad: string[];
  avisos: string[];
  id_productora: string;
  productora_nombre: string; // solo para mostrar en el editor
  compania: string; // compañía que aún no está en Ziater
  apoyos: string;
  gira: boolean;
  distribucion: string; // email o web de contacto para contratar
}

export const FICHA_VACIA: FichaTecnica = { edad: "", basada_en: "", basada_autor: "", estreno_fecha: "", estreno_lugar: "", accesibilidad: [], avisos: [], id_productora: "", productora_nombre: "", compania: "", apoyos: "", gira: false, distribucion: "" };

export function fichaDesde(o: Partial<Obra> | Record<string, unknown>): FichaTecnica {
  const x = o as Record<string, unknown>;
  const s = (k: string) => (typeof x[k] === "string" ? (x[k] as string) : "");
  const l = (k: string, ok: string[]) => (Array.isArray(x[k]) ? (x[k] as string[]).filter((v) => ok.includes(v)) : []);
  return {
    edad: s("edad"), basada_en: s("basada_en"), basada_autor: s("basada_autor"), estreno_fecha: s("estreno_fecha"), estreno_lugar: s("estreno_lugar"),
    accesibilidad: l("accesibilidad", ACCESIBILIDAD), avisos: l("avisos", AVISOS), id_productora: s("id_productora"), productora_nombre: "",
    compania: s("compania"), apoyos: s("apoyos"), gira: x.gira === true, distribucion: s("distribucion"),
  };
}

/** Contacto de distribución válido: un email o un enlace https. */
export function contactoDistribucion(v?: string): { tipo: "email" | "web"; href: string; texto: string } | null {
  const t = String(v ?? "").trim();
  if (/^[^\s@<>"']+@[^\s@<>"']+\.[a-z]{2,}$/i.test(t)) return { tipo: "email", href: `mailto:${t}`, texto: t };
  const web = /^https?:\/\//i.test(t) ? t : t && /^[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(t) ? `https://${t}` : "";
  return web && /^https:\/\/[^\s<>"']+$/i.test(web.replace(/^http:/i, "https:")) ? { tipo: "web", href: web.replace(/^http:/i, "https:"), texto: t.replace(/^https?:\/\//i, "") } : null;
}

/** Datos listos para guardar en la obra (recortados y validados). */
export function fichaADatos(ft: FichaTecnica) {
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(ft.estreno_fecha) ? ft.estreno_fecha : "";
  return {
    edad: ft.edad.trim().slice(0, 20), // admite valores antiguos que no están en la lista
    basada_en: ft.basada_en.trim().slice(0, 200),
    basada_autor: ft.basada_autor.trim().slice(0, 150),
    estreno_fecha: fecha,
    estreno_lugar: ft.estreno_lugar.trim().slice(0, 150),
    accesibilidad: ft.accesibilidad.filter((v) => ACCESIBILIDAD.includes(v)),
    avisos: ft.avisos.filter((v) => AVISOS.includes(v)),
    id_productora: /^[A-Za-z0-9_-]{1,64}$/.test(ft.id_productora) ? ft.id_productora : "",
    compania: ft.id_productora ? "" : ft.compania.trim().slice(0, 150),
    apoyos: ft.apoyos.trim().slice(0, 300),
    gira: ft.gira,
    distribucion: ft.gira && contactoDistribucion(ft.distribucion) ? ft.distribucion.trim().slice(0, 200) : "",
  };
}
