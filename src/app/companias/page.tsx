import type { Metadata } from "next";
import { listProductoras } from "@/lib/data";
import { ProductoraCard } from "@/components/Cards";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Compañías y productoras de artes escénicas",
  description: "Compañías de teatro, danza e improvisación y productoras escénicas, con su repertorio.",
  alternates: { canonical: "/companias" },
};

export default async function CompaniasPage() {
  const prods = await listProductoras();
  return (
    <main className="wrap section">
      <h1 className="h1" style={{ marginBottom: 32 }}>Compañías</h1>
      <div className="grid-people">{prods.map((p) => <ProductoraCard key={p.id} p={p} />)}</div>
    </main>
  );
}
