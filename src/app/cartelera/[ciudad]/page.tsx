import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cartelera } from "@/lib/data";
import { hoyES, sumarDias } from "@/lib/format";
import { CiudadesCartelera, DiasCartelera, EventosCartelera } from "@/components/Cartelera";

export const revalidate = 600;

type P = Promise<{ ciudad: string }>;

async function datos(slug: string) {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  const hoy = hoyES();
  const c = await cartelera(hoy);
  const ciudad = c.ciudades.find((x) => x.slug === slug);
  if (!ciudad) return null;
  return { hoy, ciudad, ciudades: c.ciudades, funciones: c.funciones.filter((f) => f.slug === slug) };
}

export async function generateMetadata({ params }: { params: P }): Promise<Metadata> {
  const d = await datos((await params).ciudad);
  if (!d) return { title: "Cartelera", robots: { index: false } };
  const n = d.ciudad.nombre;
  return {
    title: `Teatro en ${n} esta semana`,
    description: `Qué ver en ${n}: obras de teatro, danza, circo e impro en cartel esta semana, con horarios, salas y entradas.`,
    alternates: { canonical: `/cartelera/${d.ciudad.slug}` },
  };
}

export default async function CarteleraCiudad({ params }: { params: P }) {
  const d = await datos((await params).ciudad);
  if (!d) notFound();
  const finSemana = sumarDias(d.hoy, 6);
  const semana = d.funciones.filter((f) => f.fecha <= finSemana);
  const despues = d.funciones.filter((f) => f.fecha > finSemana);
  const obras = new Set(d.funciones.map((f) => f.obra.id)).size;

  return (
    <main className="wrap section">
      <EventosCartelera funciones={d.funciones} />
      <p className="eyebrow" style={{ marginBottom: 12 }}><Link href="/cartelera">Cartelera</Link> · {d.ciudad.nombre}</p>
      <h1 className="h1" style={{ marginBottom: 12 }}>Esta semana en {d.ciudad.nombre}</h1>
      <p className="lead soft" style={{ maxWidth: 680, marginTop: 0 }}>{obras} {obras === 1 ? "obra" : "obras"} con funciones anunciadas en los próximos dos meses.</p>
      <div style={{ margin: "20px 0 36px" }}><CiudadesCartelera ciudades={d.ciudades} actual={d.ciudad.slug} /></div>

      {semana.length ? <DiasCartelera funciones={semana} hoy={d.hoy} /> : <p className="soft">No hay funciones en {d.ciudad.nombre} los próximos siete días. Mira lo que viene más adelante.</p>}

      {despues.length ? (
        <section style={{ marginTop: 48 }}>
          <h2 className="h2" style={{ marginBottom: 16 }}>Más adelante en {d.ciudad.nombre}</h2>
          <DiasCartelera funciones={despues.slice(0, 60)} hoy={d.hoy} />
        </section>
      ) : null}
    </main>
  );
}
