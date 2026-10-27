import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/firebase-admin";

// Limpieza de fotos de Cloudinary (solo administración).
//  - «listar»: fotos subidas desde la web nueva (carpeta ziater/), con fecha y peso.
//  - «borrar»: borra las que el panel ha comprobado que ya no usa ninguna ficha.
// Nunca toca fotos fuera de ziater/ (las de la web antigua) ni fotos de menos de 30 días.
const PREFIJO = "ziater/";
const DIAS = 30;

function cloudinary() {
  const secret = process.env.CLOUDINARY_API_SECRET;
  const key = process.env.CLOUDINARY_API_KEY ?? process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!secret || !key || !cloud) return null;
  return { base: `https://api.cloudinary.com/v1_1/${cloud}/resources/image/upload`, auth: "Basic " + Buffer.from(`${key}:${secret}`).toString("base64") };
}

type Recurso = { public_id: string; created_at: string; bytes: number };

export async function POST(req: Request) {
  const user = await verifyRequest(req);
  if (!user?.admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const c = cloudinary();
  if (!c) return NextResponse.json({ error: "Cloudinary no está configurado" }, { status: 500 });
  const body = (await req.json().catch(() => ({}))) as { accion?: string; ids?: unknown };
  const limite = Date.now() - DIAS * 86400_000;

  if (body.accion === "listar") {
    const fotos: Recurso[] = [];
    let cursor = "";
    for (let i = 0; i < 20; i++) {
      const url = `${c.base}?prefix=${encodeURIComponent(PREFIJO)}&max_results=500${cursor ? `&next_cursor=${cursor}` : ""}`;
      const r = await fetch(url, { headers: { authorization: c.auth }, cache: "no-store" });
      if (!r.ok) return NextResponse.json({ error: `Cloudinary respondió ${r.status}` }, { status: 502 });
      const j = (await r.json()) as { resources: Recurso[]; next_cursor?: string };
      fotos.push(...j.resources.map((x) => ({ public_id: x.public_id, created_at: x.created_at, bytes: x.bytes })));
      if (!j.next_cursor) break;
      cursor = j.next_cursor;
    }
    return NextResponse.json({ fotos, dias: DIAS });
  }

  if (body.accion === "borrar") {
    const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === "string" && x.startsWith(PREFIJO) && !x.includes("..")).slice(0, 300) : [];
    if (!ids.length) return NextResponse.json({ borradas: 0 });
    // Se vuelve a comprobar la antigüedad en Cloudinary: nunca se borra nada reciente
    let borradas = 0;
    for (let i = 0; i < ids.length; i += 100) {
      const lote = ids.slice(i, i + 100);
      const info = await fetch(`${c.base}?${lote.map((id) => `public_ids[]=${encodeURIComponent(id)}`).join("&")}&max_results=100`, { headers: { authorization: c.auth }, cache: "no-store" });
      if (!info.ok) continue;
      const viejas = ((await info.json()) as { resources: Recurso[] }).resources.filter((x) => Date.parse(x.created_at) < limite).map((x) => x.public_id);
      if (!viejas.length) continue;
      const r = await fetch(`${c.base}?${viejas.map((id) => `public_ids[]=${encodeURIComponent(id)}`).join("&")}`, { method: "DELETE", headers: { authorization: c.auth } });
      if (r.ok) {
        const j = (await r.json()) as { deleted?: Record<string, string> };
        borradas += Object.values(j.deleted ?? {}).filter((v) => v === "deleted").length;
      }
    }
    return NextResponse.json({ borradas });
  }

  return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
}
