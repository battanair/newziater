import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { verifyRequest } from "@/lib/firebase-admin";
import { CACHE_TAG, validId } from "@/lib/data";

// Tras guardar cambios, el panel llama aquí para que la ficha pública se
// actualice al momento (y Google vea la versión nueva) sin esperar a la caché.
export async function POST(req: Request) {
  const user = await verifyRequest(req);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { obras?: unknown; personas?: unknown; salas?: unknown };
  const ids = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && validId(x)).slice(0, 50) : []);

  revalidateTag(CACHE_TAG);
  for (const id of ids(body.obras)) revalidatePath(`/obra/${id}`);
  for (const id of ids(body.personas)) revalidatePath(`/persona/${id}`);
  for (const id of ids(body.salas)) revalidatePath(`/sala/${id}`);
  if (ids(body.salas).length) revalidatePath("/salas");
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
