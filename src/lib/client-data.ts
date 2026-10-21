"use client";

import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { auth, db } from "./firebase-client";
import type { Credito, Obra, Persona } from "./types";
import { clavesDe } from "./claves";

const withId = <T,>(s: { id: string; data: () => unknown }) => ({ id: s.id, ...(s.data() as object) }) as T;

/** Ficha de artista que pertenece al usuario: la de id = uid o la que ha reclamado (coincide = uid). */
export async function miPersona(uid: string): Promise<Persona | null> {
  const direct = await getDoc(doc(db, "persona", uid));
  if (direct.exists()) return withId<Persona>(direct);
  const q = await getDocs(query(collection(db, "persona"), where("coincide", "==", uid)));
  return q.empty ? null : withId<Persona>(q.docs[0]);
}

export async function obrasCreadasPor(uid: string): Promise<Obra[]> {
  const q = await getDocs(query(collection(db, "obra"), where("creacion", "==", uid)));
  return q.docs.map((d) => withId<Obra>(d));
}

export async function creditosDe(campo: "id_persona" | "id_obra", id: string): Promise<Credito[]> {
  const q = await getDocs(query(collection(db, "persona_obra"), where(campo, "==", id)));
  return q.docs.map((d) => withId<Credito>(d));
}

export async function leer<T>(col: string, id: string): Promise<T | null> {
  const s = await getDoc(doc(db, col, id));
  return s.exists() ? withId<T>(s) : null;
}

/** Crea la ficha propia de un artista nuevo (id del documento = uid, igual que las fichas actuales). */
export async function crearMiPersona(uid: string, datos: { Nombre: string; Apellidos?: string }) {
  await setDoc(doc(db, "persona", uid), {
    Nombre: datos.Nombre.trim().slice(0, 100),
    Apellidos: (datos.Apellidos ?? "").trim().slice(0, 150),
    coincide: uid,
    creacion: uid,
    artesEscenicas: "si",
    claves: clavesDe(datos.Nombre, datos.Apellidos),
  });
  return uid;
}

/** Ficha de una persona que aún no tiene cuenta (para poder acreditarla). */
export async function crearPersonaSinCuenta(nombre: string) {
  const uid = auth.currentUser!.uid;
  const [Nombre, ...rest] = nombre.trim().split(/\s+/);
  const ref = await addDoc(collection(db, "persona"), {
    Nombre: Nombre.slice(0, 100),
    Apellidos: rest.join(" ").slice(0, 150),
    coincide: "",
    creacion: uid,
    artesEscenicas: "si",
    claves: clavesDe(nombre),
  });
  return ref.id;
}

export async function anadirCredito(c: Omit<Credito, "id" | "estado" | "creado_por">, confirmado: boolean) {
  const ref = await addDoc(collection(db, "persona_obra"), {
    id_obra: c.id_obra,
    id_persona: c.id_persona,
    puesto: (c.puesto ?? "").slice(0, 100),
    titulo: (c.titulo ?? "").slice(0, 150),
    fecha_inicio: String(c.fecha_inicio ?? "").slice(0, 10),
    fecha_fin: String(c.fecha_fin ?? "").slice(0, 10),
    estado: confirmado ? "confirmado" : "pendiente",
    creado_por: auth.currentUser!.uid,
  });
  return ref.id;
}

export async function confirmarCredito(id: string) {
  await updateDoc(doc(db, "persona_obra", id), { estado: "confirmado" });
}

export async function solicitarReclamacion(idPersona: string, metodo: string, contacto: string) {
  const uid = auth.currentUser!.uid;
  await setDoc(doc(db, "reclamaciones", `${idPersona}_${uid}`), {
    id_persona: idPersona,
    uid,
    metodo: metodo.slice(0, 30),
    contacto: contacto.slice(0, 200),
    estado: "pendiente",
    fecha: serverTimestamp(),
  });
}
