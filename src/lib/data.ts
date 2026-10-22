import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import {
  collection, doc, documentId, getCountFromServer, getDoc, getDocs, limit, orderBy, query,
  startAfter, where, type QueryConstraint,
} from "firebase/firestore";
import { serverDb as db } from "./firebase-server";
import type { Credito, Obra, Persona, PremioObra, Productora, SearchItem } from "./types";
import { T_MINI, cld, nombreCompleto, periodo } from "./format";
import { normalizar, partirBusqueda } from "./claves";

// ============================================================================
// Acceso a datos para las páginas públicas.
// Regla de escalabilidad: NINGUNA función lee una colección entera. Todo va
// con limit(), cursores o claves, así el coste no crece con el número de fichas.
// ============================================================================

const ID_RE = /^[A-Za-z0-9_-]{6,64}$/;
export const validId = (id: string) => ID_RE.test(id);

function withId<T>(snap: { id: string; data: () => unknown }): T {
  return JSON.parse(JSON.stringify({ id: snap.id, ...(snap.data() as object) })) as T;
}

// Caché compartida entre visitas (1 h) + caché por petición. /api/revalidar la
// invalida al momento cuando alguien edita una ficha.
export const CACHE_TAG = "ziater";
function memo<A extends unknown[], R>(name: string, fn: (...args: A) => Promise<R>, revalidate = 3600) {
  return cache(unstable_cache(fn, [name], { revalidate, tags: [CACHE_TAG] }));
}

// ---------- Fichas sueltas ----------
export const getObra = memo("getObra", async (id: string): Promise<Obra | null> => {
  if (!validId(id)) return null;
  const s = await getDoc(doc(db, "obra", id));
  return s.exists() ? withId<Obra>(s) : null;
});

export const getPersona = memo("getPersona", async (id: string): Promise<Persona | null> => {
  if (!validId(id)) return null;
  const s = await getDoc(doc(db, "persona", id));
  return s.exists() ? withId<Persona>(s) : null;
});

export const getProductora = memo("getProductora", async (id: string): Promise<Productora | null> => {
  if (!validId(id)) return null;
  const s = await getDoc(doc(db, "productoras", id));
  return s.exists() ? withId<Productora>(s) : null;
});

// ---------- Selecciones para portada ----------
/** Las mejor valoradas según la puntuación ponderada (solo obras con algún voto). */
export const obrasMejorValoradas = memo("obrasMejorValoradas", async (n: number): Promise<Obra[]> => {
  const s = await getDocs(query(collection(db, "obra"), orderBy("puntuacion", "desc"), limit(Math.min(n, 48))));
  return s.docs.map((d) => withId<Obra>(d));
});

/** Las últimas fichas creadas (campo "creado"; el script de migración lo añade a las antiguas). */
export const obrasRecientes = memo("obrasRecientes", async (n: number): Promise<Obra[]> => {
  const s = await getDocs(query(collection(db, "obra"), orderBy("creado", "desc"), limit(Math.min(n, 48))));
  return s.docs.map((d) => withId<Obra>(d));
});

export const productorasDestacadas = memo("productorasDestacadas", async (n: number): Promise<Productora[]> => {
  const s = await getDocs(query(collection(db, "productoras"), limit(Math.min(n, 48))));
  return s.docs.map((d) => withId<Productora>(d));
});

/** Artistas de las obras mejor valoradas: una selección que se renueva sola con las notas. */
export const artistasDestacados = memo("artistasDestacados", async (n: number): Promise<Persona[]> => {
  const top = await obrasMejorValoradas(12);
  const ids: string[] = [];
  for (const o of top) {
    for (const c of await creditosDeObra(o.id)) if (!ids.includes(c.id_persona)) ids.push(c.id_persona);
    if (ids.length >= n * 2) break;
  }
  const personas = (await Promise.all(ids.map((id) => getPersona(id)))).filter((p): p is Persona => Boolean(p?.Nombre?.trim()));
  // Primero las que tienen foto propia
  return personas.sort((a, b) => Number(Boolean(cld(b.foto, "x"))) - Number(Boolean(cld(a.foto, "x")))).slice(0, n);
});

// ---------- Listados paginados (cursor) ----------
export const POR_PAGINA = 24;
export type OrdenObras = "valoradas" | "recientes" | "titulo";

export const paginaObras = memo(
  "paginaObras",
  async (opts: { orden: OrdenObras; genero?: string; despues?: string }): Promise<{ items: Obra[]; siguiente?: string }> => {
    const c: QueryConstraint[] = [];
    if (opts.genero) c.push(where("categoria", "array-contains", opts.genero.slice(0, 40)));
    c.push(opts.orden === "valoradas" ? orderBy("puntuacion", "desc") : opts.orden === "recientes" ? orderBy("creado", "desc") : orderBy("titulo"));
    if (opts.despues && validId(opts.despues)) {
      const cur = await getDoc(doc(db, "obra", opts.despues));
      if (cur.exists()) c.push(startAfter(cur));
    }
    c.push(limit(POR_PAGINA + 1));
    const s = await getDocs(query(collection(db, "obra"), ...c));
    const docs = s.docs.slice(0, POR_PAGINA);
    return { items: docs.map((d) => withId<Obra>(d)), siguiente: s.docs.length > POR_PAGINA ? docs[docs.length - 1].id : undefined };
  },
);

export const paginaPersonas = memo(
  "paginaPersonas",
  async (opts: { despues?: string }): Promise<{ items: Persona[]; siguiente?: string }> => {
    const c: QueryConstraint[] = [orderBy("Nombre")];
    if (opts.despues && validId(opts.despues)) {
      const cur = await getDoc(doc(db, "persona", opts.despues));
      if (cur.exists()) c.push(startAfter(cur));
    }
    c.push(limit(48 + 1));
    const s = await getDocs(query(collection(db, "persona"), ...c));
    const docs = s.docs.slice(0, 48);
    return { items: docs.map((d) => withId<Persona>(d)).filter((p) => p.Nombre?.trim()), siguiente: s.docs.length > 48 ? docs[docs.length - 1].id : undefined };
  },
);

export const paginaProductoras = memo("paginaProductoras", async (opts: { despues?: string }): Promise<{ items: Productora[]; siguiente?: string }> => {
  const c: QueryConstraint[] = [orderBy("nombre_prod")];
  if (opts.despues && validId(opts.despues)) {
    const cur = await getDoc(doc(db, "productoras", opts.despues));
    if (cur.exists()) c.push(startAfter(cur));
  }
  c.push(limit(48 + 1));
  const s = await getDocs(query(collection(db, "productoras"), ...c));
  const docs = s.docs.slice(0, 48);
  return { items: docs.map((d) => withId<Productora>(d)), siguiente: s.docs.length > 48 ? docs[docs.length - 1].id : undefined };
});

/** Obras parecidas: comparten género, de la mejor valorada a la peor. */
export const obrasRelacionadas = memo("obrasRelacionadas", async (obra: Pick<Obra, "id" | "categoria">): Promise<Obra[]> => {
  const generos = (obra.categoria ?? []).filter(Boolean).slice(0, 10);
  if (!generos.length) return [];
  const s = await getDocs(query(collection(db, "obra"), where("categoria", "array-contains-any", generos), limit(12)));
  return s.docs.map((d) => withId<Obra>(d)).filter((o) => o.id !== obra.id)
    .sort((a, b) => (b.puntuacion ?? 0) - (a.puntuacion ?? 0)).slice(0, 4);
});

// ---------- Créditos (por obra o por persona: crecen con la ficha, no con la web) ----------
export const creditosDeObra = memo("creditosDeObra", async (idObra: string): Promise<Credito[]> => {
  if (!validId(idObra)) return [];
  const s = await getDocs(query(collection(db, "persona_obra"), where("id_obra", "==", idObra), limit(300)));
  return s.docs.map((d) => withId<Credito>(d));
});

export const creditosDePersona = memo("creditosDePersona", async (idPersona: string): Promise<Credito[]> => {
  if (!validId(idPersona)) return [];
  const s = await getDocs(query(collection(db, "persona_obra"), where("id_persona", "==", idPersona), limit(500)));
  return s.docs.map((d) => withId<Credito>(d));
});

export const premiosDeObra = memo("premiosDeObra", async (idObra: string): Promise<PremioObra[]> => {
  if (!validId(idObra)) return [];
  const s = await getDocs(query(collection(db, "premios_obras"), where("id_obra", "==", idObra), limit(50)));
  return s.docs.map((d) => withId<PremioObra>(d)).filter((p) => p.galardon_obra);
});

export const obrasDeProductora = memo("obrasDeProductora", async (idProd: string): Promise<Obra[]> => {
  if (!validId(idProd)) return [];
  const s = await getDocs(query(collection(db, "obra"), where("id_productora", "==", idProd), limit(200)));
  return s.docs.map((d) => withId<Obra>(d));
});

export async function equipoDeObra(idObra: string) {
  const creditos = await creditosDeObra(idObra);
  const personas = await Promise.all([...new Set(creditos.map((c) => c.id_persona))].map((pid) => getPersona(pid)));
  const porId = new Map(personas.filter(Boolean).map((p) => [p!.id, p!]));
  return creditos
    .map((c) => ({ ...c, persona: porId.get(c.id_persona) }))
    .filter((c): c is Credito & { persona: Persona } => Boolean(c.persona));
}

export async function trayectoriaDePersona(idPersona: string) {
  const creditos = await creditosDePersona(idPersona);
  const obras = await Promise.all([...new Set(creditos.map((c) => c.id_obra))].map((oid) => getObra(oid)));
  const porId = new Map(obras.filter(Boolean).map((o) => [o!.id, o!]));
  return creditos
    .map((c) => ({ ...c, obra: porId.get(c.id_obra) }))
    .filter((c): c is Credito & { obra: Obra } => Boolean(c.obra))
    .sort((a, b) => Number(b.fecha_inicio || b.obra.anoinicio || 0) - Number(a.fecha_inicio || a.obra.anoinicio || 0));
}

// ---------- Búsqueda por claves (una consulta por colección, máx. 8 resultados) ----------
export const buscar = memo(
  "buscar",
  async (q: string, tipos: SearchItem["t"][] = ["obra", "persona", "productora"]): Promise<SearchItem[]> => {
    const partes = partirBusqueda(q);
    if (!partes) return [];
    const coincide = (texto: string) => partes.resto.every((r) => normalizar(texto).includes(r));
    const consulta = (col: string) => getDocs(query(collection(db, col), where("claves", "array-contains", partes.clave), limit(8)));
    const [obras, personas, prods] = await Promise.all([
      tipos.includes("obra") ? consulta("obra") : null,
      tipos.includes("persona") ? consulta("persona") : null,
      tipos.includes("productora") ? consulta("productoras") : null,
    ]);
    const out: SearchItem[] = [];
    obras?.docs.map((d) => withId<Obra>(d)).forEach((o) => { if (coincide(o.titulo)) out.push({ t: "obra", id: o.id, n: o.titulo, s: periodo(o.anoinicio, o.anofin), img: cld(o.cartel, T_MINI) }); });
    personas?.docs.map((d) => withId<Persona>(d)).forEach((p) => { if (coincide(nombreCompleto(p))) out.push({ t: "persona", id: p.id, n: nombreCompleto(p), s: (p.roles ?? []).join(" · "), img: cld(p.foto, T_MINI) }); });
    prods?.docs.map((d) => withId<Productora>(d)).forEach((p) => { if (coincide(p.nombre_prod)) out.push({ t: "productora", id: p.id, n: p.nombre_prod, img: cld(p.foto_prod, T_MINI) }); });
    return out;
  },
  300,
);

// ---------- Sitemap troceado (Google admite 50.000 URLs por archivo) ----------
export const URLS_POR_SITEMAP = 5000;
export const contar = memo("contar", async (col: "obra" | "persona" | "productoras") => (await getCountFromServer(collection(db, col))).data().count);

export const idsPagina = memo("idsPagina", async (col: "obra" | "persona" | "productoras", pagina: number): Promise<string[]> => {
  let ultimo: string | undefined;
  for (let p = 0; p <= pagina; p++) {
    const c: QueryConstraint[] = [orderBy(documentId())];
    if (ultimo) c.push(startAfter(ultimo));
    c.push(limit(URLS_POR_SITEMAP));
    const s = await getDocs(query(collection(db, col), ...c));
    if (p === pagina) return s.docs.map((d) => d.id);
    if (s.docs.length < URLS_POR_SITEMAP) return [];
    ultimo = s.docs[s.docs.length - 1].id;
  }
  return [];
});
