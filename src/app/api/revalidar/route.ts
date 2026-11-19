import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { verifyRequest } from "@/lib/firebase-admin";
import { CACHE_TAG, validId } from "@/lib/data";
import { limitar } from "@/lib/limite";

// Tras guardar cambios, el panel llama aquí para que la ficha pública se
// actualice al momento (y Google vea la versión nueva) sin esperar a la caché.
export async function POST(req: Request) {
  const user = await verifyRequest(req);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!limitar(`revalidar:${user.uid}`, 30)) return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 });

  const body = (await req.json().catch(() => ({}))) as { obras?: unknown; personas?: unknown; salas?: unknown };
  const ids = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && validId(x)).slice(0, 50) : []);

  revalidateTag(CACHE_TAG);
  // Las páginas viven en /es/… y /en/… (el español se sirve sin prefijo, pero por dentro es /es)
  const ambos = (p: string, tipo?: "layout" | "page") => { for (const l of ["es", "en"]) revalidatePath(`/${l}${p === "/" ? "" : p}`, tipo); };
  for (const id of ids(body.obras)) ambos(`/obra/${id}`);
  for (const id of ids(body.personas)) ambos(`/persona/${id}`);
  for (const id of ids(body.salas)) ambos(`/sala/${id}`);
  if (ids(body.salas).length) ambos("/salas");
  if (ids(body.obras).length || ids(body.salas).length) ambos("/cartelera", "layout");
  ambos("/");
  return NextResponse.json({ ok: true });
}
