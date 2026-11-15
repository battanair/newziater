"use client";

// Sugerencias de cambio, historial de versiones, solicitudes para gestionar
// obras huérfanas y perfil público de colaborador. Las reglas de Firestore
// (firestore.rules) comprueban cada escritura: aquí solo se preparan los datos.

import { addDoc, collection, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from "firebase/firestore";
import { auth, db } from "./firebase-client";
import type { Obra, Persona, Productora, Sala } from "./types";

export type TipoFicha = "obra" | "persona" | "productora" | "sala";
const COL: Record<TipoFicha, string> = { obra: "obra", persona: "persona", productora: "productoras", sala: "salas" };
const withId = <T,>(s: { id: string; data: () => unknown }) => ({ id: s.id, ...(s.data() as object) }) as T;

/** Dueño de una ficha: quien creó la obra/compañía, o el artista que reclamó su ficha ("" = sin dueño). */
export function duenoDe(tipo: TipoFicha, d: Partial<Obra & Persona & Productora>): string {
  if (tipo === "persona") return d.coincide ? d.coincide : d.creacion ?? "";
  return d.creacion ?? "";
}

// ---------------------------------------------------------------- Sugerencias
export const CAMPOS_SUGERENCIA = ["Datos generales", "Sinopsis o biografía", "Fechas", "Elenco y equipo", "Imágenes", "Otro"] as const;

export interface Sugerencia {
  id: string;
  tipo: TipoFicha;
  ref: string;
  titulo_ficha: string;
  dueno: string;
  campo: string;
  texto: string;
  autor: string;
  autor_nombre: string;
  estado: "pendiente" | "aplicada" | "descartada";
  fecha?: { seconds: number };
}

export async function enviarSugerencia(tipo: TipoFicha, ref: string, campo: string, texto: string) {
  const user = auth.currentUser!;
  const s = await getDoc(doc(db, COL[tipo], ref));
  if (!s.exists()) throw new Error("La ficha ya no existe");
  const d = s.data() as Partial<Obra & Persona & Productora> & Partial<Pick<Sala, "nombre">>;
  const titulo = d.titulo ?? d.nombre_prod ?? d.nombre ?? [d.Nombre, d.Apellidos].filter(Boolean).join(" ");
  await addDoc(collection(db, "sugerencias"), {
    tipo, ref,
    titulo_ficha: String(titulo ?? "").slice(0, 200),
    dueno: duenoDe(tipo, d),
    campo: campo.slice(0, 40),
    texto: texto.trim().slice(0, 2000),
    autor: user.uid,
    autor_nombre: (user.displayName ?? "").slice(0, 100),
    estado: "pendiente",
    fecha: serverTimestamp(),
  });
}

/** Sugerencias pendientes para el dueño (o todas las pendientes, para administración). */
export async function sugerenciasPendientes(uid: string | null): Promise<Sugerencia[]> {
  const c = uid ? [where("dueno", "==", uid), where("estado", "==", "pendiente")] : [where("estado", "==", "pendiente")];
  const s = await getDocs(query(collection(db, "sugerencias"), ...c, limit(100)));
  return s.docs.map((x) => withId<Sugerencia>(x)).sort((a, b) => (b.fecha?.seconds ?? 0) - (a.fecha?.seconds ?? 0));
}

export async function resolverSugerencia(id: string, estado: "aplicada" | "descartada") {
  await updateDoc(doc(db, "sugerencias", id), { estado, resuelta: serverTimestamp() });
}

// ------------------------------------------------------------------ Historial
// Antes de guardar cambios en una obra o ficha se guarda cómo estaba, para poder recuperarlo.
export const CAMPOS_HISTORIAL: Record<"obra" | "persona", string[]> = {
  obra: ["titulo", "sinopsis", "anoinicio", "anofin", "cartel", "instagram", "trailer", "categoria", "idioma", "duracion", "fotos_obra", "fotosObra", "funciones",
    "edad", "basada_en", "basada_autor", "estreno_fecha", "estreno_lugar", "accesibilidad", "avisos", "id_productora", "compania", "apoyos", "gira", "distribucion"],
  persona: ["Nombre", "Apellidos", "biografia", "foto", "instagram", "ciudad", "roles", "destacadas"],
};

export interface Version {
  id: string;
  tipo: "obra" | "persona";
  ref: string;
  autor: string;
  fecha?: { seconds: number };
  antes: Record<string, unknown>;
  cambios: string[];
}

/** Guarda la versión anterior si algo cambia. Devuelve false si no había cambios. */
export async function guardarVersion(tipo: "obra" | "persona", ref: string, antes: Record<string, unknown>, despues: Record<string, unknown>) {
  const igual = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  const campos = CAMPOS_HISTORIAL[tipo];
  const cambios = campos.filter((k) => k in despues && !igual(antes[k], despues[k]));
  if (!cambios.length) return false;
  const snap: Record<string, unknown> = {};
  for (const k of campos) if (antes[k] !== undefined) snap[k] = antes[k];
  await addDoc(collection(db, "historial"), { tipo, ref, autor: auth.currentUser!.uid, dueno: auth.currentUser!.uid, fecha: serverTimestamp(), antes: snap, cambios });
  return true;
}

export async function versiones(tipo: "obra" | "persona", ref: string): Promise<Version[]> {
  const s = await getDocs(query(collection(db, "historial"), where("ref", "==", ref), where("dueno", "==", auth.currentUser!.uid), limit(50)));
  return s.docs.map((x) => withId<Version>(x)).filter((v) => v.tipo === tipo).sort((a, b) => (b.fecha?.seconds ?? 0) - (a.fecha?.seconds ?? 0)).slice(0, 20);
}

// --------------------------------------------------- Obras sin dueño activo
export interface SolicitudObra { id: string; obra: string; uid: string; via: "reparto" | "compania"; credito?: string; compania?: string; motivo: string; estado: string; nombre?: string }

/** ¿Puede este usuario pedir gestionar la obra? Devuelve la vía y la prueba (crédito confirmado o compañía propia). */
export async function vinculoConObra(uid: string, obra: Obra, personaId?: string): Promise<{ via: "reparto"; credito: string } | { via: "compania"; compania: string } | null> {
  if (personaId) {
    const cs = await getDocs(query(collection(db, "persona_obra"), where("id_obra", "==", obra.id), where("id_persona", "==", personaId)));
    const c = cs.docs.find((d) => (d.data().estado ?? "confirmado") === "confirmado");
    if (c) return { via: "reparto", credito: c.id };
  }
  if (obra.id_productora) {
    const p = await getDoc(doc(db, "productoras", obra.id_productora));
    if (p.exists() && p.data().creacion === uid) return { via: "compania", compania: p.id };
  }
  return null;
}

export async function pedirGestionarObra(obraId: string, vinculo: NonNullable<Awaited<ReturnType<typeof vinculoConObra>>>, motivo: string) {
  const uid = auth.currentUser!.uid;
  await setDoc(doc(db, "reclamaciones_obra", `${obraId}_${uid}`), {
    obra: obraId, uid, ...vinculo,
    nombre: (auth.currentUser!.displayName ?? "").slice(0, 100),
    motivo: motivo.trim().slice(0, 1000),
    estado: "pendiente",
    fecha: serverTimestamp(),
  });
}

export async function solicitudesObra(): Promise<SolicitudObra[]> {
  const s = await getDocs(query(collection(db, "reclamaciones_obra"), where("estado", "==", "pendiente"), limit(100)));
  return s.docs.map((x) => withId<SolicitudObra>(x));
}

/** Solo administración: pasa la obra a quien la ha pedido. */
export async function aprobarSolicitudObra(s: SolicitudObra) {
  const b = writeBatch(db);
  b.update(doc(db, "obra", s.obra), { creacion: s.uid });
  b.update(doc(db, "reclamaciones_obra", s.id), { estado: "aprobada" });
  await b.commit();
}
export async function rechazarSolicitudObra(id: string) {
  await updateDoc(doc(db, "reclamaciones_obra", id), { estado: "rechazada" });
}

// ------------------------------------------------- Perfil de colaborador
export interface Colaborador { nombre: string; publico: boolean; persona_id?: string }

export async function miColaborador(uid: string): Promise<Colaborador | null> {
  const s = await getDoc(doc(db, "colaboradores", uid)).catch(() => null);
  return s?.exists() ? (s.data() as Colaborador) : null;
}
export async function guardarColaborador(uid: string, c: Colaborador) {
  await setDoc(doc(db, "colaboradores", uid), { nombre: c.nombre.trim().slice(0, 100), publico: c.publico, persona_id: c.persona_id ?? "" });
}


// ------------------------------------------- Gestionar una sala o una compañía
// Quien lleva una sala o una compañía puede pedir hacerse cargo de su ficha
// (por ejemplo, si la creó otra persona). Lo aprueba administración.
export type TipoEntidad = "sala" | "compania";
export const COL_ENTIDAD: Record<TipoEntidad, string> = { sala: "salas", compania: "productoras" };
export interface SolicitudEntidad { id: string; tipo: TipoEntidad; ref: string; uid: string; nombre: string; cargo: string; contacto: string; motivo: string; estado: string }

export async function pedirGestionarEntidad(tipo: TipoEntidad, ref: string, d: { nombre: string; cargo: string; contacto: string; motivo: string }) {
  const uid = auth.currentUser!.uid;
  await setDoc(doc(db, "reclamaciones_entidad", `${tipo}_${ref}_${uid}`), {
    tipo, ref, uid,
    nombre: d.nombre.trim().slice(0, 100),
    cargo: d.cargo.trim().slice(0, 100),
    contacto: d.contacto.trim().slice(0, 200),
    motivo: d.motivo.trim().slice(0, 1000),
    estado: "pendiente",
    fecha: serverTimestamp(),
  });
}

export async function solicitudesEntidad(): Promise<SolicitudEntidad[]> {
  const s = await getDocs(query(collection(db, "reclamaciones_entidad"), where("estado", "==", "pendiente"), limit(100))).catch(() => null);
  return (s?.docs ?? []).map((x) => withId<SolicitudEntidad>(x));
}

/** Solo administración: pasa la sala o la compañía a quien la ha pedido. */
export async function aprobarSolicitudEntidad(s: SolicitudEntidad) {
  const b = writeBatch(db);
  b.update(doc(db, COL_ENTIDAD[s.tipo], s.ref), { creacion: s.uid });
  b.update(doc(db, "reclamaciones_entidad", s.id), { estado: "aprobada" });
  await b.commit();
}
export async function rechazarSolicitudEntidad(id: string) {
  await updateDoc(doc(db, "reclamaciones_entidad", id), { estado: "rechazada" });
}

// ------------------------------------------------ Mis solicitudes (de todo tipo)
export interface MiSolicitud { id: string; tipo: "persona" | "obra" | TipoEntidad; ref: string; nombre: string; estado: "pendiente" | "aprobada" | "rechazada"; fecha: number }

/** Las solicitudes del usuario (fichas, obras, salas y compañías) con su estado, de la más reciente a la más antigua. */
export async function misSolicitudes(uid: string): Promise<MiSolicitud[]> {
  const q = (col: string): Promise<Record<string, unknown>[]> => getDocs(query(collection(db, col), where("uid", "==", uid), limit(50))).then((s) => s.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }) as Record<string, unknown>)).catch(() => []);
  const [fichas, obras, entidades] = await Promise.all([q("reclamaciones"), q("reclamaciones_obra"), q("reclamaciones_entidad")]);
  const base = [
    ...fichas.map((r) => ({ id: String(r.id), tipo: "persona" as const, ref: String(r.id_persona ?? ""), r })),
    ...obras.map((r) => ({ id: String(r.id), tipo: "obra" as const, ref: String(r.obra ?? ""), r })),
    ...entidades.map((r) => ({ id: String(r.id), tipo: (r.tipo === "compania" ? "compania" : "sala") as TipoEntidad, ref: String(r.ref ?? ""), r })),
  ];
  const col: Record<MiSolicitud["tipo"], string> = { persona: "persona", obra: "obra", sala: "salas", compania: "productoras" };
  const out = await Promise.all(base.map(async (b) => {
    const d = await getDoc(doc(db, col[b.tipo], b.ref)).then((x) => (x.exists() ? x.data() : null)).catch(() => null);
    const nombre = !d ? "Ficha" : b.tipo === "persona" ? [d.Nombre, d.Apellidos].filter(Boolean).join(" ") : b.tipo === "obra" ? d.titulo : b.tipo === "compania" ? d.nombre_prod : d.nombre;
    const f = b.r.fecha as { seconds?: number } | undefined;
    return { id: b.id, tipo: b.tipo, ref: b.ref, nombre: String(nombre ?? "Ficha"), estado: (b.r.estado as MiSolicitud["estado"]) ?? "pendiente", fecha: f?.seconds ?? 0 };
  }));
  return out.sort((a, b) => b.fecha - a.fecha);
}
