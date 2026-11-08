import { NextResponse } from "next/server";
import { buscar } from "@/lib/data";
import { ipDe, limitar } from "@/lib/limite";
import type { SearchItem } from "@/lib/types";

// Búsqueda instantánea: una consulta por colección con el prefijo más largo,
// máximo 8 resultados. Cacheada 5 minutos en el CDN por cada texto buscado.
const TIPOS: SearchItem["t"][] = ["obra", "persona", "productora", "sala"];

export async function GET(req: Request) {
  if (!limitar(`buscar:${ipDe(req)}`, 90)) return NextResponse.json({ error: "Demasiadas búsquedas, espera un momento" }, { status: 429, headers: { "retry-after": "30" } });
  const url = new URL(req.url);
  // Solo letras, números, espacios y signos básicos; nada más llega a la base de datos
  const q = (url.searchParams.get("q") ?? "").normalize("NFC").replace(/[^\p{L}\p{N}\s'’.\-&]/gu, " ").slice(0, 80);
  const t = url.searchParams.get("t");
  const tipos = t ? TIPOS.filter((x) => t.split(",").includes(x)) : TIPOS;
  const items = q.trim().length >= 2 ? await buscar(q, tipos) : [];
  return NextResponse.json(items, { headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=3600" } });
}
