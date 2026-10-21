import type { Metadata } from "next";
import Link from "next/link";
import { paginaObras, type OrdenObras } from "@/lib/data";
import { ObraCard } from "@/components/Cards";
import { Paginacion } from "@/components/Paginacion";
import { GENEROS } from "@/lib/format";

export const revalidate = 3600;

const ORDENES: { k: OrdenObras; l: string }[] = [
  { k: "valoradas", l: "Mejor valoradas" },
  { k: "recientes", l: "Recién añadidas" },
  { k: "titulo", l: "A–Z" },
];

type SP = Promise<{ genero?: string; orden?: string; despues?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const { genero, despues } = await searchParams;
  return {
    title: genero ? `Obras de ${genero.toLowerCase()}` : "Obras de teatro, danza y artes escénicas",
    description: "Catálogo de obras de teatro, danza, circo e improvisación: fichas con elenco, equipo artístico, valoraciones y compañías.",
    alternates: { canonical: genero ? `/obras?genero=${encodeURIComponent(genero)}` : "/obras" },
    // Las páginas siguientes del listado no se indexan: Google llega a cada ficha por el sitemap
    robots: despues ? { index: false, follow: true } : undefined,
  };
}

export default async function ObrasPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const orden: OrdenObras = ORDENES.some((o) => o.k === sp.orden) ? (sp.orden as OrdenObras) : "valoradas";
  const genero = sp.genero && GENEROS.includes(sp.genero) ? sp.genero : undefined;
  const { items, siguiente } = await paginaObras({ orden, genero, despues: sp.despues });

  const link = (p: { orden?: string; genero?: string }) => {
    const q = new URLSearchParams(Object.entries({ orden, genero, ...p }).filter(([, v]) => v) as [string, string][]);
    return `/obras?${q}`;
  };

  return (
    <main className="wrap section">
      <h1 className="h1" style={{ marginBottom: 20 }}>{genero ? `Obras · ${genero}` : "Obras"}</h1>
      <nav aria-label="Ordenar" className="tabs" style={{ marginBottom: 12 }}>
        {ORDENES.map((o) => <Link key={o.k} href={link({ orden: o.k })} className="tab" aria-selected={o.k === orden} style={{ display: "inline-flex", alignItems: "center" }}>{o.l}</Link>)}
      </nav>
      <nav aria-label="Géneros" style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "0 0 32px" }}>
        <Link href={link({ genero: "" })} className={`chip ${!genero ? "chip-foco" : ""}`} style={{ minHeight: 40, padding: "0 14px", fontSize: 14 }}>Todos los géneros</Link>
        {GENEROS.map((g) => <Link key={g} href={link({ genero: g === genero ? "" : g })} className={`chip ${g === genero ? "chip-foco" : ""}`} style={{ minHeight: 40, padding: "0 14px", fontSize: 14 }}>{g}</Link>)}
      </nav>
      {items.length ? (
        <div className="grid-posters">{items.map((o) => <ObraCard key={o.id} obra={o} />)}</div>
      ) : (
        <p className="soft">{orden === "valoradas" ? "Todavía no hay obras valoradas aquí. Prueba con «Recién añadidas»." : "No hay obras con esos filtros."}</p>
      )}
      <Paginacion base="/obras" params={{ orden, genero }} siguiente={siguiente} primera={!sp.despues} />
    </main>
  );
}
