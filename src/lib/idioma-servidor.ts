// Idioma de la petición en los componentes de servidor. Cada página (y el layout) lo fija
// al empezar con fijarIdioma(lang); los componentes de servidor que pinta lo leen con idioma().
// Los componentes de cliente usan useIdioma() / useT() (components/Idioma.tsx).
import { cache } from "react";
import { idiomaDe, traductor, type Idioma } from "./i18n";

const almacen = cache(() => ({ lang: "es" as Idioma }));

export function fijarIdioma(lang: unknown): Idioma {
  const l = idiomaDe(lang);
  almacen().lang = l;
  return l;
}
export function idioma(): Idioma {
  return almacen().lang;
}
export function tServidor() {
  return traductor(idioma());
}
/** Para páginas: lee el idioma de los parámetros, lo fija y devuelve [lang, t]. */
export async function idiomaDePagina(params: Promise<{ lang: string }>) {
  const lang = fijarIdioma((await params).lang);
  return { lang, t: traductor(lang) };
}
