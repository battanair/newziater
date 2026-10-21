import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { serverDb as db } from "./firebase-server";
import type { Credito, Obra, Persona, PremioObra, Productora, SearchItem } from "./types";
import { cld, nombreCompleto, periodo } from "./format";

// Validación muy estricta del id para que nunca llegue a Firestore una ruta rara.
const ID_RE = /^[A-Za-z0-9_-]{6,64}$/;
export const validId = (id: string) => ID_RE.test(id);

// Convierte a JSON plano (los Timestamp de Firestore no se pueden cachear tal cual)
function withId<T>(snap: { id: string; data: () => unknown }): T {
  return JSON.parse(JSON.stringify({ id: snap.id, ...(snap.data() as object) })) as T;
}

// Caché compartida entre visitas (1 h) + caché por petición. Cuando alguien edita
// una ficha, /api/revalidar invalida la etiqueta "ziater" y todo se refresca al momento.
export const CACHE_TAG = "ziater";
function memo<A extends unknown[], R>(name: string, fn: (...args: A) => Promise<R>) {
  return cache(unstable_cache(fn, [name], { revalidate: 3600, tags: [CACHE_TAG] }));
}

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

export const listObras = memo("listObras", async (max = 500): Promise<Obra[]> => {
  const s = await getDocs(query(collection(db, "obra"), limit(max)));
  return s.docs.map((d) => withId<Obra>(d)).sort((a, b) => Number(b.anoinicio || 0) - Number(a.anoinicio || 0));
});

export const listPersonas = memo("listPersonas", async (max = 1000): Promise<Persona[]> => {
  const s = await getDocs(query(collection(db, "persona"), limit(max)));
  return s.docs.map((d) => withId<Persona>(d)).sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b), "es"));
});

export const listProductoras = memo("listProductoras", async (max = 500): Promise<Productora[]> => {
  const s = await getDocs(query(collection(db, "productoras"), limit(max)));
  return s.docs.map((d) => withId<Productora>(d));
});

export const creditosDeObra = memo("creditosDeObra", async (idObra: string): Promise<Credito[]> => {
  if (!validId(idObra)) return [];
  const s = await getDocs(query(collection(db, "persona_obra"), where("id_obra", "==", idObra)));
  return s.docs.map((d) => withId<Credito>(d));
});

export const creditosDePersona = memo("creditosDePersona", async (idPersona: string): Promise<Credito[]> => {
  if (!validId(idPersona)) return [];
  const s = await getDocs(query(collection(db, "persona_obra"), where("id_persona", "==", idPersona)));
  return s.docs.map((d) => withId<Credito>(d));
});

export const premiosDeObra = memo("premiosDeObra", async (idObra: string): Promise<PremioObra[]> => {
  if (!validId(idObra)) return [];
  const s = await getDocs(query(collection(db, "premios_obras"), where("id_obra", "==", idObra)));
  return s.docs.map((d) => withId<PremioObra>(d)).filter((p) => p.galardon_obra);
});

export const obrasDeProductora = memo("obrasDeProductora", async (idProd: string): Promise<Obra[]> => {
  if (!validId(idProd)) return [];
  const s = await getDocs(query(collection(db, "obra"), where("id_productora", "==", idProd)));
  return s.docs.map((d) => withId<Obra>(d));
});

/** Créditos de una obra con los datos de cada persona. */
export async function equipoDeObra(idObra: string) {
  const creditos = await creditosDeObra(idObra);
  const personas = await Promise.all([...new Set(creditos.map((c) => c.id_persona))].map((pid) => getPersona(pid)));
  const porId = new Map(personas.filter(Boolean).map((p) => [p!.id, p!]));
  return creditos
    .map((c) => ({ ...c, persona: porId.get(c.id_persona) }))
    .filter((c): c is Credito & { persona: Persona } => Boolean(c.persona));
}

/** Créditos de una persona con los datos de cada obra. */
export async function trayectoriaDePersona(idPersona: string) {
  const creditos = await creditosDePersona(idPersona);
  const obras = await Promise.all([...new Set(creditos.map((c) => c.id_obra))].map((oid) => getObra(oid)));
  const porId = new Map(obras.filter(Boolean).map((o) => [o!.id, o!]));
  return creditos
    .map((c) => ({ ...c, obra: porId.get(c.id_obra) }))
    .filter((c): c is Credito & { obra: Obra } => Boolean(c.obra))
    .sort((a, b) => Number(b.fecha_inicio || b.obra.anoinicio || 0) - Number(a.fecha_inicio || a.obra.anoinicio || 0));
}

/** Índice ligero para la búsqueda instantánea. Con más de unas pocas miles de fichas, migrar a Algolia o Typesense. */
export async function indiceBusqueda(): Promise<SearchItem[]> {
  const [obras, personas, prods] = await Promise.all([listObras(), listPersonas(), listProductoras()]);
  return [
    ...obras.map((o) => ({ t: "obra" as const, id: o.id, n: o.titulo, s: periodo(o.anoinicio, o.anofin), img: cld(o.cartel, "c_fill,w_72,h_104,f_auto,q_auto") })),
    ...personas.map((p) => ({ t: "persona" as const, id: p.id, n: nombreCompleto(p), s: (p.roles ?? []).join(" · "), img: cld(p.foto, "c_fill,g_face,w_80,h_80,f_auto,q_auto") })),
    ...prods.map((p) => ({ t: "productora" as const, id: p.id, n: p.nombre_prod, img: cld(p.foto_prod, "c_pad,w_80,h_80,f_auto,q_auto") })),
  ].filter((i) => i.n);
}
