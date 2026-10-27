import type { Metadata } from "next";
import Link from "next/link";
import { todasLasSalas } from "@/lib/data";
import { SalaCard } from "@/components/Cards";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Salas y teatros",
  description: "Salas de teatro, danza y artes escénicas: qué se ha representado en cada una y qué está en cartel.",
  alternates: { canonical: "/salas" },
};

export default async function SalasPage() {
  const salas = await todasLasSalas();
  // Agrupadas por ciudad, las ciudades con más salas primero
  const porCiudad = new Map<string, typeof salas>();
  for (const s of salas) {
    const c = s.ciudad?.trim() || "Otras";
    porCiudad.set(c, [...(porCiudad.get(c) ?? []), s]);
  }
  const ciudades = [...porCiudad.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], "es"));

  return (
    <main className="wrap section">
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 16, marginBottom: 32 }}>
        <h1 className="h1" style={{ margin: 0 }}>Salas</h1>
        <Link href="/panel/sala/nueva" className="btn btn-primary">¿Tienes una sala? Dala de alta</Link>
      </div>
      {ciudades.length ? (
        ciudades.map(([ciudad, lista]) => (
          <section key={ciudad} style={{ marginBottom: 48 }}>
            <h2 className="h2" style={{ marginBottom: 16 }}>{ciudad}</h2>
            <div className="grid-posters">{lista.map((s) => <SalaCard key={s.id} sala={s} />)}</div>
          </section>
        ))
      ) : (
        <p className="lead soft">Todavía no hay salas en Ziater. Si programas una sala o un teatro, sé la primera: tendrá su ficha con todo lo que se ha representado en ella y su cartelera.</p>
      )}
    </main>
  );
}
