import type { Metadata } from "next";
import { paginaPersonas } from "@/lib/data";
import { PersonaCard } from "@/components/Cards";
import { Paginacion } from "@/components/Paginacion";
import { SearchBox } from "@/components/SearchBox";

export const revalidate = 3600;

type SP = Promise<{ despues?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const { despues } = await searchParams;
  return {
    title: "Artistas y profesionales de las artes escénicas",
    description: "Actrices, actores, directores, dramaturgos y técnicos de teatro y artes vivas, con su trayectoria completa.",
    alternates: { canonical: "/personas" },
    robots: despues ? { index: false, follow: true } : undefined,
  };
}

export default async function PersonasPage({ searchParams }: { searchParams: SP }) {
  const { despues } = await searchParams;
  const { items, siguiente } = await paginaPersonas({ despues });
  return (
    <main className="wrap section">
      <h1 className="h1" style={{ marginBottom: 20 }}>Artistas</h1>
      <div style={{ maxWidth: 520, marginBottom: 32 }}><SearchBox /></div>
      <div className="grid-people">{items.map((p) => <PersonaCard key={p.id} persona={p} />)}</div>
      <Paginacion base="/personas" params={{}} siguiente={siguiente} primera={!despues} />
    </main>
  );
}
