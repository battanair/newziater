// TEMPORAL: diagnóstico de las selecciones de portada. Solo lectura; se borrará.
import { NextResponse } from "next/server";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { serverDb as db } from "@/lib/firebase-server";
import { obrasMejorValoradas, obrasRecientes } from "@/lib/data";

export const dynamic = "force-dynamic";

async function probar(nombre: string, f: () => Promise<unknown[]>) {
  try { const r = await f(); return { nombre, n: r.length }; } catch (e) { return { nombre, error: String((e as Error).message).slice(0, 200) }; }
}

export async function GET() {
  const res = await Promise.all([
    probar("puntuacion", async () => (await getDocs(query(collection(db, "obra"), orderBy("puntuacion", "desc"), limit(12)))).docs),
    probar("nota", async () => (await getDocs(query(collection(db, "obra"), orderBy("nota", "desc"), limit(12)))).docs),
    probar("sin orden", async () => (await getDocs(query(collection(db, "obra"), limit(24)))).docs),
    probar("titulo", async () => (await getDocs(query(collection(db, "obra"), orderBy("titulo"), limit(24)))).docs),
    probar("obrasMejorValoradas", () => obrasMejorValoradas(12)),
    probar("obrasRecientes", () => obrasRecientes(12)),
  ]);
  return NextResponse.json({ version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7), res });
}
