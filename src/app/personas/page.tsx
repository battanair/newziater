import type { Metadata } from "next";
import { listPersonas } from "@/lib/data";
import { PersonaCard } from "@/components/Cards";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Artistas y profesionales de las artes escénicas",
  description: "Actrices, actores, directores, dramaturgos y técnicos de teatro y artes vivas, con su trayectoria completa.",
  alternates: { canonical: "/personas" },
};

export default async function PersonasPage() {
  const personas = (await listPersonas()).filter((p) => p.Nombre?.trim());
  return (
    <main className="wrap section">
      <h1 className="h1" style={{ marginBottom: 8 }}>Artistas</h1>
      <p className="muted" style={{ marginTop: 0, marginBottom: 32 }}>{personas.length} perfiles</p>
      <div className="grid-people">{personas.map((p) => <PersonaCard key={p.id} persona={p} />)}</div>
    </main>
  );
}
