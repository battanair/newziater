import type { Metadata } from "next";
import { paginaProductoras } from "@/lib/data";
import { ProductoraCard } from "@/components/Cards";
import { Paginacion } from "@/components/Paginacion";

export const revalidate = 3600;

type SP = Promise<{ despues?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const { despues } = await searchParams;
  return {
    title: "Compañías y productoras de artes escénicas",
    description: "Compañías de teatro, danza e improvisación y productoras escénicas, con su repertorio.",
    alternates: { canonical: "/companias" },
    robots: despues ? { index: false, follow: true } : undefined,
  };
}

export default async function CompaniasPage({ searchParams }: { searchParams: SP }) {
  const { despues } = await searchParams;
  const { items, siguiente } = await paginaProductoras({ despues });
  return (
    <main className="wrap section">
      <h1 className="h1" style={{ marginBottom: 32 }}>Compañías</h1>
      <div className="grid-people">{items.map((p) => <ProductoraCard key={p.id} p={p} />)}</div>
      <Paginacion base="/companias" params={{}} siguiente={siguiente} primera={!despues} />
    </main>
  );
}
