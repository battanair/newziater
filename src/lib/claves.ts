// Claves de búsqueda: prefijos de cada palabra del nombre, sin tildes y en minúsculas.
// Se guardan en cada ficha (campo "claves") para buscar con una sola consulta
// "array-contains", que escala a millones de fichas sin descargar nada más.
//   "Isabel Bernal" → ["is", "isa", "isab", …, "be", "ber", …, "bernal"]

export function normalizar(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9ñ\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function clavesDe(...textos: (string | undefined)[]): string[] {
  const set = new Set<string>();
  for (const palabra of normalizar(textos.filter(Boolean).join(" ")).split(" ")) {
    for (let i = 2; i <= Math.min(palabra.length, 15); i++) set.add(palabra.slice(0, i));
  }
  return [...set].slice(0, 200);
}

/** Primera palabra útil de la búsqueda (la que se consulta en Firestore) y el resto (se filtra después). */
export function partirBusqueda(q: string): { clave: string; resto: string[] } | null {
  const palabras = normalizar(q).split(" ").filter((p) => p.length >= 2);
  if (!palabras.length) return null;
  palabras.sort((a, b) => b.length - a.length); // la más larga es la más selectiva
  return { clave: palabras[0].slice(0, 15), resto: palabras.slice(1) };
}

// ---- Puntuación ponderada (media bayesiana) ----
// Evita que una obra con un solo 10 supere a otra con cien 9. Cada obra parte
// de M votos "virtuales" de nota C; con muchos votos manda su media real.
export const M_VOTOS = 5;
export const C_MEDIA = 7;
export function puntuacion(suma: number, votos: number): number {
  return Math.round(((suma + M_VOTOS * C_MEDIA) / (votos + M_VOTOS)) * 1000) / 1000;
}
export function media(suma: number, votos: number): number {
  return votos ? Math.round((suma / votos) * 100) / 100 : 0;
}
