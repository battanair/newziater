import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import {
  collection, doc, documentId, getCountFromServer, getDoc, getDocs, limit, orderBy, query,
  startAfter, where, type QueryConstraint,
} from "firebase/firestore";
import { serverDb as db } from "./firebase-server";
import type { Credito, Obra, Persona, PremioObra, Productora, Sala, SearchItem } from "./types";
import { T_MINI, T_MINI_RETRATO, cld, nombreCompleto, periodo } from "./format";
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

// Caché compartida entre visitas + caché por petición.
// - Al crear o editar desde la web, /api/revalidar la borra AL MOMENTO.
// - Lo que cambie por otras vías (la web antigua, la consola de Firebase) se ve
//   como mucho a los 10 minutos.
// - Cada publicación usa su propia caché (versión = commit), para no servir
//   resultados guardados por una versión anterior del código.
export const CACHE_TAG = "ziater";
const VERSION = (process.env.VERCEL_GIT_COMMIT_SHA ?? "local").slice(0, 7);
function memo<A extends unknown[], R>(name: string, fn: (...args: A) => Promise<R>, revalidate = 600) {
  return cache(unstable_cache(fn, [name, VERSION], { revalidate, tags: [CACHE_TAG] }));
}

// ---------- Salas (si las reglas aún no las permiten, todo sale vacío en vez de fallar) ----------
export const getSala = memo("getSala", async (id: string): Promise<Sala | null> => {
  if (!validId(id)) return null;
  const s = await getDoc(doc(db, "salas", id)).catch(() => null);
  return s?.exists() ? withId<Sala>(s) : null;
});

export const todasLasSalas = memo("todasLasSalas", async (): Promise<Sala[]> => {
  const s = await getDocs(query(collection(db, "salas"), limit(1000))).catch(() => null);
  return (s?.docs ?? []).map((d) => withId<Sala>(d)).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
});

/** Obras que han pasado (o pasarán) por una sala: las que tienen alguna función enlazada a ella. */
export const obrasEnSala = memo("obrasEnSala", async (idSala: string): Promise<Obra[]> => {
  if (!validId(idSala)) return [];
  const s = await getDocs(query(collection(db, "obra"), where("salas_ids", "array-contains", idSala), limit(200))).catch(() => null);
  return (s?.docs ?? []).map((d) => withId<Obra>(d));
});

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
/**
 * Firestore deja fuera de un orderBy los documentos que no tienen ese campo.
 * Las fichas antiguas no tienen "puntuacion" ni "creado" hasta que se ejecuta
 * `npm run migrar -- --aplicar`; mientras tanto se completa con otras fichas
 * (siempre con limit, nunca la colección entera).
 */
async function completar(lista: Obra[], n: number, orden?: "nota"): Promise<Obra[]> {
  if (lista.length >= n) return lista;
  const extra: Obra[] = [];
  try {
    const q = orden ? query(collection(db, "obra"), orderBy(orden, "desc"), limit(n * 2)) : query(collection(db, "obra"), limit(n * 2));
    extra.push(...(await getDocs(q)).docs.map((d) => withId<Obra>(d)));
  } catch { /* índice o campo inexistente: se sigue con el siguiente recurso */ }
  if (orden && lista.length + extra.length < n) return completar([...lista, ...extra.filter((o) => !lista.some((x) => x.id === o.id))], n);
  const ids = new Set(lista.map((o) => o.id));
  return [...lista, ...extra.filter((o) => !ids.has(o.id) && o.titulo?.trim())].slice(0, n);
}

/** Las mejor valoradas según la puntuación ponderada (solo obras con algún voto). */
export const obrasMejorValoradas = memo("obrasMejorValoradas", async (n: number): Promise<Obra[]> => {
  const s = await getDocs(query(collection(db, "obra"), orderBy("puntuacion", "desc"), limit(Math.min(n, 48))));
  return completar(s.docs.map((d) => withId<Obra>(d)), Math.min(n, 48), "nota");
});

/** Las últimas fichas creadas (campo "creado"; el script de migración lo añade a las antiguas). */
export const obrasRecientes = memo("obrasRecientes", async (n: number): Promise<Obra[]> => {
  const s = await getDocs(query(collection(db, "obra"), orderBy("creado", "desc"), limit(Math.min(n, 48))));
  return completar(s.docs.map((d) => withId<Obra>(d)), Math.min(n, 48));
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

type OpcionesPagina = { orden: OrdenObras; genero?: string; despues?: string };
type Pagina<T> = { items: T[]; siguiente?: string };
async function paginaObrasSinCache(opts: OpcionesPagina): Promise<Pagina<Obra>> {
  {
    const c: QueryConstraint[] = [];
    if (opts.genero) c.push(where("categoria", "array-contains", opts.genero.slice(0, 40)));
    c.push(opts.orden === "valoradas" ? orderBy("puntuacion", "desc") : opts.orden === "recientes" ? orderBy("creado", "desc") : orderBy("titulo"));
    if (opts.despues && validId(opts.despues)) {
      const cur = await getDoc(doc(db, "obra", opts.despues));
      if (cur.exists()) c.push(startAfter(cur));
    }
    c.push(limit(POR_PAGINA + 1));
    let s;
    try {
      s = await getDocs(query(collection(db, "obra"), ...c));
    } catch (e) {
      // Falta el índice compuesto (género + orden) mientras no se despliegue
      // firestore.indexes.json: se filtra por género sin ordenar en vez de fallar.
      if (!opts.genero) throw e;
      s = await getDocs(query(collection(db, "obra"), where("categoria", "array-contains", opts.genero.slice(0, 40)), limit(POR_PAGINA + 1)));
      return { items: s.docs.slice(0, POR_PAGINA).map((d) => withId<Obra>(d)) };
    }
    // Antes de migrar, "valoradas" y "recientes" pueden venir vacías: se muestran por título
    if (!s.docs.length && opts.orden !== "titulo") return paginaObrasSinCache({ ...opts, orden: "titulo" });
    const docs = s.docs.slice(0, POR_PAGINA);
    return { items: docs.map((d) => withId<Obra>(d)), siguiente: s.docs.length > POR_PAGINA ? docs[docs.length - 1].id : undefined };
  }
}
export const paginaObras = memo("paginaObras", paginaObrasSinCache);

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
  async (q: string, tipos: SearchItem["t"][] = ["obra", "persona", "productora", "sala"]): Promise<SearchItem[]> => {
    const partes = partirBusqueda(q);
    if (!partes) return [];
    const coincide = (texto: string) => [partes.clave, ...partes.resto].every((r) => normalizar(texto ?? "").includes(r));
    // Búsqueda principal: el campo "claves" (prefijos normalizados).
    // Las fichas antiguas no lo tienen hasta ejecutar la migración, así que
    // además se busca por el comienzo del título/nombre en sus variantes de
    // mayúsculas (consultas de rango sobre un solo campo: no necesitan índice).
    // Solo las 3 primeras letras: así «adrian» también encuentra «Adrián»
    // (el filtro final compara sin tildes).
    const palabra = (q.trim().split(/\s+/)[0] ?? "").slice(0, 3);
    const variantes = [...new Set([palabra, palabra.toLowerCase(), palabra.toUpperCase(), palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()])].filter(Boolean);
    const consulta = async (col: string, campo: string) => {
      const consultas = [
        getDocs(query(collection(db, col), where("claves", "array-contains", partes.clave), limit(8))),
        ...variantes.map((v) => getDocs(query(collection(db, col), where(campo, ">=", v), where(campo, "<=", v + "\uf8ff"), limit(25)))),
      ];
      const vistos = new Set<string>();
      const docs = (await Promise.allSettled(consultas)).flatMap((r) => (r.status === "fulfilled" ? r.value.docs : [])).filter((d) => !vistos.has(d.id) && vistos.add(d.id));
      return { docs };
    };
    const [obras, personas, prods, salas] = await Promise.all([
      tipos.includes("obra") ? consulta("obra", "titulo") : null,
      tipos.includes("persona") ? consulta("persona", "Nombre") : null,
      tipos.includes("productora") ? consulta("productoras", "nombre_prod") : null,
      tipos.includes("sala") ? consulta("salas", "nombre") : null,
    ]);
    const out: SearchItem[] = [];
    obras?.docs.map((d) => withId<Obra>(d)).forEach((o) => { if (coincide(o.titulo)) out.push({ t: "obra", id: o.id, n: o.titulo, s: periodo(o.anoinicio, o.anofin), img: cld(o.cartel, T_MINI) }); });
    personas?.docs.map((d) => withId<Persona>(d)).forEach((p) => { if (coincide(nombreCompleto(p))) out.push({ t: "persona", id: p.id, n: nombreCompleto(p), s: (p.roles ?? []).join(" · "), img: cld(p.foto, T_MINI_RETRATO) }); });
    prods?.docs.map((d) => withId<Productora>(d)).forEach((p) => { if (coincide(p.nombre_prod)) out.push({ t: "productora", id: p.id, n: p.nombre_prod, img: cld(p.foto_prod, T_MINI) }); });
    salas?.docs.map((d) => withId<Sala>(d)).forEach((x) => { if (coincide(x.nombre)) out.push({ t: "sala", id: x.id, n: x.nombre, s: x.ciudad, img: cld(x.foto, T_MINI) }); });
    return out.slice(0, 24);
  },
  300,
);

// ---------- Sitemap troceado (Google admite 50.000 URLs por archivo) ----------
export const URLS_POR_SITEMAP = 5000;
export const contar = memo("contar", async (col: "obra" | "persona" | "productoras" | "salas") => (await getCountFromServer(collection(db, col)).then((r) => r.data().count).catch(() => 0)));

export const idsPagina = memo("idsPagina", async (col: "obra" | "persona" | "productoras" | "salas", pagina: number): Promise<string[]> => {
  let ultimo: string | undefined;
  for (let p = 0; p <= pagina; p++) {
    const c: QueryConstraint[] = [orderBy(documentId())];
    if (ultimo) c.push(startAfter(ultimo));
    c.push(limit(URLS_POR_SITEMAP));
    const s = await getDocs(query(collection(db, col), ...c)).catch(() => null);
    if (!s) return [];
    if (p === pagina) return s.docs.map((d) => d.id);
    if (s.docs.length < URLS_POR_SITEMAP) return [];
    ultimo = s.docs[s.docs.length - 1].id;
  }
  return [];
});

// ---------- Colaboradores (perfil público voluntario) ----------
export interface Aportacion { uid: string; nombre: string; persona_id?: string; obras: number; fichas: number; creditos: number; total: number }

/** Cifras reales de lo que ha aportado alguien (se cuentan en las colecciones públicas, no se pueden inflar). */
async function contarAportaciones(uid: string) {
  const n = async (col: string, campo: string) => (await getCountFromServer(query(collection(db, col), where(campo, "==", uid)))).data().count;
  const [obras, personas, creditos, propia] = await Promise.all([
    n("obra", "creacion"), n("persona", "creacion"), n("persona_obra", "creado_por"),
    getDoc(doc(db, "persona", uid)).then((s) => s.exists() && s.data()?.creacion === uid).catch(() => false),
  ]);
  const fichas = Math.max(0, personas - (propia ? 1 : 0)); // su propia ficha no cuenta como aportación
  return { obras, fichas, creditos, total: obras * 3 + fichas + creditos }; // una obra completa vale más
}

/** Perfil público de colaborador de un usuario (null si no ha querido hacerlo público). */
export const aportacionPublica = memo("aportacionPublica", async (uid: string): Promise<Aportacion | null> => {
  if (!uid || !validId(uid)) return null;
  try {
    const s = await getDoc(doc(db, "colaboradores", uid));
    if (!s.exists() || s.data().publico !== true) return null;
    return { uid, nombre: s.data().nombre ?? "", persona_id: s.data().persona_id || undefined, ...(await contarAportaciones(uid)) };
  } catch {
    return null; // perfil privado: las reglas no dejan leerlo
  }
}, 3600);

/** Ranking de colaboradores que han elegido aparecer. */
export const rankingColaboradores = memo("rankingColaboradores", async (): Promise<Aportacion[]> => {
  // Si las reglas aún no permiten leer «colaboradores», la página sale vacía en vez de fallar
  const s = await getDocs(query(collection(db, "colaboradores"), where("publico", "==", true), limit(200))).catch(() => null);
  if (!s) return [];
  const lista = await Promise.all(s.docs.map(async (d) => ({ uid: d.id, nombre: d.data().nombre ?? "", persona_id: d.data().persona_id || undefined, ...(await contarAportaciones(d.id)) })));
  return lista.filter((a) => a.total > 0 && a.nombre.trim()).sort((a, b) => b.total - a.total).slice(0, 100);
}, 3600);

/** Obras con funciones a partir de hoy, de la más próxima a la más lejana. */
export const obrasEnCartel = memo("obrasEnCartel", async (hoy: string, n: number): Promise<(Obra & { proxima: string })[]> => {
  const s = await getDocs(query(collection(db, "obra"), where("ultima", ">=", hoy), orderBy("ultima"), limit(48))).catch(() => null);
  if (!s) return [];
  return s.docs
    .map((d) => withId<Obra>(d))
    .map((o) => ({ ...o, proxima: (o.funciones ?? []).map((f) => f.fecha).filter((f) => f >= hoy).sort()[0] ?? "" }))
    .filter((o) => o.proxima)
    .sort((a, b) => a.proxima.localeCompare(b.proxima))
    .slice(0, n);
}, 600);
