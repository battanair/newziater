import { NextResponse } from "next/server";
import { indiceBusqueda } from "@/lib/data";

// Índice de búsqueda cacheado 5 minutos en el CDN: una sola lectura a Firestore
// por cada 5 minutos, da igual cuántas personas busquen.
export const revalidate = 300;

export async function GET() {
  const items = await indiceBusqueda();
  return NextResponse.json(items, {
    headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=3600" },
  });
}
