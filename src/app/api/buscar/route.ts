import { NextResponse } from "next/server";
import { buscar } from "@/lib/data";
import type { SearchItem } from "@/lib/types";

// Búsqueda instantánea: una consulta por colección con el prefijo más largo,
// máximo 8 resultados. Cacheada 5 minutos en el CDN por cada texto buscado.
const TIPOS: SearchItem["t"][] = ["obra", "persona", "productora", "sala"];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").slice(0, 80);
  const t = url.searchParams.get("t");
  const tipos = t ? TIPOS.filter((x) => t.split(",").includes(x)) : TIPOS;
  const items = q.trim().length >= 2 ? await buscar(q, tipos) : [];
  return NextResponse.json(items, { headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=3600" } });
}
